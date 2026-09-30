"""
Unit tests for CYCLONEX Automated Early-Warning Advisory Dispatch Engine.
"""

from app.engine.dispatch_generator import generate_early_warning_dispatches


def test_generate_early_warning_dispatches():
    meta = {
        "name": "Cyclone Michaung",
        "category": "Severe Cyclonic Storm",
        "peak_wind_kmh": 110.0,
        "landfall_target": "Bapatla Coast, AP",
    }
    cvi = {"district": "Bapatla", "cvi_score": 0.82, "risk_level": "Extreme"}
    advisory = {"authority_guidance_en": "Mandate evacuation"}
    surge = {"total_scenario_surge_m": 2.2}

    dispatches = generate_early_warning_dispatches(meta, cvi, advisory, surge)

    assert "dispatch_id" in dispatches
    assert "cap_xml" in dispatches
    assert "cap_json" in dispatches
    assert "channels" in dispatches

    # Verify CAP XML tags
    xml = dispatches["cap_xml"]
    assert "<identifier>" in xml
    assert "<category>Met</category>" in xml
    assert "<urgency>Immediate</urgency>" in xml
    assert "<severity>Extreme</severity>" in xml
    assert "BAPATLA" in xml

    # Verify multi-channel feeds
    channels = dispatches["channels"]
    assert len(channels) == 4
    channel_ids = [c["channel_id"] for c in channels]
    assert "SDMA_COMMAND_WEBHOOK" in channel_ids
    assert "CELL_BROADCAST_SMS" in channel_ids
    assert "MUNICIPAL_SIREN_PA" in channel_ids
    assert "WHATSAPP_CITIZEN_BOT" in channel_ids
