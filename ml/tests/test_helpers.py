# Importing.
import pandas as pd
import numpy as np
from ml.app import prepare_subway_features, classify_combined_busyness

# Test: prepare_subway_features handles a normal clear-weather case.
def test_prepare_subway_features_basic():
    weather = {
        "temp": 15,
        "feels_like": 14,
        "humidity": 60,
        "wind_speed": 5,
        "weather_main": "Clear"
    }
    station_df = pd.DataFrame([{"station_complex_id": 1}])

    df = prepare_subway_features(pd.Timestamp("2025-07-25 08:00:00"), weather, station_df)

    assert "hour" in df.columns
    assert "is_weekend" in df.columns
    assert "has_rain" in df.columns
    assert df.loc[0, "temp_category"] == "mild"

# Test: prepare_subway_features handles snow and freezing conditions.
def test_prepare_subway_features_extremes():
    weather = {
        "temp": -5,
        "feels_like": -10,
        "humidity": 90,
        "wind_speed": 20,
        "weather_main": "Snow"
    }
    station_df = pd.DataFrame([{"station_complex_id": 1}])

    df = prepare_subway_features(pd.Timestamp("2025-12-25 07:00:00"), weather, station_df)

    assert df.loc[0, "has_snow"] == 1
    assert df.loc[0, "is_freezing"] == 1
    assert df.loc[0, "temp_category"] == "freezing"

# Test: prepare_subway_features handles NaN temperature correctly.
def test_prepare_subway_features_nan_temp():
    weather = {
        "temp": np.nan,
        "feels_like": 12,
        "humidity": 55,
        "wind_speed": 5,
        "weather_main": "Mist"
    }
    station_df = pd.DataFrame([{"station_complex_id": 1}])

    df = prepare_subway_features(pd.Timestamp("2025-07-25 12:00:00"), weather, station_df)

    assert pd.isna(df.loc[0, "temp_category"])

# Test: classify_combined_busyness returns correct labels for values below/above thresholds.
def test_classify_combined_busyness_labels():
    from ml import app as ml_app_module
    ml_app_module.combined_stats = pd.DataFrame([{
        "PULocationID": 1,
        "hour": 8,
        "day_of_week": 2,
        "p10": 10, "p25": 20, "p50": 30, "p75": 40, "p90": 50
    }])

    assert classify_combined_busyness(5, 1, 8, 2) == "very quiet"
    assert classify_combined_busyness(25, 1, 8, 2) == "normal"
    assert classify_combined_busyness(60, 1, 8, 2) == "extremely busy"

# Test: classify_combined_busyness handles exact threshold edges correctly.
def test_classify_combined_busyness_threshold_edges():
    from ml import app as ml_app_module
    ml_app_module.combined_stats = pd.DataFrame([{
        "PULocationID": 1,
        "hour": 10,
        "day_of_week": 1,
        "p10": 10, "p25": 20, "p50": 30, "p75": 40, "p90": 50
    }])

    assert classify_combined_busyness(10, 1, 10, 1) == "quiet"
    assert classify_combined_busyness(20, 1, 10, 1) == "normal"
    assert classify_combined_busyness(30, 1, 10, 1) == "busy"
    assert classify_combined_busyness(40, 1, 10, 1) == "very busy"
    assert classify_combined_busyness(50, 1, 10, 1) == "extremely busy"

# Test: classify_combined_busyness falls back to "normal" when no matching stats found.
def test_classify_combined_busyness_fallback():
    from ml import app as ml_app_module
    ml_app_module.combined_stats = pd.DataFrame(columns=["PULocationID", "hour", "day_of_week"])

    assert classify_combined_busyness(100, 999, 10, 5) == "normal"

# Test: prepare_subway_features handles an empty station DataFrame.
def test_prepare_subway_features_empty_station_df():
    weather = {
        "temp": 18,
        "feels_like": 17,
        "humidity": 55,
        "wind_speed": 5,
        "weather_main": "Clear"
    }
    empty_df = pd.DataFrame(columns=["station_complex_id"])

    df = prepare_subway_features(pd.Timestamp("2025-07-25 15:00:00"), weather, empty_df)

    assert isinstance(df, pd.DataFrame)
    assert set(["hour", "day_of_week", "month", "is_weekend"]).issubset(df.columns)
    assert df.empty

# Test: prepare_subway_features classifies very hot temperature as "hot".
def test_prepare_subway_features_hot_temp():
    weather = {
        "temp": 35,  # ≥30 should trigger "hot"
        "feels_like": 33,
        "humidity": 30,
        "wind_speed": 3,
        "weather_main": "Clear"
    }
    station_df = pd.DataFrame([{"station_complex_id": 1}])

    df = prepare_subway_features(pd.Timestamp("2025-07-25 14:00:00"), weather, station_df)

    assert df.loc[0, "temp_category"] == "hot"