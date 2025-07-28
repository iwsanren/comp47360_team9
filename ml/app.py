# Importing.
from flask import Flask, jsonify, request
import joblib
import pandas as pd
import numpy as np
import requests
import json
import pytz
import holidays
import os
import jwt
from dotenv import load_dotenv
from datetime import datetime, timezone
from flask_cors import CORS
from collections import OrderedDict
from shapely import wkt
from shapely.geometry import mapping
from pathlib import Path
from zoneinfo import ZoneInfo

# Import request tracking utilities
from utils.request_tracker import (
    with_request_tracking,
    log_with_context,
    setup_logging,
    get_user_context
)

load_dotenv(override=True)  # Load environment variables from .env file

# ----------------------------------------
# Flask app setup
# ----------------------------------------
app = Flask(__name__)
CORS(app)

# Setup logging system
setup_logging()

# Load API key.
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
JWT_SECRET = os.getenv('JWT_SECRET')

# ----------------------------------------
# Path setup
# ----------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR

# ----------------------------------------
# Underprediction Correction Constants
# ----------------------------------------
HIGH_THRESHOLD = 200       # Defines what is considered a very busy zone (taxi specific).
CORRECTION_FACTOR = 1.412  # How much to scale underpredicted values (again taxi specific).

# ----------------------------------------
# Load models and metadata
# ----------------------------------------
try:
    subway_model = joblib.load(MODELS_DIR / "subway_ridership_model_xgboost_final.joblib")
except Exception as e:
    print("Subway model load failed:", e)
    subway_model = None

try:
    taxi_model = joblib.load(MODELS_DIR / "xgboost_taxi_model.joblib")
except Exception as e:
    print("Taxi model load failed:", e)
    taxi_model = None

with open(MODELS_DIR / "required_features.json") as f:
    subway_features = json.load(f)

# Load static inputs
station_meta = pd.read_csv(BASE_DIR / "subway_stations.csv")
station_to_zone = pd.read_csv(BASE_DIR / "station_to_zone_mapping.csv")
subway_busyness = pd.read_csv(BASE_DIR / "zone_subway_busyness_stats.csv")
taxi_busyness = pd.read_csv(BASE_DIR / "zone_hourly_busyness_stats.csv")
zones_df = pd.read_csv(BASE_DIR / "manhattan_taxi_zones.csv")

# ----------------------------------------
# Scoring logic
# ----------------------------------------
LEVEL_TO_SCORE = {
    "Very Quiet": 0,
    "Quiet": 1,
    "Moderate": 2,
    "Busy": 3,
    "Very Busy": 4,
    "Extremely Busy": 5
}
SCORE_TO_LEVEL = {v: k for k, v in LEVEL_TO_SCORE.items()}

def classify_level(val, p10, p25, p50, p75, p90):
    if pd.isna(val):
        return "Unknown"
    if val < p10: return "Very Quiet"
    if val < p25: return "Quiet"
    if val < p50: return "Moderate"
    if val < p75: return "Busy"
    if val < p90: return "Very Busy"
    return "Extremely Busy"

# ----------------------------------------
# Weather fetcher
# ----------------------------------------
def fetch_weather(time):
    WEATHER_URL = (
        f"http://api.openweathermap.org/data/2.5/{'weather' if time is None else 'forecast/hourly'}?"
        f"lat=40.728333&lon=-73.994167&appid={WEATHER_API_KEY}&units=metric"
    )
    try:
        r = requests.get(WEATHER_URL)
        r.raise_for_status()
        data = r.json()
        if time:
            data = next(filter(lambda x: x["dt"] == time, data['list']), None)
        return {
            "temp": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "weather_main": data["weather"][0]["main"]
        }
    except Exception as e:
        print("Weather API error:", e)
        return {"temp": 15, "feels_like": 15, "humidity": 60, "wind_speed": 3, "weather_main": "Clear"}

# ----------------------------------------
# Subway feature generation
# ----------------------------------------
def create_subway_features(ts, weather):
    hour = ts.hour
    dow = ts.weekday()
    month = ts.month
    df = station_meta.copy()

    df["hour"] = hour
    df["day_of_week"] = dow
    df["month"] = month
    df["is_rush_hour"] = df["hour"].isin([7, 8, 9, 16, 17, 18]).astype(int)
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["is_holiday"] = int(ts.date() in holidays.UnitedStates())
    df["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24)
    df["dow_sin"] = np.sin(2 * np.pi * dow / 7)
    df["dow_cos"] = np.cos(2 * np.pi * dow / 7)
    df["month_sin"] = np.sin(2 * np.pi * month / 12)
    df["month_cos"] = np.cos(2 * np.pi * month / 12)

    df["temp"] = weather["temp"]
    df["humidity"] = weather["humidity"]
    df["wind_speed"] = weather["wind_speed"]
    df["feels_like"] = weather["feels_like"]

    main = weather["weather_main"].lower()
    df["has_rain"] = int("rain" in main)
    df["has_snow"] = int("snow" in main)
    df["is_freezing"] = (df["temp"] < 0).astype(int)
    df["is_hot"] = (df["temp"] > 30).astype(int)

    def temp_category(t):
        if t < 0: return "freezing"
        elif t < 10: return "cold"
        elif t < 20: return "mild"
        elif t < 30: return "warm"
        else: return "hot"
    category_map = {"freezing": 0, "cold": 1, "mild": 2, "warm": 3, "hot": 4}
    df["temp_category"] = df["temp"].apply(temp_category).map(category_map).astype(int)

    df_model = df[subway_features].copy()
    df_model["station_complex_id"] = df["station_complex_id"].values
    return df_model

# ----------------------------------------
# Taxi feature generation
# ----------------------------------------
def create_taxi_features(pulocation_ids, ts, weather):
    df = zones_df[zones_df["OBJECTID"].isin(pulocation_ids)].copy()
    df = df.rename(columns={"OBJECTID": "PULocationID"})

    hour = ts.hour
    dow = ts.weekday()
    is_weekend = int(dow >= 5)
    is_peak_hour = int(hour in [7, 8, 16, 17, 18])
    weather_main = weather["weather_main"]

    weather_cols = ["Rain", "Clouds", "Clear", "Snow", "Mist", "Haze", "Smoke", "Drizzle", "Fog", "Thunderstorm"]
    for w in weather_cols:
        df[f"weather_{w}"] = int(weather_main == w)

    df["pickup_hour"] = hour
    df["day_of_week"] = dow
    df["is_weekend"] = is_weekend
    df["is_holiday"] = int(ts.date() in holidays.UnitedStates())
    df["is_peak_hour"] = is_peak_hour
    df["temp"] = weather["temp"]
    df["humidity"] = weather["humidity"]
    df["wind_speed"] = weather["wind_speed"]
    df["feels_like"] = weather["feels_like"]

    order = [
        "pickup_hour", "day_of_week", "is_weekend", "is_holiday", "is_peak_hour",
        "temp", "humidity", "wind_speed", "feels_like",
        "centroid_lat", "centroid_lon", "PULocationID"
    ] + [f"weather_{w}" for w in weather_cols] + ["Shape_Area", "Shape_Leng"] + ["geometry"]

    return df[order]

# ----------------------------------------
# Root and health endpoints
# ----------------------------------------
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

@app.route('/health', methods=['GET'])
@with_request_tracking
def health_check():
    try:
        log_with_context('info', 'Health check requested')
        health_data = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'model_loaded': True,
            'zones_count': len(zones_df),
            'environment': os.getenv('FLASK_ENV', 'development'),
            'weather_api_configured': bool(WEATHER_API_KEY)
        }
        log_with_context('info', 'Health check completed successfully', {'zones_count': len(zones_df)})
        return jsonify(health_data), 200
    except Exception as e:
        log_with_context('error', f'Health check failed with exception: {str(e)}', {'error_type': type(e).__name__})
        return jsonify({'status': 'unhealthy','error': str(e),'timestamp': datetime.now().isoformat()}), 500

# ----------------------------------------
# Prediction endpoint
# ----------------------------------------
@app.route('/predict-all', methods=['POST'])
@with_request_tracking
def predict_all():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'error': 'Missing or invalid token'}, 401

    token = auth_header.split(' ')[1]
    if os.getenv("DEV_MODE", "false").lower() != "true":
        try:
            jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 403
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    time = int(request.args.get("timestamp")) if request.args.get("timestamp") else None
    ts = datetime.fromtimestamp(time, tz=timezone.utc).astimezone(ZoneInfo("America/New_York")) if time else datetime.now(ZoneInfo("America/New_York"))
    weather = fetch_weather(time)

    subway_level_df = pd.DataFrame()
    taxi_level_df = pd.DataFrame()

    try:
        subway_df = create_subway_features(ts, weather)
        subway_df["predicted"] = subway_model.predict(subway_df[subway_features])
        subway_df = subway_df.merge(station_to_zone, on="station_complex_id")
        subway_zone = subway_df.groupby("PULocationID")["predicted"].sum().reset_index()
        subway_zone["hour"] = ts.hour
        subway_zone["day_of_week"] = ts.weekday()

        subway_zone = subway_zone.merge(subway_busyness, on=["PULocationID", "hour", "day_of_week"], how="left")
        subway_zone["subway_level"] = subway_zone.apply(lambda r: classify_level(r["predicted"], r["p10"], r["p25"], r["p50"], r["p75"], r["p90"]), axis=1)
        subway_zone["subway_score"] = subway_zone["subway_level"].map(LEVEL_TO_SCORE)
        subway_level_df = subway_zone[["PULocationID", "subway_level", "subway_score"]]
    except Exception as e:
        print("Subway model failed:", e)

    try:
        taxi_df = create_taxi_features(zones_df["OBJECTID"].unique(), ts, weather)
        taxi_df["predicted"] = taxi_model.predict(taxi_df.drop(columns=["geometry"]))
        taxi_df["hour"] = ts.hour
        taxi_df["day_of_week"] = ts.weekday()

        taxi_df = taxi_df.merge(taxi_busyness, on=["PULocationID", "hour", "day_of_week"], how="left")

        taxi_df.loc[
            (taxi_df["predicted"] < HIGH_THRESHOLD) &
            (taxi_df["p75"] > HIGH_THRESHOLD),
            "predicted"
        ] *= CORRECTION_FACTOR

        taxi_df["taxi_level"] = taxi_df.apply(lambda r: classify_level(r["predicted"], r["p10"], r["p25"], r["p50"], r["p75"], r["p90"]), axis=1)
        taxi_df["taxi_score"] = taxi_df["taxi_level"].map(LEVEL_TO_SCORE)
        taxi_level_df = taxi_df[["PULocationID", "taxi_level", "taxi_score", "centroid_lat", "centroid_lon", "geometry"]]
    except Exception as e:
        print("Taxi model failed:", e)

    result = pd.merge(taxi_level_df, subway_level_df, on="PULocationID", how="outer")
    result["taxi_score"] = result["taxi_score"].fillna(np.nan)
    result["subway_score"] = result["subway_score"].fillna(np.nan)

    result["combined_score"] = result.apply(
        lambda r: (
            r["taxi_score"] if np.isnan(r["subway_score"]) and not np.isnan(r["taxi_score"]) else
            r["subway_score"] if np.isnan(r["taxi_score"]) and not np.isnan(r["subway_score"]) else
            0.7 * r["subway_score"] + 0.3 * r["taxi_score"] if not np.isnan(r["subway_score"]) and not np.isnan(r["taxi_score"]) else
            2
        ), axis=1
    )

    result["combined_level"] = result["combined_score"].round().astype(int).map(SCORE_TO_LEVEL)
    result["subway_level"] = result["subway_level"].fillna("No Data")
    result["taxi_level"] = result["taxi_level"].fillna("No Data")

    features = []
    for _, row in result.iterrows():
        geometry = OrderedDict()
        geom = row.get("geometry", "")
        if geom.startswith("POLYGON (("):
            points = geom.replace("POLYGON ((", "").replace("))", "").split(", ")
            coords = [[float(x), float(y)] for x, y in (p.split(" ") for p in points)]
            geometry["type"] = "Polygon"
            geometry["coordinates"] = [coords]
        elif geom.startswith("MULTIPOLYGON (("):
            geometry = mapping(wkt.loads(geom))
        props = {k: (None if pd.isna(v) else v) for k, v in row.drop("geometry").items()}
        feature = {"type": "Feature", "properties": props, "geometry": geometry}
        features.append(feature)

    return jsonify({
        "type": "FeatureCollection",
        "properties": {"timestamp": ts, "weather": weather},
        "features": features
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)