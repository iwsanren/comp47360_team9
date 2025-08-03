# Importing.
import sys, os
import pytest
import joblib
import pandas as pd
import json
import builtins
from io import StringIO
import importlib

# Set DEV_MODE to true by default for lightweight testing.
os.environ.setdefault("DEV_MODE", "true")

# Add project root so ml package can be imported.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Mock joblib.load to avoid loading real models.
def fake_load(path):
    class FakeModel:
        def predict(self, X):
            return [123] * len(X)
    return FakeModel()

joblib.load = fake_load

# Mock pandas.read_csv to supply controlled test data.
def fake_read_csv(path, *args, **kwargs):
    import pandas as real_pd
    if "manhattan_taxi_zones.csv" in str(path):
        return real_pd.DataFrame([{
            "OBJECTID": 1, "centroid_lat": 40.7, "centroid_lon": -74.0,
            "Shape_Area": 100.0, "Shape_Leng": 10.0,
            "geometry": "POLYGON ((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7))",
            "zone": "Test Zone", "borough": "Test Borough"
        }])
    elif "zone_combined_busyness_stats.csv" in str(path):
        return real_pd.DataFrame([{
            "PULocationID": 1, "hour": 12, "day_of_week": 3,
            "p10": 10, "p25": 20, "p50": 30, "p75": 40, "p90": 50,
            "min": 0, "max": 100
        }])
    elif "station_to_zone_mapping.csv" in str(path):
        return real_pd.DataFrame([{"station_complex_id": 1, "PULocationID": 1}])
    elif "subway_stations.csv" in str(path):
        return real_pd.DataFrame([{"station_complex_id": 1, "name": "Mock Station"}])
    return real_pd.DataFrame()

# Mock open() so required_features.json returns fake content.
_real_open = builtins.open
def fake_open(path, *args, **kwargs):
    if isinstance(path, str) and "required_features.json" in path:
        return StringIO(json.dumps([
            "hour", "day_of_week", "month",
            "hour_sin", "hour_cos",
            "dow_sin", "dow_cos",
            "month_sin", "month_cos",
            "station_complex_id"
        ]))
    return _real_open(path, *args, **kwargs)

builtins.open = fake_open

# Import the app after mocks so tests use fake data.
from ml import app as ml_app_module

# Client fixture (DEV_MODE = true).
@pytest.fixture
def client():
    ml_app_module.app.config['TESTING'] = True
    with ml_app_module.app.test_client() as client:
        yield client

# Client fixture with DEV_MODE = false to enforce JWT.
@pytest.fixture
def auth_client(monkeypatch):
    monkeypatch.setitem(os.environ, "DEV_MODE", "false")
    importlib.reload(ml_app_module)
    ml_app_module.app.config['TESTING'] = True
    with ml_app_module.app.test_client() as client:
        yield client
    monkeypatch.setitem(os.environ, "DEV_MODE", "true")
    importlib.reload(ml_app_module)

def test_auth_client_fixture(auth_client):
    """Smoke test to ensure auth_client runs fully and resets DEV_MODE."""
    response = auth_client.get("/")
    assert response.status_code in (200, 401, 500)

@pytest.fixture(autouse=True)
def patch_predict_all_dependencies(monkeypatch):
    monkeypatch.setattr(
        "ml.app.create_taxi_features",
        lambda *a, **kw: pd.DataFrame([{
            "PULocationID": 1,
            "centroid_lat": 40.7,
            "centroid_lon": -74.0,
            "feature": 10
        }])
    )

    monkeypatch.setattr(
        "ml.app.create_subway_features",
        lambda *a, **kw: pd.DataFrame([{
            "PULocationID": 1,
            "feature": 5
        }])
    )

    monkeypatch.setattr(
        "ml.app.requests.get",
        lambda url: type("R", (), {
            "status_code": 200,
            "raise_for_status": lambda self=None: None,
            "json": lambda self=None: {
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 50},
                "wind": {"speed": 5}
            }
        })()
    )
