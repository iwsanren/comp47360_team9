# Importing.
import pytest
from flask import Flask, jsonify
from ml.app import app
from ml.utils.request_tracker import with_request_tracking

# Fixture: provides a Flask test client.
@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

# Test: root endpoint should return a friendly message or hint.
def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert isinstance(resp.json, dict) or isinstance(resp.json, str)

    # If JSON, check for message or status key; if string, check it’s not empty.
    if isinstance(resp.json, dict):
        assert "message" in resp.json or "status" in resp.json
    else:
        assert len(resp.json) > 0

# Test: health endpoint should return status and possibly extra info.
def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "status" in resp.json
    assert resp.json["status"].lower() in ["ok", "healthy", "running"]

    # Optional keys like uptime or version should be present if returned.
    optional_keys = ["uptime", "service", "version"]
    for key in optional_keys:
        if key in resp.json:
            assert resp.json[key] is not None

# Test: with_request_tracking decorator works in an isolated app.
def test_with_request_tracking_decorator_integration_isolated():
    
    temp_app = Flask(__name__)

    @temp_app.route("/dummy-decorator-route")
    @with_request_tracking
    def dummy():
        return jsonify({"decorated": True})

    with temp_app.test_client() as test_client:
        resp = test_client.get("/dummy-decorator-route")
        assert resp.status_code == 200
        assert resp.json["decorated"] is True
        assert "X-Request-ID" in resp.headers