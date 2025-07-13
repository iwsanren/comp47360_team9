# Importing.
from flask import Flask, jsonify, Response
import joblib
import pandas as pd
import requests
from datetime import datetime
import pytz
import holidays
import os
from dotenv import load_dotenv
from flask_cors import CORS
import json
from collections import OrderedDict
from shapely import wkt
from shapely.geometry import mapping

load_dotenv(override=True) # Load environment variables from .env file

app = Flask(__name__)
CORS(app)

# Loading trained model.
model = joblib.load('./xgboost_taxi_model.joblib')

# Loading zone data.
zones_df = pd.read_csv('./manhattan_taxi_zones.csv')

# Loading filled busyness data.
zone_stats = pd.read_csv('./zone_hourly_busyness_stats.csv')
zone_stats["PULocationID"] = zone_stats["PULocationID"].astype(int)

# Feature order required by the model.
MODEL_FEATURE_ORDER = [
    "pickup_hour", "day_of_week", "is_weekend", "is_holiday", "is_peak_hour",
    "temp", "humidity", "wind_speed", "feels_like",
    "centroid_lat", "centroid_lon", "PULocationID",
    "weather_Rain", "weather_Clouds", "weather_Clear", "weather_Snow",
    "weather_Mist", "weather_Haze", "weather_Smoke", "weather_Drizzle",
    "weather_Fog", "weather_Thunderstorm",
    "Shape_Area", "Shape_Leng"
]

# Weather API key.
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

# Function to classify busyness.
def classify_busyness_zone_hour(pred, zone_id, hour, day):
    match = zone_stats[
        (zone_stats["PULocationID"] == zone_id) &
        (zone_stats["pickup_hour"] == hour) &
        (zone_stats["day_of_week"] == day)
    ]

    if match.empty:
        return "normal"  # Fallback if missing.

    p25 = match.iloc[0]["p25"]
    p75 = match.iloc[0]["p75"]

    if pred < p25:
        return "not busy"
    elif pred > p75:
        return "busy"
    else:
        return "normal"

# Root route to provide API info
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "Manhattan My Way ML API",
        "version": "1.0.0",
        "endpoints": {
            "/predict-all": "GET/POST - Get busyness predictions for all Manhattan zones",
            "/health": "GET - Health check endpoint"
        },
        "status": "running"
    })

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring and load balancing."""
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'status': 'unhealthy',
                'error': 'Model not loaded',
                'timestamp': datetime.now().isoformat()
            }), 503
        
        # Check if required data files exist
        if zones_df is None or zone_stats is None:
            return jsonify({
                'status': 'unhealthy',
                'error': 'Required data files not loaded',
                'timestamp': datetime.now().isoformat()
            }), 503
        
        # Basic health check
        health_data = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'model_loaded': True,
            'zones_count': len(zones_df),
            'stats_count': len(zone_stats),
            'environment': os.getenv('FLASK_ENV', 'development'),
            'weather_api_configured': bool(WEATHER_API_KEY)
        }
        
        return jsonify(health_data), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/predict-all', methods=['GET', 'POST'])
def predict_all():
    try:
        # Current time and date features.
        now = datetime.now(pytz.timezone("America/New_York"))
        # Use this hour if minutes ≤ 30, else use next hour.
        pickup_hour = now.hour if now.minute <= 30 else (now.hour + 1) % 24
        day_of_week = now.weekday()
        is_weekend = int(day_of_week >= 5)
        is_peak_hour = int(pickup_hour in [7, 8, 16, 17, 18])
        is_holiday = int(now.date() in holidays.UnitedStates())

        # Fetching current weather.
        weather_url = (
            f"http://api.openweathermap.org/data/2.5/weather?"
            f"lat=40.728333&lon=-73.994167&appid={WEATHER_API_KEY}&units=metric"
        )
        weather_data = requests.get(weather_url).json()
        temp = weather_data['main']['temp']
        feels_like = weather_data['main']['feels_like']
        humidity = weather_data['main']['humidity']
        wind_speed = weather_data['wind']['speed']
        weather_main = weather_data['weather'][0]['main']

        # One-hot encoding weather conditions.
        weather_features = [
            'Rain', 'Clouds', 'Clear', 'Snow', 'Mist', 
            'Haze', 'Smoke', 'Drizzle', 'Fog', 'Thunderstorm'
        ]
        weather_dict = {
            f'weather_{w}': int(weather_main == w) 
            for w in weather_features
        }

        # Generating predictions for each zone.
        features = []
        for _, row in zones_df.iterrows():
           
            input_data = {
                "pickup_hour": pickup_hour,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "is_peak_hour": is_peak_hour,
                "temp": temp,
                "humidity": humidity,
                "wind_speed": wind_speed,
                "feels_like": feels_like,
                "centroid_lat": row['centroid_lat'],
                "centroid_lon": row['centroid_lon'],
                "PULocationID": int(row['OBJECTID']),
                "Shape_Area": row['Shape_Area'],
                "Shape_Leng": row['Shape_Leng'],
            }
            input_data.update(weather_dict)

            # Creating a DataFrame in correct order,
            input_df = pd.DataFrame([input_data])[MODEL_FEATURE_ORDER]

            # Predicting and classifying zones.
            pred = model.predict(input_df)[0]
            busyness_level = classify_busyness_zone_hour(
                pred, int(row['OBJECTID']), pickup_hour, day_of_week
            )

            geometry = OrderedDict()
            
            geom = row.get('geometry', '')

            if geom.startswith("POLYGON (("):
                # handle POLYGON
                coords_text = geom.replace("POLYGON ((", "").replace("))", "")
                points = coords_text.split(", ")
                coords = []
                for pt in points:
                    lon, lat = pt.split(" ")
                    coords.append([float(lon), float(lat)])
                geometry["type"] = "Polygon"
                geometry["coordinates"] = [coords]

            elif geom.startswith("MULTIPOLYGON ((("):
                # handle MULTIPOLYGON
                geo = wkt.loads(geom)
                geometry = mapping(geo)
            
            # Appending the results.
            features.append({
                "type": "Feature",
                "properties": {
                    "PULocationID": int(row['OBJECTID']),
                    "zone": row.get('zone', ''),
                    "borough": row.get('borough', ''),
                    "centroid_lat": row['centroid_lat'],
                    "centroid_lon": row['centroid_lon'],
                    "Shape_Area": row['Shape_Area'],
                    "Shape_Leng": row['Shape_Leng'],
                    "busyness": round(float(pred), 2),
                    "busyness_level": busyness_level,
                    # "geom": row.get('geometry', ''),
                },
                "geometry": geometry,
            })

            geojson = {
                "type": "FeatureCollection",
                "properties": {
                    "timestamp": now.strftime('%Y-%m-%d %H:%M'),
                    "weather": weather_main,
                    "is_holiday": bool(is_holiday),
                },
                "features": features
            }


        return Response(
            json.dumps(geojson, ensure_ascii=False),
            mimetype='application/json'
        )

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
