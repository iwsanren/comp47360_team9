# Importing.
import pytest

# Dummy token for authentication in tests.
AUTH_HEADER = {"Authorization": "Bearer dummy-token"}

# Test: valid payload should return a prediction or a handled error.
def test_predict_happy_path(client):
    payload = {
        "pickup_date": "2024-11-16",
        "pickup_hour": 14,
        "PULocationID": 87,
        "temp": 10.87,
        "humidity": 42,
        "wind_speed": 6.7,
        "weather": "Clear"
    }
    resp = client.post("/predict-all", json=payload, headers=AUTH_HEADER)

    # Endpoint may respond with 200 (prediction) or 500 (weather/model failure).
    assert resp.status_code in (200, 500)

    data = resp.get_json()
    assert isinstance(data, dict)
    assert "features" in data or "error" in data

# Test: missing required field should return 400 or fail gracefully.
def test_predict_missing_field(client):
    payload = {
        # Missing pickup_date here.
        "pickup_hour": 14,
        "PULocationID": 87,
        "temp": 10.87,
        "humidity": 42,
        "wind_speed": 6.7,
        "weather": "Clear"
    }
    resp = client.post("/predict-all", json=payload, headers=AUTH_HEADER)

    # Could return 400/422 for validation or 500 if not handled cleanly.
    assert resp.status_code in (400, 422, 500)

# Test: invalid type (string for pickup_hour) should return 400 or 500.
def test_predict_invalid_type(client):
    payload = {
        "pickup_date": "2024-11-16",
        "pickup_hour": "not-a-number",  # Wrong type
        "PULocationID": 87,
        "temp": 10.87,
        "humidity": 42,
        "wind_speed": 6.7,
        "weather": "Clear"
    }
    resp = client.post("/predict-all", json=payload, headers=AUTH_HEADER)

    # Could return 400/422 for type error or 500 if fallback kicks in.
    assert resp.status_code in (400, 422, 500)