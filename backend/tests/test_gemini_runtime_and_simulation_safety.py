"""
Regression tests for the live-Gemini runtime path and simulation-safety labelling.
No real network call is made: the google-genai client is replaced with a fake.
"""

import httpx
import pytest

from app.ai import vertex_gemini
from app.ai.vertex_gemini import advisory_engine, classify_gemini_error, GEMINI_TIMEOUT_MS
from app.engine.dispatch_generator import generate_early_warning_dispatches
from app.engine.parametric_insurance import evaluate_parametric_insurance


GT = {
    "cyclone_metadata": {
        "name": "Cyclone Michaung",
        "category": "Severe Cyclonic Storm",
        "landfall_target": "Bapatla Coast",
        "peak_wind_kmh": 110.0,
        "min_pressure_hpa": 980.0,
    },
    "surge_scenario": {"total_scenario_surge_m": 2.85},
    "cvi_rankings": [
        {"district": "Bapatla", "cvi_score": 0.82, "risk_level": "Extreme", "action_code": "IMMEDIATE_MANDATORY_EVACUATION"},
    ],
}


# ---------------------------------------------------------------- Gemini timeout units
def test_gemini_timeout_is_milliseconds_not_seconds():
    """google-genai HttpOptions.timeout is in ms; 15.0 meant 15 ms and every call timed out."""
    assert GEMINI_TIMEOUT_MS >= 10_000


def test_call_gemini_passes_millisecond_timeout_and_returns_text(monkeypatch):
    from google import genai

    captured = {}

    class FakeModels:
        def generate_content(self, model, contents, config):
            captured["model"] = model
            captured["config"] = config
            class R:  # noqa: D401
                text = "  Winds of 110 km/h and a storm surge of 2.85 m are expected.  "
            return R()

    class FakeClient:
        def __init__(self, api_key, http_options):
            captured["timeout"] = http_options.timeout
            self.models = FakeModels()

    monkeypatch.setattr(genai, "Client", FakeClient)
    monkeypatch.setattr(advisory_engine, "api_key", "test-key-not-real")

    text, reason = advisory_engine._call_gemini("prompt")
    assert reason is None
    assert text.startswith("Winds of 110")
    assert captured["timeout"] == GEMINI_TIMEOUT_MS
    assert captured["config"].max_output_tokens >= 1024


# ---------------------------------------------------------------- error classification
def test_read_timeout_classified_as_timeout_not_communication_error():
    """'timed out' (httpx) previously fell through to API_COMMUNICATION_ERROR."""
    reason, detail = classify_gemini_error(httpx.ReadTimeout("timed out"))
    assert reason == "REQUEST_TIMEOUT"
    assert detail == "ReadTimeout"


@pytest.mark.parametrize(
    "code,status,expected",
    [
        (429, "RESOURCE_EXHAUSTED", "QUOTA_EXCEEDED"),
        (400, "INVALID_ARGUMENT", "INVALID_REQUEST"),
        (403, "PERMISSION_DENIED", "INVALID_OR_UNAUTHORIZED_API_KEY"),
        (404, "NOT_FOUND", "MODEL_UNAVAILABLE"),
        (503, "UNAVAILABLE", "GEMINI_SERVER_ERROR"),
    ],
)
def test_api_errors_classified_by_http_code(code, status, expected):
    class FakeAPIError(Exception):
        def __init__(self):
            super().__init__(f"{code} {status}. some message")
            self.code = code
            self.status = status

    reason, detail = classify_gemini_error(FakeAPIError())
    assert reason == expected
    assert f"HTTP {code}" in detail


def test_api_key_invalid_message_classified():
    class FakeAPIError(Exception):
        code = 400
        status = "INVALID_ARGUMENT"
    e = FakeAPIError("400 INVALID_ARGUMENT. API key not valid. Please pass a valid API key.")
    assert classify_gemini_error(e)[0] == "INVALID_OR_UNAUTHORIZED_API_KEY"


def test_network_errors_classified():
    assert classify_gemini_error(httpx.ConnectError("boom"))[0] == "NETWORK_UNREACHABLE"


def test_fallback_detail_never_contains_api_key(monkeypatch):
    from google import genai

    secret = "AIza-SECRET-SHOULD-NOT-LEAK"

    class FakeClient:
        def __init__(self, api_key, http_options):
            raise httpx.ReadTimeout(f"timed out for key {api_key}")

    monkeypatch.setattr(genai, "Client", FakeClient)
    monkeypatch.setattr(advisory_engine, "api_key", secret)
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is False
    assert adv["fallback_reason"] == "REQUEST_TIMEOUT"
    assert adv["fallback_detail"] == "ReadTimeout"
    assert secret not in str(adv)


# ---------------------------------------------------------------- caching
def test_live_briefing_is_cached_but_fallbacks_are_not(monkeypatch):
    calls = {"n": 0}

    def fake_call(prompt):
        calls["n"] += 1
        return ("Winds of 110 km/h and storm surge of 2.85 m.", None)

    monkeypatch.setattr(advisory_engine, "_call_gemini", fake_call)
    first = advisory_engine.generate_advisory(GT)
    second = advisory_engine.generate_advisory(GT)
    assert first["is_live_ai"] and second["is_live_ai"]
    assert first["served_from_cache"] is False
    assert second["served_from_cache"] is True
    assert calls["n"] == 1

    advisory_engine._live_cache.clear()
    fails = {"n": 0}

    def failing(prompt):
        fails["n"] += 1
        return (None, "QUOTA_EXCEEDED")

    monkeypatch.setattr(advisory_engine, "_call_gemini", failing)
    advisory_engine.generate_advisory(GT)
    advisory_engine.generate_advisory(GT)
    assert fails["n"] == 2


# ---------------------------------------------------------------- health reporting
def test_health_reports_ai_runtime_without_exposing_key(client, monkeypatch):
    monkeypatch.setattr(vertex_gemini.settings, "GEMINI_API_KEY", "AIza-health-secret")
    data = client.get("/api/v1/health").json()
    ai = data["ai_runtime"]
    assert ai["gemini_api_key_configured"] is True
    assert ai["gemini_model"]
    assert ai["earth_engine_live"] is False
    assert "AIza-health-secret" not in str(data)


# ---------------------------------------------------------------- simulation safety
def _dispatches():
    adv = {"authority_guidance_en": "x", "metrics_cited": {}}
    return generate_early_warning_dispatches(
        GT["cyclone_metadata"], GT["cvi_rankings"][0], adv, GT["surge_scenario"]
    )


def test_cap_alert_is_marked_simulated_exercise():
    d = _dispatches()
    xml = d["cap_xml"]
    assert "<status>Exercise</status>" in xml
    assert "<status>Actual</status>" not in xml
    assert "<certainty>Likely</certainty>" in xml
    assert "Observed" not in xml
    assert "<note>" in xml and "SIMULATED EXERCISE" in xml
    assert d["cap_json"]["status"] == "Exercise"
    assert d["is_simulated"] is True


def test_cap_sender_does_not_impersonate_government_domain():
    d = _dispatches()
    blob = str(d).lower()
    assert "gov.in" not in blob
    assert "apsdma" not in blob
    assert d["cap_json"]["sender"].endswith("@example.org")


def test_channels_are_never_reported_as_queued_or_sent():
    d = _dispatches()
    for ch in d["channels"]:
        assert ch["status"] == "SIMULATED_NOT_SENT"
    sms = next(c for c in d["channels"] if c["channel_id"] == "CELL_BROADCAST_SMS")["payload"]
    assert sms["sms_english"].startswith("[DRILL]")
    assert sms["char_count_en"] == len(sms["sms_english"])
    assert sms["char_count_te"] == len(sms["sms_telugu"])


def test_insurance_is_labelled_as_model_not_real_release():
    res = evaluate_parametric_insurance(
        {"peak_wind_kmh": 130.0}, {"total_scenario_surge_m": 2.5}, {"max_24h_rainfall_mm": 210.0},
        {"district": "Bapatla", "cvi_score": 0.8},
    )
    assert res["is_simulated"] is True
    assert "RELEASED" not in res["execution_summary"]["payout_status"].replace("RELEASE_", "")
    assert res["execution_summary"]["payout_status"] == "MODELED_RELEASE_PRE_LANDFALL"
    assert "no real insurer" in res["facility_metadata"]["underwriter"].lower()
