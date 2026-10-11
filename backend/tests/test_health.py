from fastapi.testclient import TestClient


def test_root_metadata_endpoint(client: TestClient):
    """Verifies the root endpoint returns platform metadata and status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "CYCLONEX API"
    assert data["status"] == "operational"
    assert "Milestone 6" in data["milestone"]
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
    assert "Milestone 6" in data["milestone"]
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


def test_docs_and_redoc_redirects(client: TestClient):
    """Verifies that /docs and /redoc redirect safely to /api/v1/docs and /api/v1/redoc."""
    response_docs = client.get("/docs", follow_redirects=False)
    assert response_docs.status_code == 307
    assert response_docs.headers["location"] == "/api/v1/docs"

    response_redoc = client.get("/redoc", follow_redirects=False)
    assert response_redoc.status_code == 307
    assert response_redoc.headers["location"] == "/api/v1/redoc"


def test_api_v1_docs_accessible(client: TestClient):
    """Verifies that the canonical documentation endpoint /api/v1/docs is accessible."""
    response = client.get("/api/v1/docs")
    assert response.status_code == 200


def test_api_v1_redoc_and_openapi_accessible(client: TestClient):
    """Verifies that /api/v1/redoc and /api/v1/openapi.json are directly accessible."""
    res_redoc = client.get("/api/v1/redoc")
    assert res_redoc.status_code == 200

    res_openapi = client.get("/api/v1/openapi.json")
    assert res_openapi.status_code == 200
    openapi_data = res_openapi.json()
    assert "paths" in openapi_data
    assert "/api/v1/health" in openapi_data["paths"]
    assert "/api/v1/advisory/generate" in openapi_data["paths"]
