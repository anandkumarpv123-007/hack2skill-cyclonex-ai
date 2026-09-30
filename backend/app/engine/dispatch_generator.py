"""
CYCLONEX Automated Early-Warning Advisory Dispatch Engine
Generates standardized Common Alerting Protocol (CAP v1.2) payloads
and multi-channel emergency dispatch queues for municipal authorities,
SDMA command centers, cell broadcasts, and public safety feeds.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
import uuid


def generate_early_warning_dispatches(
    cyclone_metadata: Dict[str, Any],
    highest_cvi: Dict[str, Any],
    advisories: Dict[str, Any],
    surge_scenario: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Constructs CAP v1.2 XML/JSON alerts and multi-channel dispatch feeds
    tailored for municipal commissioners and district disaster managers.
    """
    storm_name = cyclone_metadata.get("name", "Cyclone")
    category = cyclone_metadata.get("category", "Severe Cyclonic Storm")
    peak_wind = cyclone_metadata.get("peak_wind_kmh", 100)
    landfall = cyclone_metadata.get("landfall_target", "Coastal Andhra Pradesh")
    surge_m = surge_scenario.get("total_scenario_surge_m", 2.0)
    
    district = highest_cvi.get("district", "Coastal District")
    cvi_score = highest_cvi.get("cvi_score", 0.75)
    risk_level = highest_cvi.get("risk_level", "High")

    urgency = "Immediate" if cvi_score >= 0.60 else "Expected"
    severity = "Extreme" if cvi_score >= 0.75 else "Severe" if cvi_score >= 0.50 else "Moderate"
    alert_id = f"IN-APSDMA-CYCLONEX-{uuid.uuid4().hex[:8].upper()}"
    timestamp_iso = datetime.now(timezone.utc).isoformat()

    # Standard Common Alerting Protocol (CAP v1.2) XML payload
    cap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{alert_id}</identifier>
  <sender>cyclonex.apsdma.gov.in</sender>
  <sent>{timestamp_iso}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>Severe Cyclone Storm Surge &amp; Wind Threat</event>
    <urgency>{urgency}</urgency>
    <severity>{severity}</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>IMD_COLOR_CODE</valueName>
      <value>{'RED' if severity == 'Extreme' else 'ORANGE'}</value>
    </eventCode>
    <headline>EMERGENCY ADVISORY: {storm_name.upper()} PRE-LANDFALL ACTION FOR {district.upper()}</headline>
    <description>Severe winds up to {peak_wind} km/h and scenario surge up to {surge_m}m threatening {landfall}. Composite Vulnerability Index: {cvi_score} ({risk_level}).</description>
    <instruction>Execute immediate mandatory coastal evacuation to designated elevated shelters. Power utilities prepare for controlled feeder de-energization.</instruction>
    <area>
      <areaDesc>{district}, Andhra Pradesh Coastal Sector</areaDesc>
    </area>
  </info>
</alert>"""

    # Multi-Channel Automated Dispatches
    channels: List[Dict[str, Any]] = [
        {
            "channel_id": "SDMA_COMMAND_WEBHOOK",
            "channel_name": "State Disaster Management Authority (SDMA) Command Feed",
            "protocol": "CAP-v1.2 JSON over HTTPS",
            "target": f"Collectorate & Municipal Control Room ({district})",
            "payload": {
                "alert_id": alert_id,
                "urgency": urgency,
                "severity": severity,
                "target_district": district,
                "cvi_score": cvi_score,
                "directive": advisories.get("authority_guidance_en", "")[:300] + "...",
            },
            "status": "QUEUED_FOR_DISPATCH",
        },
        {
            "channel_id": "CELL_BROADCAST_SMS",
            "channel_name": "Cellular Tower 2G/4G Geo-Targeted Broadcast",
            "protocol": "ETWS / GSM 03.38 Cell Broadcast",
            "target": f"All Active Cell Towers within {district} Coastal Belt (15km)",
            "payload": {
                "sms_english": f"ALERT: Cyclone {storm_name} winds {peak_wind}km/h & surge {surge_m}m at {district}. Evacuate low areas to nearest shelter. Call 1070 for help.",
                "sms_telugu": f"హెచ్చరిక: {storm_name} తుఫాను {peak_wind}కిమీ గాలులు. లోతట్టు ప్రజలు వెంటనే సురక్షిత ఆశ్రయాలకు వెళ్లండి. సహాయం: 1070.",
                "char_count_en": 128,
                "char_count_te": 88,
            },
            "status": "QUEUED_FOR_DISPATCH",
        },
        {
            "channel_id": "MUNICIPAL_SIREN_PA",
            "channel_name": "Municipal Ward-Level Acoustic Siren & Public Address",
            "protocol": "VHF Tone-Remote Control",
            "target": "24 Coastal Fish-Landing Centers & Ward Substations",
            "payload": {
                "siren_pattern": "LONG_CONTINUOUS_WAIL_3MIN" if severity == "Extreme" else "INTERMITTENT_ALERT_2MIN",
                "loudspeaker_audio_script": f"Attention residents: Cyclone {storm_name} landfall imminent near {district}. Move to cyclone shelter immediately.",
            },
            "status": "QUEUED_FOR_DISPATCH",
        },
        {
            "channel_id": "WHATSAPP_CITIZEN_BOT",
            "channel_name": "AP Disaster WhatsApp Citizen Advisory Broadcast",
            "protocol": "WhatsApp Cloud API Webhook",
            "target": f"Registered Residents in {district} and Surrounding Mandals",
            "payload": {
                "template": "cyclone_pre_landfall_warning",
                "quick_replies": ["Find Nearest Safe Shelter", "Hospital Bed Availability", "Emergency Helpline 1070"],
            },
            "status": "QUEUED_FOR_DISPATCH",
        },
    ]

    return {
        "dispatch_id": alert_id,
        "generated_at": timestamp_iso,
        "cap_xml": cap_xml,
        "cap_json": {
            "identifier": alert_id,
            "sender": "cyclonex.apsdma.gov.in",
            "sent": timestamp_iso,
            "status": "Actual",
            "msgType": "Alert",
            "scope": "Public",
            "info": {
                "category": "Met",
                "event": "Severe Cyclone Storm Surge & Wind Threat",
                "urgency": urgency,
                "severity": severity,
                "headline": f"EMERGENCY ADVISORY: {storm_name.upper()} ({district.upper()})",
                "areaDesc": district,
            },
        },
        "channels": channels,
    }
