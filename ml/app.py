# Importing.
from flask import Flask, jsonify, Response, request
import joblib
import pandas as pd
import requests
from datetime import datetime, timezone
import pytz
import holidays
import os
from dotenv import load_dotenv
from flask_cors import CORS
import json
from collections import OrderedDict
from shapely import wkt
from shapely.geometry import mapping
import jwt

# Import request tracking utilities
from utils.request_tracker import (
    with_request_tracking, 
    log_with_context, 
    setup_logging, 
    get_user_context
)

load_dotenv(override=True) # Load environment variables from .env file

app = Flask(__name__)
CORS(app)

# Setup logging system
setup_logging()

# Loading trained model.
model = joblib.load('./xgboost_taxi_model.joblib')

# Loading zone data.
zones_df = pd.read_csv('./manhattan_taxi_zones.csv')

# Loading filled busyness data.
zone_stats = pd.read_csv('./zone_hourly_busyness_stats.csv')
zone_stats["PULocationID"] = zone_stats["PULocationID"].astype(int)

# Threshold and correction factor for high activity predictions as taxi model underpredicts.
HIGH_THRESHOLD = 200
CORRECTION_FACTOR = 1.412

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
JWT_SECRET = os.getenv('JWT_SECRET')

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
@with_request_tracking
def root():
    log_with_context('info', 'Root endpoint accessed')
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
@with_request_tracking
def health_check():
    """Health check endpoint for monitoring and load balancing."""
    try:
        log_with_context('info', 'Health check requested')
        
        # Check if model is loaded
        if model is None:
            log_with_context('error', 'Health check failed: Model not loaded')
            return jsonify({
                'status': 'unhealthy',
                'error': 'Model not loaded',
                'timestamp': datetime.now().isoformat()
            }), 503
        
        # Check if required data files exist
        if zones_df is None or zone_stats is None:
            log_with_context('error', 'Health check failed: Required data files not loaded')
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
        
        log_with_context('info', 'Health check completed successfully', {
            'zones_count': len(zones_df),
            'stats_count': len(zone_stats)
        })
        
        return jsonify(health_data), 200
        
    except Exception as e:
        log_with_context('error', f'Health check failed with exception: {str(e)}', {
            'error_type': type(e).__name__
        })
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/predict-all', methods=['POST'])
@with_request_tracking
def predict_all():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        log_with_context('warn', 'Prediction request missing or invalid authorization header')
        return {'error': 'Missing or invalid token'}, 401
    
    token = auth_header.split(' ')[1]

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        log_with_context('info', 'JWT token validated successfully')
        
        # Current time and date features.
        time = request.args.get("timestamp") # Format: 1752490800
        if time is not None:
            time = int(time)  
        now = datetime.now(pytz.timezone("America/New_York"))
        if time is not None: 
            now = datetime.fromtimestamp(time, tz=timezone.utc)
            
        log_with_context('info', 'Processing prediction request', {
            'timestamp_provided': time is not None,
            'target_time': now.isoformat()
        })
            
        # Use this hour if minutes ≤ 30, else use next hour.
        pickup_hour = now.hour if now.minute <= 30 else (now.hour + 1) % 24
        day_of_week = now.weekday()
        is_weekend = int(day_of_week >= 5)
        is_peak_hour = int(pickup_hour in [7, 8, 16, 17, 18])
        is_holiday = int(now.date() in holidays.UnitedStates())

        # Fetching current weather.
        weather_url = (
            f"http://api.openweathermap.org/data/2.5/{'weather' if time is None else 'forecast/hourly'}?"
            f"lat=40.728333&lon=-73.994167&appid={WEATHER_API_KEY}&units=metric"
        )

        log_with_context('info', 'Fetching weather data', {
            'api_endpoint': 'weather' if time is None else 'forecast/hourly'
        })

        weather_response = requests.get(weather_url)
        if weather_response.status_code != 200:
            log_with_context('error', 'Weather API request failed', {
                'status_code': weather_response.status_code,
                'response_text': weather_response.text[:200]
            })
            return jsonify({"error": "Failed to fetch weather data"}), 500

        weather_data = weather_response.json()

        if time is not None:
            weather_data = next(filter(lambda x: x["dt"] == time, weather_data['list']), None)
            if weather_data is None:
                log_with_context('error', 'No weather data found for specified timestamp', {
                    'requested_timestamp': time
                })
                return jsonify({"error": "No weather data for specified time"}), 400

        temp = weather_data['main']['temp']
        feels_like = weather_data['main']['feels_like']
        humidity = weather_data['main']['humidity']
        wind_speed = weather_data['wind']['speed']
        weather_main = weather_data['weather'][0]['main']

        log_with_context('info', 'Weather data retrieved successfully', {
            'temperature': temp,
            'condition': weather_main,
            'humidity': humidity
        })

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
        prediction_count = 0
        
        log_with_context('info', f'Starting predictions for {len(zones_df)} zones')
        
        for _, row in zones_df.iterrows():
            prediction_count += 1
           
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

            try:
                # Predicting and applying correction if needed
                pred_raw = model.predict(input_df)[0]
                actual_zone_stats = zone_stats[
                    (zone_stats["PULocationID"] == int(row['OBJECTID'])) &
                    (zone_stats["pickup_hour"] == pickup_hour) &
                    (zone_stats["day_of_week"] == day_of_week)
                ]

                # Fallback.
                true_val = actual_zone_stats["mean"].values[0] if not actual_zone_stats.empty else None

                # Applying correction if underpredicted and above threshold.
                if true_val is not None and pred_raw < true_val and true_val >= HIGH_THRESHOLD:
                    pred = pred_raw * CORRECTION_FACTOR
                else:
                    pred = pred_raw

                busyness_level = classify_busyness_zone_hour(
                    pred, int(row['OBJECTID']), pickup_hour, day_of_week
                )
            except Exception as e:
                log_with_context('error', f'Prediction failed for zone {row["OBJECTID"]}', {
                    'zone_id': int(row['OBJECTID']),
                    'error': str(e)
                })
                # Use default values to continue processing
                pred = 0.0
                busyness_level = "normal"

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

        log_with_context('info', 'Predictions completed successfully', {
            'zones_processed': prediction_count,
            'features_generated': len(features),
            'weather_condition': weather_main
        })

        response = Response(
            json.dumps(geojson, ensure_ascii=False),
            mimetype='application/json'
        )
        
        return response

    except jwt.ExpiredSignatureError:
        log_with_context('warn', 'JWT token expired')
        return jsonify({'error': 'Token expired'}), 403
    except jwt.InvalidTokenError:
        log_with_context('warn', 'Invalid JWT token provided')
        return jsonify({'error': 'Invalid token'}), 403
    except Exception as e:
        log_with_context('error', f'Prediction request failed: {str(e)}', {
            'error_type': type(e).__name__,
            'user_context': get_user_context()
        })
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
