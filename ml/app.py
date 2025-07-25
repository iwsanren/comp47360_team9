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
import numpy as np

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


# Weather API key.
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
JWT_SECRET = os.getenv('JWT_SECRET')

# Load models and data
model = joblib.load("./xgboost_taxi_model.joblib")
zones_df = pd.read_csv("./manhattan_taxi_zones.csv")

# Loading filled busyness data.
zone_stats = pd.read_csv("./zone_hourly_busyness_stats.csv")
zone_stats["PULocationID"] = zone_stats["PULocationID"].astype(int)

subway_model = joblib.load("./subway_ridership_model_xgboost_final.joblib")
subway_feature_list = json.load(open("./required_features.json"))
station_zone_map = pd.read_csv("./station_to_zone_mapping.csv")
subway_stats = pd.read_csv("./zone_subway_busyness_stats.csv")
subway_stations = pd.read_csv("./subway_stations.csv")

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

def prepare_subway_features(timestamp, weather, station_df):
    hour = timestamp.hour
    day_of_week = timestamp.weekday()
    month = timestamp.month
    is_weekend = int(day_of_week >= 5)
    is_rush_hour = int(hour in [7, 8, 9, 16, 17, 18])
    is_holiday = int(timestamp.date() in holidays.UnitedStates())

    df = station_df.copy()
    df["hour"] = hour
    df["day_of_week"] = day_of_week
    df["month"] = month
    df["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24)
    df["dow_sin"] = np.sin(2 * np.pi * day_of_week / 7)
    df["dow_cos"] = np.cos(2 * np.pi * day_of_week / 7)
    df["month_sin"] = np.sin(2 * np.pi * month / 12)
    df["month_cos"] = np.cos(2 * np.pi * month / 12)
    df["is_rush_hour"] = is_rush_hour
    df["is_weekend"] = is_weekend
    df["is_holiday"] = is_holiday

    temp = weather["temp"]
    df["temp"] = temp
    df["feels_like"] = weather["feels_like"]
    df["humidity"] = weather["humidity"]
    df["wind_speed"] = weather["wind_speed"]

    main = weather["weather_main"].lower()
    df["has_rain"] = int("rain" in main)
    df["has_snow"] = int("snow" in main)
    df["is_freezing"] = int(temp <= 0)
    df["is_hot"] = int(temp >= 30)

    def bin_temp(t):
        if pd.isna(t):
            return np.nan
        if t < 0: return "freezing"
        elif t < 10: return "cold"
        elif t < 20: return "mild"
        elif t < 30: return "warm"
        return "hot"

    df["temp_category"] = df["temp"].apply(bin_temp)
    df["temp_category"] = pd.Categorical(df["temp_category"])
    return df

# Function to classify busyness.
def classify_combined_busyness(pred, zone_id, hour, day):
    match = subway_stats[
        (subway_stats["PULocationID"] == zone_id) &
        (subway_stats["hour"] == hour) &
        (subway_stats["day_of_week"] == day)
    ]
    if match.empty:
        return "normal"
    p25, p75 = match.iloc[0]["p25"], match.iloc[0]["p75"]
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
    token = request.headers.get("Authorization", "").replace("Bearer ", "")

    # Skip auth if DEV_MODE is enabled
    if os.getenv("DEV_MODE", "false").lower() == "true":
        pass
    else:
        try:
            jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
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
    pickup_hour = now.hour if now.minute < 30 else (now.hour + 1) % 24
    day_of_week = now.weekday()
    is_weekend = int(day_of_week >= 5)
    is_holiday = int(now.date() in holidays.UnitedStates())
    is_peak_hour = int(pickup_hour in [7, 8, 9, 16, 17, 18])

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
        # For forecast data, find the specific time entry first
        forecast_data = next(filter(lambda x: x["dt"] == time, weather_data['list']), None)
        if forecast_data is None:
            log_with_context('error', 'No weather data found for specified timestamp', {
                'requested_timestamp': time
            })
            return jsonify({"error": "No weather data for specified time"}), 400
        weather_entry = forecast_data
    else:
        # For current weather data, use the main object
        weather_entry = weather_data
    
    # Extract weather condition from the appropriate data structure
    weather_main = weather_entry["weather"][0]["main"]
    weather_dict = {
        f"weather_{w}": int(weather_main == w)
        for w in ["Rain", "Clouds", "Clear", "Snow", "Mist", "Haze", "Smoke", "Drizzle", "Fog", "Thunderstorm"]
    }
        
    temp = weather_entry['main']['temp']
    feels_like = weather_entry['main']['feels_like']
    humidity = weather_entry['main']['humidity']
    wind_speed = weather_entry['wind']['speed']

    taxi_preds = {}

    for _, row in zones_df.iterrows():
        zone_id = int(row["OBJECTID"])
        features = {
            "pickup_hour": pickup_hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "is_peak_hour": is_peak_hour,
            "temp": temp,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "feels_like": feels_like,
            "centroid_lat": row["centroid_lat"],
            "centroid_lon": row["centroid_lon"],
            "PULocationID": zone_id,
            "Shape_Area": row["Shape_Area"],
            "Shape_Leng": row["Shape_Leng"],
        }
        features.update(weather_dict)
        input_df = pd.DataFrame([features])[MODEL_FEATURE_ORDER]
        try:
            taxi_pred = model.predict(input_df)[0]
        except:
            taxi_pred = 0.0
        taxi_preds[zone_id] = taxi_pred

    subway_features = prepare_subway_features(
        now,
        {
            "temp": temp,
            "feels_like": feels_like,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "weather_main": weather_main
        },
        subway_stations
    )

    subway_features["prediction"] = subway_model.predict(subway_features[subway_feature_list])
    subway_zone_preds = (
        subway_features.merge(station_zone_map, on="station_complex_id")
        .groupby("PULocationID")["prediction"]
        .mean()
        .reset_index()
        .rename(columns={"prediction": "subway_busyness"})
    )

    features = []
    for _, row in zones_df.iterrows():
        zone_id = int(row["OBJECTID"])
        taxi_val = float(round(taxi_preds.get(zone_id, 0.0), 2))
        subway_val = subway_zone_preds.loc[
            subway_zone_preds["PULocationID"] == zone_id, "subway_busyness"
        ].values
        subway_val = round(float(subway_val[0]), 2) if len(subway_val) else 0.0
        combined_val = float(round(0.7 * subway_val + 0.3 * taxi_val, 2))
        combined_level = classify_combined_busyness(combined_val, zone_id, pickup_hour, day_of_week)

        geometry = OrderedDict()
        geom = row.get("geometry", "")
        if geom.startswith("POLYGON (("):
            points = geom.replace("POLYGON ((", "").replace("))", "").split(", ")
            coords = [[float(x), float(y)] for x, y in (p.split(" ") for p in points)]
            geometry["type"] = "Polygon"
            geometry["coordinates"] = [coords]
        elif geom.startswith("MULTIPOLYGON (("):
            geometry = mapping(wkt.loads(geom))

        features.append({
            "type": "Feature",
            "properties": {
                "PULocationID": zone_id,
                "zone": row.get("zone", ""),
                "borough": row.get("borough", ""),
                "centroid_lat": row["centroid_lat"],
                "centroid_lon": row["centroid_lon"],
                "Shape_Area": row["Shape_Area"],
                "Shape_Leng": row["Shape_Leng"],
                "busyness": taxi_val,
                "subway_busyness": subway_val,
                "combined_busyness": combined_val,
                "combined_level": combined_level,
            },
            "geometry": geometry
        })

    return jsonify({
        "type": "FeatureCollection",
        "properties": {
            "timestamp": now.strftime("%Y-%m-%d %H:%M"),
            "weather": weather_main,
            "is_holiday": bool(is_holiday),
        },
        "features": features
    })

    # try:
    #     log_with_context('info', 'JWT token validated successfully')
    #     if time is not None:
    #         weather_data = next(filter(lambda x: x["dt"] == time, weather_data['list']), None)
    #         if weather_data is None:
    #             log_with_context('error', 'No weather data found for specified timestamp', {
    #                 'requested_timestamp': time
    #             })
    #             return jsonify({"error": "No weather data for specified time"}), 400

    #     temp = weather_data['main']['temp']
    #     feels_like = weather_data['main']['feels_like']
    #     humidity = weather_data['main']['humidity']
    #     wind_speed = weather_data['wind']['speed']
    #     weather_main = weather_data['weather'][0]['main']

    #     log_with_context('info', 'Weather data retrieved successfully', {
    #         'temperature': temp,
    #         'condition': weather_main,
    #         'humidity': humidity
    #     })

    #     # One-hot encoding weather conditions.
    #     weather_features = [
    #         'Rain', 'Clouds', 'Clear', 'Snow', 'Mist', 
    #         'Haze', 'Smoke', 'Drizzle', 'Fog', 'Thunderstorm'
    #     ]
    #     weather_dict = {
    #         f'weather_{w}': int(weather_main == w) 
    #         for w in weather_features
    #     }

    #     # Generating predictions for each zone.
    #     features = []
    #     prediction_count = 0
        
    #     log_with_context('info', f'Starting predictions for {len(zones_df)} zones')
        
    #     for _, row in zones_df.iterrows():
    #         prediction_count += 1
    #         zone_id = int(row['OBJECTID'])
           
    #         input_data = {
    #             "pickup_hour": pickup_hour,
    #             "day_of_week": day_of_week,
    #             "is_weekend": is_weekend,
    #             "is_holiday": is_holiday,
    #             "is_peak_hour": is_peak_hour,
    #             "temp": temp,
    #             "humidity": humidity,
    #             "wind_speed": wind_speed,
    #             "feels_like": feels_like,
    #             "centroid_lat": row['centroid_lat'],
    #             "centroid_lon": row['centroid_lon'],
    #             "PULocationID": zone_id,
    #             "Shape_Area": row['Shape_Area'],
    #             "Shape_Leng": row['Shape_Leng'],
    #         }
    #         input_data.update(weather_dict)

    #         # Creating a DataFrame in correct order,
    #         input_df = pd.DataFrame([input_data])[MODEL_FEATURE_ORDER]

    #         try:
    #             # Predicting and classifying zones.
    #             pred = model.predict(input_df)[0]
    #             busyness_level = classify_busyness_zone_hour(
    #                 pred, zone_id, pickup_hour, day_of_week
    #             )
    #              # Calculating normalised busyness with clamping.
    #             match = zone_stats[
    #                 (zone_stats["PULocationID"] == zone_id) &
    #                 (zone_stats["pickup_hour"] == pickup_hour) &
    #                 (zone_stats["day_of_week"] == day_of_week)
    #             ]
    #             if not match.empty:
    #                 min_val = match.iloc[0]["min"]
    #                 max_val = match.iloc[0]["max"]
    #                 if max_val > min_val:
    #                     normalised_busyness = (pred - min_val) / (max_val - min_val)
    #                     normalised_busyness = max(0.0, min(1.0, normalised_busyness))  # clamping to [0, 1]
    #                 else:
    #                     normalised_busyness = 0.5
    #             else:
    #                 normalised_busyness = 0.5
    #         except Exception as e:
    #             log_with_context('error', f'Prediction failed for zone {row["OBJECTID"]}', {
    #                 'zone_id': zone_id,
    #                 'error': str(e)
    #             })
    #             # Use default values to continue processing
    #             pred = 0.0
    #             busyness_level = "normal"
    #             normalised_busyness = 0

    #         geometry = OrderedDict()
            
    #         geom = row.get('geometry', '')

    #         if geom.startswith("POLYGON (("):
    #             # handle POLYGON
    #             coords_text = geom.replace("POLYGON ((", "").replace("))", "")
    #             points = coords_text.split(", ")
    #             coords = []
    #             for pt in points:
    #                 lon, lat = pt.split(" ")
    #                 coords.append([float(lon), float(lat)])
    #             geometry["type"] = "Polygon"
    #             geometry["coordinates"] = [coords]

    #         elif geom.startswith("MULTIPOLYGON ((("):
    #             # handle MULTIPOLYGON
    #             geo = wkt.loads(geom)
    #             geometry = mapping(geo)
            
    #         # Appending the results.
    #         # Appending the results.
    #         features.append({
    #             "type": "Feature",
    #             "properties": {
    #                 "PULocationID": zone_id,
    #                 "zone": row.get('zone', ''),
    #                 "borough": row.get('borough', ''),
    #                 "centroid_lat": row['centroid_lat'],
    #                 "centroid_lon": row['centroid_lon'],
    #                 "Shape_Area": row['Shape_Area'],
    #                 "Shape_Leng": row['Shape_Leng'],
    #                 "busyness": round(float(pred), 2),
    #                 "busyness_level": busyness_level,
    #                 "normalised_busyness": round(float(normalised_busyness), 3)
    #             },
    #             "geometry": geometry,
    #         })

    #     geojson = {
    #         "type": "FeatureCollection",
    #         "properties": {
    #             "timestamp": now.strftime('%Y-%m-%d %H:%M'),
    #             "weather": weather_main,
    #             "is_holiday": bool(is_holiday),
    #         },
    #         "features": features
    #     }

    #     log_with_context('info', 'Predictions completed successfully', {
    #         'zones_processed': prediction_count,
    #         'features_generated': len(features),
    #         'weather_condition': weather_main
    #     })

    #     # print(geojson)

    #     response = Response(
    #         json.dumps(geojson, ensure_ascii=False),
    #         mimetype='application/json'
    #     )
        
    #     return response

    # except jwt.ExpiredSignatureError:
    #     log_with_context('warn', 'JWT token expired')
    #     return jsonify({'error': 'Token expired'}), 403
    # except jwt.InvalidTokenError:
    #     log_with_context('warn', 'Invalid JWT token provided')
    #     return jsonify({'error': 'Invalid token'}), 403
    # except Exception as e:
    #     log_with_context('error', f'Prediction request failed: {str(e)}', {
    #         'error_type': type(e).__name__,
    #         'user_context': get_user_context()
    #     })
    #     return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
