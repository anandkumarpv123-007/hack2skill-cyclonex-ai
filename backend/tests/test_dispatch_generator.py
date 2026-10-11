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
    # Extreme risk fixture (CVI >= 0.700) authorizes mandatory evacuation
    assert "<instruction>Execute immediate mandatory coastal evacuation" in xml
    assert dispatches["cap_json"]["info"]["instruction"].startswith("Execute immediate mandatory coastal evacuation")

    # Verify multi-channel feeds
    channels = dispatches["channels"]
    assert len(channels) == 4
    channel_ids = [c["channel_id"] for c in channels]
    assert "SDMA_COMMAND_WEBHOOK" in channel_ids
    assert "CELL_BROADCAST_SMS" in channel_ids
    assert "MUNICIPAL_SIREN_PA" in channel_ids
    assert "WHATSAPP_CITIZEN_BOT" in channel_ids


def test_generate_early_warning_dispatches_high_risk_michaung():
    """
    Regression test verifying that for a High-risk scenario such as Cyclone Michaung at Bapatla
    (CVI 0.585, action_code: PREPARE_SHELTERS_EVACUATE_VULNERABLE), the CAP instruction does NOT issue
    unconditional mandatory coastal evacuation, but rather directs shelter preparation
    and evacuation of vulnerable populations.
    """
    meta = {
        "name": "Cyclone Michaung",
        "category": "Severe Cyclonic Storm",
        "peak_wind_kmh": 110.0,
        "landfall_target": "Bapatla / Chirala Coast, Andhra Pradesh",
    }
    cvi_high = {
        "district": "Bapatla",
        "cvi_score": 0.585,
        "risk_level": "High",
        "action_code": "PREPARE_SHELTERS_EVACUATE_VULNERABLE",
    }
    advisory = {
        "authority_guidance_en": "PREPARE SHELTERS AND EVACUATE VULNERABLE POPULATIONS.",
        "metrics_cited": {
            "district_action_code": "PREPARE_SHELTERS_EVACUATE_VULNERABLE",
            "district_risk_level": "High",
        },
    }
    surge = {"total_scenario_surge_m": 2.2}

    dispatches = generate_early_warning_dispatches(meta, cvi_high, advisory, surge)
    xml = dispatches["cap_xml"]

    # Must NOT issue unconditional mandatory evacuation
    assert "immediate mandatory coastal evacuation" not in xml.lower()
    # Must issue shelter preparation and vulnerable population evacuation
    assert "<instruction>Prepare shelters and evacuate vulnerable coastal populations." in xml
    assert dispatches["cap_json"]["info"]["instruction"] == (
        "Prepare shelters and evacuate vulnerable coastal populations. Power utilities prepare for controlled feeder de-energization."
    )


def test_generate_early_warning_dispatches_moderate_and_low_risk():
    """Verifies that Moderate and Low CVI scenarios generate appropriate non-evacuation instructions."""
    meta = {"name": "Cyclone Michaung", "peak_wind_kmh": 65.0}
    surge = {"total_scenario_surge_m": 1.2}

    # Moderate risk (CVI 0.42)
    cvi_mod = {
        "district": "Prakasam",
        "cvi_score": 0.42,
        "risk_level": "Moderate",
        "action_code": "RESTRICT_MOVEMENT_SECURE_ASSETS",
    }
    disp_mod = generate_early_warning_dispatches(meta, cvi_mod, {}, surge)
    assert "immediate mandatory coastal evacuation" not in disp_mod["cap_xml"].lower()
    assert "<instruction>Restrict non-essential movement and secure critical assets." in disp_mod["cap_xml"]

    # Low risk (CVI 0.22)
    cvi_low = {
        "district": "Nellore",
        "cvi_score": 0.22,
        "risk_level": "Low",
        "action_code": "MONITOR_UPDATES",
    }
    disp_low = generate_early_warning_dispatches(meta, cvi_low, {}, surge)
    assert "immediate mandatory coastal evacuation" not in disp_low["cap_xml"].lower()
    assert "<instruction>Monitor incident bulletins and maintain watch.</instruction>" in disp_low["cap_xml"]


def test_unknown_action_code_with_valid_extreme_risk_no_downgrade():
    """Verifies that an unknown action code does NOT downgrade an Extreme risk to monitoring."""
    meta = {"name": "Cyclone Michaung", "peak_wind_kmh": 140.0}
    surge = {"total_scenario_surge_m": 3.0}
    cvi_unknown = {
        "district": "Bapatla",
        "risk_level": "Extreme",
        "action_code": "UNRECOGNIZED_CUSTOM_ACTION_CODE",
    }
    dispatches = generate_early_warning_dispatches(meta, cvi_unknown, {}, surge)
    xml = dispatches["cap_xml"]
    assert "<instruction>Execute immediate mandatory coastal evacuation" in xml
    assert "<severity>Extreme</severity>" in xml
    assert "<urgency>Immediate</urgency>" in xml

    # Also test unknown action code with valid High risk
    cvi_high_unknown = {
        "district": "Bapatla",
        "risk_level": "High",
        "action_code": "UNKNOWN_ACTION",
    }
    disp_high = generate_early_warning_dispatches(meta, cvi_high_unknown, {}, surge)
    assert "<instruction>Prepare shelters and evacuate vulnerable coastal populations." in disp_high["cap_xml"]


def test_empty_or_invalid_risk_input_data_unavailable():
    """
    Verifies that empty or invalid risk inputs generate an explicit data-unavailable instruction
    rather than inventing an Extreme, High, or Low risk classification.
    """
    meta = {"name": "Cyclone Test"}
    surge = {}

    # 1. Empty dictionary
    disp_empty = generate_early_warning_dispatches(meta, {}, {}, surge)
    xml_empty = disp_empty["cap_xml"]
    assert "Risk assessment data unavailable" in xml_empty
    assert "Verify authoritative assessment and official emergency warnings" in xml_empty
    assert "mandatory coastal evacuation" not in xml_empty.lower()
    assert "<severity>Unknown</severity>" in xml_empty
    assert "<urgency>Unknown</urgency>" in xml_empty
    assert disp_empty["cap_json"]["info"]["instruction"] == (
        "Risk assessment data unavailable. Verify authoritative assessment and official emergency warnings before initiating operational action."
    )

    # 2. Malformed risk_level and missing cvi_score
    disp_malformed = generate_early_warning_dispatches(meta, {"risk_level": "SuperCriticalCustomLevel"}, {}, surge)
    assert "Risk assessment data unavailable" in disp_malformed["cap_xml"]
    assert "<severity>Unknown</severity>" in disp_malformed["cap_xml"]


def test_nan_infinite_and_non_numeric_cvi_handled_safely():
    """
    Verifies that NaN, positive infinity, negative infinity, and non-numeric CVI values
    are handled safely without inventing Extreme/Low risk or raising unhandled exceptions.
    """
    meta = {"name": "Cyclone Test"}
    surge = {}

    non_finite_cases = [
        float("nan"),
        float("inf"),
        float("-inf"),
        "invalid_non_numeric_score",
        None,
        True,
        False,
    ]

    for val in non_finite_cases:
        cvi_input = {"district": "Bapatla", "cvi_score": val}
        disp = generate_early_warning_dispatches(meta, cvi_input, {}, surge)
        xml = disp["cap_xml"]
        assert "Risk assessment data unavailable" in xml, f"Failed for cvi_score={val}"
        assert "<severity>Unknown</severity>" in xml, f"Failed for cvi_score={val}"
        assert "<urgency>Unknown</urgency>" in xml, f"Failed for cvi_score={val}"
        assert "immediate mandatory coastal evacuation" not in xml.lower()


def test_dynamic_xml_text_with_special_characters_is_valid_parseable_xml():
    """
    Verifies that dynamic values containing XML special characters (&, <, >)
    are safely escaped and yield fully valid, parseable CAP XML.
    """
    import xml.etree.ElementTree as ET

    meta = {
        "name": "Cyclone Alpha & Omega <Storm>",
        "landfall_target": "Bapatla & Chirala Coastal Corridor <Sector 4>",
        "peak_wind_kmh": 110.0,
    }
    cvi = {
        "district": "Krishna & Guntur <District>",
        "cvi_score": 0.585,
        "action_code": "PREPARE_SHELTERS_EVACUATE_VULNERABLE",
    }
    surge = {"total_scenario_surge_m": 2.2}

    disp = generate_early_warning_dispatches(meta, cvi, {}, surge)
    xml_str = disp["cap_xml"]

    # Verify raw unescaped ampersands or angle brackets do not corrupt the XML
    assert "Alpha & Omega" not in xml_str  # Must be escaped as &amp;
    assert "ALPHA &amp; OMEGA &lt;STORM&gt;" in xml_str
    assert "Krishna &amp; Guntur &lt;District&gt;" in xml_str

    # Must parse successfully with standard ElementTree without ParseError
    root = ET.fromstring(xml_str)
    assert root.tag.endswith("alert")

    # Find elements inside XML namespace
    ns = {"cap": "urn:oasis:names:tc:emergency:cap:1.2"}
    headline_el = root.find(".//cap:headline", ns)
    assert headline_el is not None
    assert "ALPHA & OMEGA <STORM>" in headline_el.text

    desc_el = root.find(".//cap:description", ns)
    assert desc_el is not None
    assert "Bapatla & Chirala Coastal Corridor <Sector 4>" in desc_el.text

    instr_el = root.find(".//cap:instruction", ns)
    assert instr_el is not None
    assert "Prepare shelters and evacuate vulnerable coastal populations." in instr_el.text
