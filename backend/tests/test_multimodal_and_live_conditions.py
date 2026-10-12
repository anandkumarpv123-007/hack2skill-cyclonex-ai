"""
Tests for (1) the engine-rendered hazard map sent to Gemini as image input and
(2) the live current-conditions endpoint. No real network calls are made.
"""

import asyncio

import pytest

from app.ai.vertex_gemini import advisory_engine
from app.api.v1.endpoints.risk_analysis import evaluate_risk
from app.engine.hazard_map import render_hazard_map_png
from app.providers import live_conditions

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


@pytest.fixture(scope="module")
def hudhud_gt():
    return asyncio.run(evaluate_risk(cyclone_id="cyclone_hudhud_2014"))


# ---------------------------------------------------------------- hazard map
def test_hazard_map_renders_png_for_every_scenario():
    for cid in ("cyclone_hudhud_2014", "cyclone_michaung_2023", "cyclone_live_simulation"):
        png = render_hazard_map_png(asyncio.run(evaluate_risk(cyclone_id=cid)))
        assert png and png.startswith(PNG_MAGIC)
        assert 10_000 < len(png) < 600_000  # reasonable size to send to Gemini


def test_hazard_map_survives_missing_layers():
    png = render_hazard_map_png({"cyclone_metadata": {"name": "X"}})
    assert png is None or png.startswith(PNG_MAGIC)


def test_hazard_map_endpoint_serves_png(client):
    r = client.get("/api/v1/advisory/hazard-map.png", params={"cyclone_id": "cyclone_hudhud_2014"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    assert r.content.startswith(PNG_MAGIC)


# ---------------------------------------------------------------- multimodal Gemini input
def test_generate_advisory_passes_image_and_reports_multimodal(monkeypatch, hudhud_gt):
    seen = {}

    def fake_call(prompt, image_png=None):
        seen["image"] = image_png
        seen["prompt"] = prompt
        advisory_engine.last_used_image = image_png is not None
        advisory_engine.last_model_used = "gemini-test"
        return ("Peak sustained winds of 185.0 km/h with scenario surge of 4.61 m.", None)

    monkeypatch.setattr(advisory_engine, "_call_gemini", fake_call)
    png = render_hazard_map_png(hudhud_gt)
    adv = advisory_engine.generate_advisory(hudhud_gt, hazard_map_png=png)
    assert seen["image"] == png
    assert "SPATIAL READING OF THE HAZARD MAP" in seen["prompt"]
    assert adv["is_live_ai"] is True
    assert adv["multimodal_used"] is True
    assert adv["gemini_inputs"] == ["verified_engine_json", "hazard_map_image"]


def test_text_only_advisory_reports_single_input(monkeypatch, hudhud_gt):
    monkeypatch.setattr(advisory_engine, "_call_gemini", lambda prompt: ("185.0 km/h winds and 4.61 m surge.", None))
    adv = advisory_engine.generate_advisory(hudhud_gt)
    assert adv["multimodal_used"] is False
    assert adv["gemini_inputs"] == ["verified_engine_json"]


def test_image_rejected_falls_back_to_text_only_same_model(monkeypatch):
    from google import genai

    calls = []

    class Err(Exception):
        code = 400
        status = "INVALID_ARGUMENT"

    class FakeModels:
        def generate_content(self, model, contents, config):
            calls.append(isinstance(contents, list))
            if isinstance(contents, list):
                raise Err("400 INVALID_ARGUMENT. Unsupported image input.")
            class R:
                text = "Text-only briefing."
            return R()

    class FakeClient:
        def __init__(self, api_key, http_options):
            self.models = FakeModels()

    monkeypatch.setattr(genai, "Client", FakeClient)
    monkeypatch.setattr(advisory_engine, "api_key", "test-key-not-real")
    text, reason = advisory_engine._call_gemini("prompt", image_png=PNG_MAGIC + b"0" * 64)
    assert text == "Text-only briefing." and reason is None
    assert calls == [True, False]
    assert advisory_engine.last_used_image is False


def test_fallback_advisory_never_claims_multimodal(monkeypatch, hudhud_gt):
    monkeypatch.setattr(advisory_engine, "_call_gemini", lambda prompt, image_png=None: (None, "QUOTA_EXCEEDED"))
    adv = advisory_engine.generate_advisory(hudhud_gt, hazard_map_png=PNG_MAGIC)
    assert adv["is_live_ai"] is False
    assert adv["multimodal_used"] is False
    assert adv["gemini_inputs"] == []


# ---------------------------------------------------------------- live conditions
@pytest.fixture(autouse=True)
def _clear_live_cache():
    live_conditions._cache.clear()
    yield
    live_conditions._cache.clear()


def test_live_conditions_parses_open_meteo(monkeypatch, client):
    async def fake_get_json(url, params):
        if "marine" in url:
            return {"current": {"wave_height": 1.8}}
        assert params["latitude"] == 17.7 and params["longitude"] == 83.3
        return {"timezone": "Asia/Kolkata", "current": {
            "time": "2026-10-12T19:00", "temperature_2m": 28.4, "relative_humidity_2m": 81,
            "precipitation": 0.2, "wind_speed_10m": 18.5, "wind_gusts_10m": 31.0,
            "wind_direction_10m": 140, "surface_pressure": 1006.2, "weather_code": 3}}

    monkeypatch.setattr(live_conditions, "_get_json", fake_get_json)
    r = client.get("/api/v1/weather/live", params={"lat": 17.7, "lon": 83.3, "label": "Visakhapatnam"})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "live"
    assert d["conditions"]["wind_speed_kmh"] == 18.5
    assert d["conditions"]["wave_height_m"] == 1.8
    assert d["cyclonic_winds_now"] is False
    assert d["location"]["label"] == "Visakhapatnam"
    assert "historical benchmark" in d["note"]


def test_live_conditions_unavailable_is_graceful(monkeypatch, client):
    async def boom(url, params):
        raise ConnectionError("network down")

    monkeypatch.setattr(live_conditions, "_get_json", boom)
    r = client.get("/api/v1/weather/live", params={"lat": 15.8, "lon": 80.5})
    assert r.status_code == 200
    assert r.json()["status"] == "unavailable"


def test_live_conditions_marine_failure_keeps_surface_data(monkeypatch, client):
    async def fake_get_json(url, params):
        if "marine" in url:
            raise TimeoutError()
        return {"current": {"time": "t", "wind_speed_10m": 70.0}}

    monkeypatch.setattr(live_conditions, "_get_json", fake_get_json)
    d = client.get("/api/v1/weather/live", params={"lat": 15.8, "lon": 80.5}).json()
    assert d["status"] == "live"
    assert d["conditions"]["wave_height_m"] is None
    assert d["cyclonic_winds_now"] is True


def test_live_conditions_rejects_bad_coordinates(client):
    assert client.get("/api/v1/weather/live", params={"lat": 123, "lon": 80}).status_code == 422


def test_live_conditions_cached(monkeypatch, client):
    n = {"calls": 0}

    async def fake_get_json(url, params):
        n["calls"] += 1
        return {"current": {"time": "t", "wind_speed_10m": 10.0}}

    monkeypatch.setattr(live_conditions, "_get_json", fake_get_json)
    client.get("/api/v1/weather/live", params={"lat": 15.8, "lon": 80.5})
    d = client.get("/api/v1/weather/live", params={"lat": 15.8, "lon": 80.5}).json()
    assert d["served_from_cache"] is True
    assert n["calls"] == 2  # forecast + marine on first request only
