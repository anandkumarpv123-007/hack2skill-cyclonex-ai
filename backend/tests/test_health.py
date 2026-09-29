from fastapi.testclient import TestClient


def test_root_metadata_endpoint(client: TestClient):
    """Verifies the root endpoint returns platform metadata and status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "CYCLONEX API"
    assert data["status"] == "operational"
    assert "Milestone 1" in data["milestone"]
    assert data["health_check"] == "/api/v1/health"


def test_health_check_endpoint(client: TestClient):
    """
    Verifies that the /api/v1/health endpoint confirms healthy system status
    and reports exact versions of the deterministic scientific libraries.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    
    # Core health assertions
    assert data["status"] == "healthy"
    assert data["service"] == "cyclonex-backend"
    assert "Milestone 1" in data["milestone"]
    assert data["data_source_mode"] in ["simulated", "live"]
    
    # Verify deterministic stack integrity
    stack = data["deterministic_stack"]
    assert stack["python"].startswith("3.")
    assert bool(stack["fastapi"])
    assert bool(stack["geopandas"])
    assert bool(stack["numpy"])
    assert bool(stack["pandas"])
    assert bool(stack["shapely"])


def test_cors_preflight(client: TestClient):
    """Verifies that CORS headers allow localhost frontend access."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/v1/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
