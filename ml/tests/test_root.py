# Importing.
import pytest
from ml.app import app

# Fixture: provides a Flask test client for the app.
@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

# Test: root endpoint should return 200.
def test_root_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200

# Test: root endpoint should return the correct JSON structure and values.
def test_root_json_structure(client):
    response = client.get("/")
    data = response.get_json()

    # Check required keys exist.
    assert "service" in data
    assert "status" in data
    assert "endpoints" in data

    # Check specific values.
    assert data["service"] == "Manhattan My Way ML API"
    assert data["status"] == "running"
    assert "/predict-all" in data["endpoints"]