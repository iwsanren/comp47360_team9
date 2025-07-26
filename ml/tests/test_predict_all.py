# Importing.
import pandas as pd
import pytest
import os

# Test: /predict-all runs normally with basic mocks and returns a FeatureCollection.
def test_predict_all_minimal(client, monkeypatch):
    monkeypatch.setattr("ml.app.model.predict", lambda x: [50])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [20] * len(x))
    monkeypatch.setattr("ml.app.jwt.decode", lambda token, key, algorithms: {"user": "test"})

    # Mock weather API for a successful response.
    def fake_weather_get(url):
        class FakeResponse:
            status_code = 200
            def json(self):
                return {
                    "weather": [{"main": "Clear"}],
                    "main": {"temp": 20, "feels_like": 20, "humidity": 60},
                    "wind": {"speed": 5}
                }
        return FakeResponse()
    monkeypatch.setattr("requests.get", fake_weather_get)

    # Mock feature prep and zone data.
    fake_df = pd.DataFrame([{
        "hour": 10,
        "day_of_week": 2,
        "month": 7,
        "hour_sin": 0.5, "hour_cos": 0.5,
        "dow_sin": 0.5, "dow_cos": 0.5,
        "month_sin": 0.5, "month_cos": 0.5,
        "station_complex_id": 1,
        "temp": 20, "feels_like": 20,
        "humidity": 60, "wind_speed": 5,
        "has_rain": False, "has_snow": False,
        "is_freezing": False, "is_hot": False,
        "temp_category": "mild"
    }])
    monkeypatch.setattr("ml.app.prepare_subway_features", lambda *a, **kw: fake_df)

    from ml import app as ml_app_module
    ml_app_module.station_zone_map = pd.DataFrame([{"station_complex_id": 1, "PULocationID": 100}])
    ml_app_module.zones_df = pd.DataFrame([{
        "OBJECTID": 1,
        "centroid_lat": 40.7,
        "centroid_lon": -74.0,
        "Shape_Area": 100.0,
        "Shape_Leng": 10.0,
        "geometry": "POLYGON ((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7))",
        "zone": "Test Zone",
        "borough": "Test Borough"
    }])

    response = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 200
    data = response.get_json()
    assert "features" in data
    assert data["type"] == "FeatureCollection"


# Test: /predict-all returns 500 when weather API fails.
def test_predict_all_weather_api_failure(client, monkeypatch):
    monkeypatch.setattr("ml.app.jwt.decode", lambda token, key, algorithms: {"user": "test"})

    class FakeFailResponse:
        status_code = 500
        text = "Internal Server Error"
    monkeypatch.setattr("requests.get", lambda url: FakeFailResponse())

    response = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 500
    assert "Failed to fetch weather data" in response.get_json()["error"]


# Test: /predict-all with a timestamp but no matching forecast entry returns 400.
def test_predict_all_forecast_no_timestamp_entry(client, monkeypatch):
    monkeypatch.setattr("ml.app.jwt.decode", lambda token, key, algorithms: {"user": "test"})

    class FakeForecastResponse:
        status_code = 200
        def json(self):
            return {"list": []}
    monkeypatch.setattr("requests.get", lambda url: FakeForecastResponse())

    monkeypatch.setattr("ml.app.model.predict", lambda x: [1])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [1])

    response = client.post("/predict-all?timestamp=1234567890", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 400
    assert "No weather data for specified time" in response.get_json()["error"]


# Test: /predict-all raises a 500 if jwt.decode throws a generic exception.
def test_predict_all_jwt_generic_exception(client, monkeypatch):
    monkeypatch.setitem(os.environ, "DEV_MODE", "false")

    def fake_decode(*a, **kw):
        raise RuntimeError("Unexpected JWT error")
    monkeypatch.setattr("ml.app.jwt.decode", fake_decode)

    response = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 500
    assert "Unexpected JWT error" in response.get_json()["error"]

    monkeypatch.setitem(os.environ, "DEV_MODE", "true")


# Test: /predict-all handles MULTIPOLYGON geometry correctly.
def test_predict_all_multipolygon_geometry(client, monkeypatch):
    monkeypatch.setattr("ml.app.jwt.decode", lambda token, key, algorithms: {"user": "test"})

    class FakeWeatherResponse:
        status_code = 200
        def json(self):
            return {
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 60},
                "wind": {"speed": 5}
            }
    monkeypatch.setattr("requests.get", lambda url: FakeWeatherResponse())

    monkeypatch.setattr("ml.app.model.predict", lambda x: [10])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [5] * len(x))

    from ml import app as ml_app_module
    ml_app_module.zones_df = pd.DataFrame([{
        "OBJECTID": 1,
        "centroid_lat": 40.7,
        "centroid_lon": -74.0,
        "Shape_Area": 100.0,
        "Shape_Leng": 10.0,
        "geometry": "MULTIPOLYGON (((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7)))",
        "zone": "Test Zone",
        "borough": "Test Borough"
    }])

    fake_df = pd.DataFrame([{
        "hour": 10, "day_of_week": 2, "month": 7,
        "hour_sin": 0.5, "hour_cos": 0.5,
        "dow_sin": 0.5, "dow_cos": 0.5,
        "month_sin": 0.5, "month_cos": 0.5,
        "station_complex_id": 1,
        "temp": 20, "feels_like": 20,
        "humidity": 60, "wind_speed": 5,
        "has_rain": False, "has_snow": False,
        "is_freezing": False, "is_hot": False,
        "temp_category": "mild"
    }])
    monkeypatch.setattr("ml.app.prepare_subway_features", lambda *a, **kw: fake_df)

    ml_app_module.station_zone_map = pd.DataFrame([{"station_complex_id": 1, "PULocationID": 1}])

    response = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 200
    data = response.get_json()
    assert "features" in data
    assert data["features"][0]["geometry"]["type"] == "MultiPolygon"


# Test: /predict-all with a timestamp triggers the forecast/hourly branch.
def test_predict_all_with_timestamp_forecast_branch(client, monkeypatch):
    from ml import app as ml_app_module
    monkeypatch.setattr("ml.app.jwt.decode", lambda *a, **kw: {"user": "test"})

    class FakeForecastResponse:
        status_code = 200
        def json(self):
            return {"list": [{
                "dt": 1234567890,
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 50},
                "wind": {"speed": 5}
            }]}
    monkeypatch.setattr("requests.get", lambda url: FakeForecastResponse())

    monkeypatch.setattr("ml.app.model.predict", lambda x: [1])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [1])

    ml_app_module.zones_df = pd.DataFrame([{
        "OBJECTID": 1,
        "centroid_lat": 40.7,
        "centroid_lon": -74.0,
        "Shape_Area": 100.0,
        "Shape_Leng": 10.0,
        "geometry": "POLYGON ((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7))",
        "zone": "Test Zone",
        "borough": "Test Borough"
    }])

    ml_app_module.station_zone_map = pd.DataFrame([{"station_complex_id": 1, "PULocationID": 1}])

    resp = client.post("/predict-all?timestamp=1234567890", headers={"Authorization": "Bearer faketoken"})
    assert resp.status_code == 200
    assert "features" in resp.get_json()


# Test: /predict-all handles unknown geometry gracefully (hits fallback geometry code).
def test_predict_all_unknown_geometry(client, monkeypatch):
    from ml import app as ml_app_module
    monkeypatch.setattr("ml.app.jwt.decode", lambda *a, **kw: {"user": "test"})

    class FakeWeatherResponse:
        status_code = 200
        def json(self):
            return {
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 60},
                "wind": {"speed": 5}
            }
    monkeypatch.setattr("requests.get", lambda url: FakeWeatherResponse())

    monkeypatch.setattr("ml.app.model.predict", lambda x: [10])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [5] * len(x))

    ml_app_module.zones_df = pd.DataFrame([{
        "OBJECTID": 1,
        "centroid_lat": 40.7,
        "centroid_lon": -74.0,
        "Shape_Area": 100.0,
        "Shape_Leng": 10.0,
        "geometry": "",  # Blank geometry triggers fallback
        "zone": "Test Zone",
        "borough": "Test Borough"
    }])

    fake_df = pd.DataFrame([{
        "hour": 10, "day_of_week": 2, "month": 7,
        "hour_sin": 0.5, "hour_cos": 0.5,
        "dow_sin": 0.5, "dow_cos": 0.5,
        "month_sin": 0.5, "month_cos": 0.5,
        "station_complex_id": 1,
        "temp": 20, "feels_like": 20,
        "humidity": 60, "wind_speed": 5,
        "has_rain": False, "has_snow": False,
        "is_freezing": False, "is_hot": False,
        "temp_category": "mild"
    }])
    monkeypatch.setattr("ml.app.prepare_subway_features", lambda *a, **kw: fake_df)

    ml_app_module.station_zone_map = pd.DataFrame([{"station_complex_id": 1, "PULocationID": 1}])

    resp = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "features" in data


# Test: /predict-all sets taxi_pred=0.0 if model.predict() raises an exception.
def test_predict_all_taxi_predict_exception(client, monkeypatch):
    monkeypatch.setattr("ml.app.jwt.decode", lambda token, key, algorithms: {"user": "test"})

    # Force model.predict to raise an error.
    def bad_predict(_):
        raise ValueError("Prediction failed")
    monkeypatch.setattr("ml.app.model.predict", bad_predict)

    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [5] * len(x))

    # Fake weather API response.
    class FakeWeatherResponse:
        status_code = 200
        def json(self):
            return {
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 50},
                "wind": {"speed": 5}
            }
    monkeypatch.setattr("ml.app.requests.get", lambda url: FakeWeatherResponse())

    # Minimal zones_df.
    from ml import app as ml_app_module
    ml_app_module.zones_df = pd.DataFrame([{
        "OBJECTID": 1,
        "centroid_lat": 40.7,
        "centroid_lon": -74.0,
        "Shape_Area": 100.0,
        "Shape_Leng": 10.0,
        "geometry": "POLYGON ((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7))",
        "zone": "Test Zone",
        "borough": "Test Borough"
    }])

    response = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 200
    props = response.get_json()["features"][0]["properties"]
    assert props["busyness"] == 0.0


# Test: /predict-all correctly normalises busyness using combined_stats min/max.
def test_predict_all_combined_normalisation(client, monkeypatch):
    monkeypatch.setattr("ml.app.jwt.decode", lambda token, key, algorithms: {"user": "test"})
    monkeypatch.setattr("ml.app.model.predict", lambda x: [10])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [5])

    # Fake weather API response.
    class FakeWeatherResponse:
        status_code = 200
        def json(self):
            return {
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 50},
                "wind": {"speed": 5}
            }
    monkeypatch.setattr("ml.app.requests.get", lambda url: FakeWeatherResponse())

    # Inject combined_stats with a row to trigger normalisation code.
    from ml import app as ml_app_module
    ml_app_module.combined_stats = pd.DataFrame([{
        "PULocationID": 1,
        "hour": pd.Timestamp.now().hour,
        "day_of_week": pd.Timestamp.now().weekday(),
        "p10": 1, "p25": 2, "p50": 3, "p75": 4, "p90": 5,
        "min": 0, "max": 100
    }])

    ml_app_module.zones_df = pd.DataFrame([{
        "OBJECTID": 1,
        "centroid_lat": 40.7,
        "centroid_lon": -74.0,
        "Shape_Area": 100.0,
        "Shape_Leng": 10.0,
        "geometry": "POLYGON ((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7))",
        "zone": "Test Zone",
        "borough": "Test Borough"
    }])

    response = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 200
    props = response.get_json()["features"][0]["properties"]
    norm_value = props["normalised_busyness"]

    # Assert that the value is a valid normalised float between 0 and 1.
    assert isinstance(norm_value, float)
    assert 0.0 <= norm_value <= 1.0


# Test: /predict-all handles edge case where combined_max <= combined_min (normalisation fallback).
def test_predict_all_combined_min_equals_max(client, monkeypatch):
    from ml import app as ml_app_module

    # Mock jwt.decode to always succeed.
    monkeypatch.setattr("ml.app.jwt.decode", lambda *a, **kw: {"user": "test"})

    # Mock model predictions.
    monkeypatch.setattr("ml.app.model.predict", lambda x: [10])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [5])

    # Fake weather API response.
    class FakeWeatherResponse:
        status_code = 200
        def json(self):
            return {
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 50},
                "wind": {"speed": 5}
            }
    monkeypatch.setattr("ml.app.requests.get", lambda url: FakeWeatherResponse())

    # Inject combined_stats with min == max to trigger fallback branch (normalised_busyness=0.5).
    ml_app_module.combined_stats = pd.DataFrame([{
        "PULocationID": 1,
        "hour": pd.Timestamp.now().hour,
        "day_of_week": pd.Timestamp.now().weekday(),
        "p10": 1, "p25": 2, "p50": 3, "p75": 4, "p90": 5,
        "min": 100, "max": 100   # Forces fallback
    }])

    # Minimal zones_df to hit the endpoint.
    ml_app_module.zones_df = pd.DataFrame([{
        "OBJECTID": 1,
        "centroid_lat": 40.7,
        "centroid_lon": -74.0,
        "Shape_Area": 100.0,
        "Shape_Leng": 10.0,
        "geometry": "POLYGON ((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7))",
        "zone": "Test Zone",
        "borough": "Test Borough"
    }])

    # Make the request to hit the normalisation fallback path.
    response = client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 200

    props = response.get_json()["features"][0]["properties"]

    # Check that normalised_busyness is exactly 0.5 when min == max triggers fallback.
    assert props["normalised_busyness"] == 0.5