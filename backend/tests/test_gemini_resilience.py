"""
Gemini resilience: bounded retry on transient 5xx, one fallback model, honest model reporting.
Uses a scripted fake google-genai client; no network calls.
"""

import pytest
from google import genai

from app.ai import vertex_gemini
from app.ai.vertex_gemini import advisory_engine
from tests.test_gemini_runtime_and_simulation_safety import GT


class FakeAPIError(Exception):
    def __init__(self, code, status, message=""):
        super().__init__(f"{code} {status}. {message}")
        self.code = code
        self.status = status


def _install(monkeypatch, script, primary="gemini-3.8-flash", fallback="gemini-3.5-flash"):
    """script: list of outcomes consumed in order; each is a str (success text) or an Exception."""
    calls = []

    class FakeModels:
        def generate_content(self, model, contents, config):
            calls.append({"model": model, "config": config})
            outcome = script.pop(0)
            if isinstance(outcome, Exception):
                raise outcome
            class R:
                text = outcome
            return R()

    class FakeClient:
        def __init__(self, api_key, http_options):
            self.models = FakeModels()

    monkeypatch.setattr(genai, "Client", FakeClient)
    monkeypatch.setattr(vertex_gemini.time, "sleep", lambda s: None)
    monkeypatch.setattr(advisory_engine, "api_key", "test-key-not-real")
    monkeypatch.setattr(advisory_engine, "model_name", primary)
    monkeypatch.setattr(advisory_engine, "fallback_model_name", fallback)
    monkeypatch.setattr(advisory_engine, "thinking_level", "LOW")
    return calls


OK = "Winds of 110 km/h and a storm surge of 2.85 m are expected."


def test_transient_503_is_retried_once_on_same_model(monkeypatch):
    calls = _install(monkeypatch, [FakeAPIError(503, "UNAVAILABLE", "high demand"), OK])
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is True and adv["fallback_reason"] is None
    assert [c["model"] for c in calls] == ["gemini-3.8-flash", "gemini-3.8-flash"]
    assert adv["model"] == "gemini-3.8-flash"


def test_persistent_503_moves_to_fallback_model_and_reports_it(monkeypatch):
    calls = _install(monkeypatch, [
        FakeAPIError(503, "UNAVAILABLE"), FakeAPIError(503, "UNAVAILABLE"), OK])
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is True
    assert [c["model"] for c in calls] == ["gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.5-flash"]
    assert adv["model"] == "gemini-3.5-flash"  # honest: reports the model that actually answered


def test_404_model_goes_straight_to_fallback_without_retry(monkeypatch):
    calls = _install(monkeypatch, [FakeAPIError(404, "NOT_FOUND", "no longer available"), OK])
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is True
    assert [c["model"] for c in calls] == ["gemini-3.8-flash", "gemini-3.5-flash"]


def test_total_outage_returns_identified_deterministic_fallback(monkeypatch):
    calls = _install(monkeypatch, [FakeAPIError(503, "UNAVAILABLE")] * 4)
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is False
    assert adv["gemini_briefing"] is None
    assert adv["fallback_reason"] == "GEMINI_SERVER_ERROR"
    assert "HTTP 503" in adv["fallback_detail"]
    assert adv["model"] == "deterministic-rule-template"
    assert len(calls) == 4  # 2 attempts x 2 models, then stop
    assert "IMMEDIATE MANDATORY COASTAL EVACUATION" in adv["authority_guidance_en"]


def test_auth_error_is_not_retried(monkeypatch):
    calls = _install(monkeypatch, [FakeAPIError(403, "PERMISSION_DENIED")])
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is False
    assert adv["fallback_reason"] == "INVALID_OR_UNAUTHORIZED_API_KEY"
    assert len(calls) == 1


def test_timeout_is_not_retried(monkeypatch):
    import httpx
    calls = _install(monkeypatch, [httpx.ReadTimeout("timed out")])
    adv = advisory_engine.generate_advisory(GT)
    assert adv["fallback_reason"] == "REQUEST_TIMEOUT"
    assert len(calls) == 1


def test_thinking_option_rejected_is_retried_without_it(monkeypatch):
    calls = _install(monkeypatch, [
        FakeAPIError(400, "INVALID_ARGUMENT", "thinking_level is not supported for this model"), OK])
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is True
    assert calls[0]["config"].thinking_config is not None
    assert calls[1]["config"].thinking_config is None


def test_gemini3_gets_low_thinking_and_per_request_timeout(monkeypatch):
    calls = _install(monkeypatch, [OK])
    advisory_engine.generate_advisory(GT)
    cfg = calls[0]["config"]
    assert str(cfg.thinking_config.thinking_level).upper().endswith("LOW")
    assert 0 < cfg.http_options.timeout <= vertex_gemini.GEMINI_TIMEOUT_MS


def test_no_fallback_model_configured(monkeypatch):
    calls = _install(monkeypatch, [FakeAPIError(404, "NOT_FOUND")], fallback="")
    adv = advisory_engine.generate_advisory(GT)
    assert adv["fallback_reason"] == "MODEL_UNAVAILABLE"
    assert len(calls) == 1


def test_cached_briefing_keeps_model_that_answered(monkeypatch):
    _install(monkeypatch, [FakeAPIError(404, "NOT_FOUND"), OK])
    first = advisory_engine.generate_advisory(GT)
    second = advisory_engine.generate_advisory(GT)
    assert second["served_from_cache"] is True
    assert first["model"] == second["model"] == "gemini-3.5-flash"


def test_defaults_point_to_available_model():
    from app.core.config import Settings
    assert Settings.model_fields["GEMINI_MODEL"].default == "gemini-3.5-flash-lite"
    assert Settings.model_fields["GEMINI_FALLBACK_MODEL"].default == "gemini-flash-lite-latest"
    assert Settings.model_fields["GEMINI_THINKING_LEVEL"].default == "LOW"


def test_every_attempt_gets_at_least_the_minimum_server_deadline(monkeypatch):
    """Regression (13 Oct): after a slow 503 on the primary, the fallback was sent with a
    deadline under 10 s and the Gemini API answered 400 INVALID_ARGUMENT."""
    clock = {"t": 1000.0}
    monkeypatch.setattr(vertex_gemini.time, "monotonic", lambda: clock["t"])
    script = [FakeAPIError(503, "UNAVAILABLE", "high demand"),
              FakeAPIError(503, "UNAVAILABLE", "high demand"),
              OK]
    calls = _install(monkeypatch, script)
    orig = genai.Client

    class SlowClient(orig):
        def __init__(self, api_key, http_options):
            super().__init__(api_key, http_options)
            inner = self.models.generate_content

            def slow(model, contents, config):
                clock["t"] += 6.0  # each failed call burns 6 s
                return inner(model=model, contents=contents, config=config)
            self.models.generate_content = slow

    monkeypatch.setattr(genai, "Client", SlowClient)
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is True
    assert all(c["config"].http_options.timeout >= vertex_gemini.GEMINI_MIN_ATTEMPT_S * 1000 for c in calls)
    assert [c["model"] for c in calls][-1] == "gemini-3.5-flash"


def test_deadline_too_short_400_moves_to_next_model(monkeypatch):
    calls = _install(monkeypatch, [FakeAPIError(400, "INVALID_ARGUMENT", "Deadline is too short"), OK])
    adv = advisory_engine.generate_advisory(GT)
    assert adv["is_live_ai"] is True
    assert [c["model"] for c in calls] == ["gemini-3.8-flash", "gemini-3.5-flash"]
