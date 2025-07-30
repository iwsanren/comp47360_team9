# Importing.
import pytest
import jwt

# Test: request without a token should return 401.
def test_predict_missing_token(auth_client):
    response = auth_client.post("/predict-all")
    assert response.status_code == 401
    assert "Missing or invalid token" in response.get_json()["error"]

# Test: request with an invalid token should return 403.
def test_predict_invalid_token(auth_client, monkeypatch):
    def fake_decode(*a, **kw):
        raise jwt.InvalidTokenError()
    monkeypatch.setattr("ml.app.jwt.decode", fake_decode)

    response = auth_client.post("/predict-all", headers={"Authorization": "Bearer badtoken"})
    assert response.status_code == 403
    assert "Invalid token" in response.get_json()["error"]

# Test: request with an expired token should return 403.
def test_predict_expired_token(auth_client, monkeypatch):
    def fake_decode(*a, **kw):
        raise jwt.ExpiredSignatureError()
    monkeypatch.setattr("ml.app.jwt.decode", fake_decode)

    response = auth_client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 403
    assert "Token expired" in response.get_json()["error"]

# Test: request with a valid token should pass authentication.
def test_predict_valid_token(auth_client, monkeypatch):
    # Mock jwt.decode to always return a valid payload.
    monkeypatch.setattr("ml.app.jwt.decode", lambda token, key, algorithms: {"user": "test"})

    # Mock weather API.
    class FakeWeatherResponse:
        status_code = 200
        def json(self):
            return {
                "weather": [{"main": "Clear"}],
                "main": {"temp": 20, "feels_like": 20, "humidity": 50},
                "wind": {"speed": 5}
            }
    monkeypatch.setattr("ml.app.requests.get", lambda url: FakeWeatherResponse())

    # Mock ML model predictions.
    monkeypatch.setattr("ml.app.model.predict", lambda x: [5])
    monkeypatch.setattr("ml.app.subway_model.predict", lambda x: [5] * len(x))

    # Make the request and check it doesn’t fail authentication.
    response = auth_client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code in (200, 500)

# Test: generic JWT error triggers the 500 exception branch in predict_all.
def test_predict_jwt_generic_exception(auth_client, monkeypatch):
    def fake_decode(*a, **kw):
        raise RuntimeError("Unexpected JWT error")
    monkeypatch.setattr("ml.app.jwt.decode", fake_decode)

    response = auth_client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 500
    assert "Unexpected JWT error" in response.get_json()["error"]