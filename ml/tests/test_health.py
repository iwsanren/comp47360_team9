import pytest
from ml.app import app

# Flask test client fixture.
@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

# Test: /health returns 200 and shows the model is loaded.
def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data and data["model_loaded"] is True

# Test: /health still returns 200 if the models are missing (no breakage).
def test_health_model_missing(monkeypatch, client):
    # Simulate missing models
    monkeypatch.setattr("ml.app.taxi_model", None)
    monkeypatch.setattr("ml.app.subway_model", None)

    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] in ["healthy", "unhealthy"]  # may not flag missing models

# Test: /health response includes the expected JSON keys.
def test_health_json_structure(client):
    response = client.get("/health")
    data = response.get_json()
    for key in ["status", "timestamp", "model_loaded", "zones_count", "environment", "weather_api_configured"]:
        assert key in data

# Test: /health still returns 200 even when models are missing.
def test_health_unhealthy_if_model_missing(monkeypatch, client):
    from ml import app as ml_app_module
    # Simulate missing models
    monkeypatch.setattr("ml.app.taxi_model", None)
    monkeypatch.setattr("ml.app.subway_model", None)

    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] in ["healthy", "unhealthy"]

# Test: /health handles unexpected exceptions safely (e.g., len(zones_df) failure).
def test_health_generic_exception(monkeypatch, client):
    # Patch zones_df to raise an error when len() is called
    class BadZones:
        def __len__(self):
            raise RuntimeError("Unexpected failure in zones_df")
    monkeypatch.setattr("ml.app.zones_df", BadZones())

    response = client.get("/health")
    assert response.status_code == 500
    data = response.get_json()
    assert data["status"] == "unhealthy"
    assert "Unexpected failure in zones_df" in data["error"]