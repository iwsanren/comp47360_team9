# ml/tests/test_basic.py
def test_root_endpoint(client):
    """Test the root endpoint returns service info."""
    response = client.get('/')
    data = response.get_json()

    assert response.status_code == 200
    assert "service" in data
    assert data["status"] == "running"