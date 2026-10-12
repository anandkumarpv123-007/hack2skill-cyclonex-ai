"""
Tests for the optional live Earth Engine terrain check. A fake `ee` module stands in for the
Earth Engine client, so no network or credentials are used.
"""

import json
import sys
import types

import pytest

from app.core.config import settings
from app.geospatial import earth_engine


@pytest.fixture(autouse=True)
def _reset_ee_state(monkeypatch):
    earth_engine._state.update({"initialized": False, "attempted": False, "error": None})
    earth_engine._cache.clear()
    yield
    earth_engine._state.update({"initialized": False, "attempted": False, "error": None})
    earth_engine._cache.clear()


def _fake_ee(stats):
    ee = types.ModuleType("ee")
    calls = {"init": 0, "lt": None}

    class Chain:
        def __init__(self, *a, **k): pass
        def select(self, *a): return self
        def gt(self, *a): return self
        def lt(self, v): calls["lt"] = v; return self
        def And(self, *a): return self
        def updateMask(self, *a): return self
        def rename(self, *a): return self
        def buffer(self, *a): return self
        def reduceRegion(self, **k): calls["reduce"] = k; return self
        def getInfo(self): return stats

    ee.Image = Chain
    ee.Image.cat = staticmethod(lambda *a, **k: Chain())
    ee.Geometry = types.SimpleNamespace(Point=lambda *a, **k: Chain())
    ee.Reducer = types.SimpleNamespace(mean=lambda: "mean")
    ee.ServiceAccountCredentials = lambda email, **k: ("creds", email)

    def initialize(credentials=None, project=None):
        calls["init"] += 1
        calls["project"] = project
    ee.Initialize = initialize
    return ee, calls


def test_not_configured_by_default(client, monkeypatch):
    monkeypatch.setattr(settings, "GEE_PROJECT_ID", "")
    monkeypatch.setattr(settings, "GEE_SERVICE_ACCOUNT_JSON", "")
    d = client.get("/api/v1/geospatial/terrain-check", params={"cyclone_id": "cyclone_hudhud_2014"}).json()
    assert d["status"] == "not_configured"
    assert client.get("/api/v1/health").json()["ai_runtime"]["earth_engine_live"] is False


def test_live_terrain_check_with_service_account(client, monkeypatch):
    ee, calls = _fake_ee({"land_elev": 21.34, "land": 0.5, "below": 0.1})
    monkeypatch.setitem(sys.modules, "ee", ee)
    monkeypatch.setattr(settings, "GEE_PROJECT_ID", "cyclonex-test")
    monkeypatch.setattr(settings, "GEE_SERVICE_ACCOUNT_JSON", json.dumps({"client_email": "sa@cyclonex-test.iam.gserviceaccount.com"}))
    d = client.get("/api/v1/geospatial/terrain-check", params={"cyclone_id": "cyclone_hudhud_2014"}).json()
    assert d["status"] == "live"
    assert d["source"].startswith("Google Earth Engine")
    assert d["surge_height_m"] == 4.61 and calls["lt"] == 4.61          # threshold = scenario surge
    assert d["mean_land_elevation_m"] == 21.3
    assert d["land_fraction_below_surge_pct"] == 20.0                   # 0.1 / 0.5
    assert calls["project"] == "cyclonex-test"
    assert "does not change the CVI" in d["note"]
    assert client.get("/api/v1/health").json()["ai_runtime"]["earth_engine_live"] is True


def test_earth_engine_failure_is_reported_not_raised(client, monkeypatch):
    ee, _ = _fake_ee({})
    def boom(**k): raise PermissionError("not registered")
    ee.Initialize = boom
    monkeypatch.setitem(sys.modules, "ee", ee)
    monkeypatch.setattr(settings, "GEE_PROJECT_ID", "p")
    monkeypatch.setattr(settings, "GEE_SERVICE_ACCOUNT_JSON", json.dumps({"client_email": "x@y"}))
    d = client.get("/api/v1/geospatial/terrain-check", params={"cyclone_id": "cyclone_michaung_2023"}).json()
    assert d["status"] == "error" and d["reason"] == "PermissionError"


def test_cvi_unchanged_when_earth_engine_live(client, monkeypatch):
    before = client.post("/api/v1/risk/evaluate", json={"cyclone_id": "cyclone_hudhud_2014"}).json()["cvi_rankings"]
    ee, _ = _fake_ee({"land_elev": 5.0, "land": 1.0, "below": 0.9})
    monkeypatch.setitem(sys.modules, "ee", ee)
    monkeypatch.setattr(settings, "GEE_PROJECT_ID", "p")
    monkeypatch.setattr(settings, "GEE_SERVICE_ACCOUNT_JSON", json.dumps({"client_email": "x@y"}))
    client.get("/api/v1/geospatial/terrain-check", params={"cyclone_id": "cyclone_hudhud_2014"})
    after = client.post("/api/v1/risk/evaluate", json={"cyclone_id": "cyclone_hudhud_2014"}).json()["cvi_rankings"]
    assert before == after
