import pytest
import jwt
import pandas as pd

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

# Test: generic JWT error triggers the 500 exception branch in predict_all.
def test_predict_jwt_generic_exception(auth_client, monkeypatch):
    def fake_decode(*a, **kw):
        raise RuntimeError("Unexpected JWT error")
    monkeypatch.setattr("ml.app.jwt.decode", fake_decode)

    response = auth_client.post("/predict-all", headers={"Authorization": "Bearer faketoken"})
    assert response.status_code == 500
    assert "Unexpected JWT error" in response.get_json()["error"]