import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provides a synchronous FastAPI TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _reset_gemini_state():
    """Isolates tests from the live-briefing cache and last-failure diagnostics."""
    from app.ai.vertex_gemini import advisory_engine
    advisory_engine._live_cache.clear()
    advisory_engine.last_fallback_reason = None
    advisory_engine.last_fallback_detail = None
    yield
    advisory_engine._live_cache.clear()
