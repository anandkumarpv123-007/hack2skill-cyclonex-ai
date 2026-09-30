"""
CYCLONEX Parametric Disaster Insurance Liquidity Trigger Engine
Models anticipatory pre-landfall liquidity release based on verifiable,
deterministic physical threshold triggers (wind velocity, storm surge, pluvial rainfall, CVI).
Bypasses traditional post-landfall indemnity delays to release rapid relief capital.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone


def evaluate_parametric_insurance(
    cyclone_metadata: Dict[str, Any],
    surge_scenario: Dict[str, Any],
    rainfall_summary: Dict[str, Any],
    highest_cvi: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Evaluates policy trigger criteria across 4 parametric tranches.
    Returns deterministic payout calculation, beneficiary tranches, and verification audit trail.
    """
    peak_wind = float(cyclone_metadata.get("peak_wind_kmh", 100.0))
    surge_height = float(surge_scenario.get("total_scenario_surge_m", 1.8))
    max_rain = float(rainfall_summary.get("max_24h_rainfall_mm", 160.0))
    cvi_score = float(highest_cvi.get("cvi_score", 0.65))
    target_district = highest_cvi.get("district", "Coastal Andhra Pradesh")

    total_facility_pool_inr_cr = 50.0  # ₹50 Crore ($6.0M USD equivalent)

    # 1. Tranche 1: Gale/Storm Pre-Evacuation Tranche (30% = ₹15 Cr)
    trigger_1_threshold_kmh = 93.0  # 50 knots
    trigger_1_activated = peak_wind >= trigger_1_threshold_kmh
    tranche_1_payout_cr = 15.0 if trigger_1_activated else 0.0

    # 2. Tranche 2: Hurricane Infrastructure Resilience Tranche (40% = ₹20 Cr)
    trigger_2_threshold_kmh = 118.5  # 64 knots
    trigger_2_activated = peak_wind >= trigger_2_threshold_kmh
    tranche_2_payout_cr = 20.0 if trigger_2_activated else 0.0

    # 3. Tranche 3: Coastal Surge Inundation Tranche (20% = ₹10 Cr)
    trigger_3_threshold_m = 2.0
    trigger_3_activated = surge_height >= trigger_3_threshold_m
    tranche_3_payout_cr = 10.0 if trigger_3_activated else 0.0

    # 4. Tranche 4: Compound Pluvial & Vulnerability Tranche (10% = ₹5 Cr)
    trigger_4_activated = max_rain >= 200.0 and cvi_score >= 0.70
    tranche_4_payout_cr = 5.0 if trigger_4_activated else 0.0

    total_released_cr = tranche_1_payout_cr + tranche_2_payout_cr + tranche_3_payout_cr + tranche_4_payout_cr
    payout_percentage = round((total_released_cr / total_facility_pool_inr_cr) * 100, 1)

    triggers: List[Dict[str, Any]] = [
        {
            "id": "PARAM_TRIG_01",
            "name": "50-kt Gale Evacuation Liquidity",
            "condition": f"Peak Wind >= {trigger_1_threshold_kmh} km/h (50 kt)",
            "measured_value": f"{peak_wind} km/h",
            "status": "TRIGGERED" if trigger_1_activated else "STANDBY",
            "allocated_cr": 15.0,
            "released_cr": tranche_1_payout_cr,
            "earmarked_for": "Municipal bus transit fuel, 72h potable water rationing, dry food packets",
        },
        {
            "id": "PARAM_TRIG_02",
            "name": "64-kt Hurricane Grid Hardening",
            "condition": f"Peak Wind >= {trigger_2_threshold_kmh} km/h (64 kt)",
            "measured_value": f"{peak_wind} km/h",
            "status": "TRIGGERED" if trigger_2_activated else "NOT_MET",
            "allocated_cr": 20.0,
            "released_cr": tranche_2_payout_cr,
            "earmarked_for": "Emergency substation mobile transformers, hospital DG generator fuel reserves",
        },
        {
            "id": "PARAM_TRIG_03",
            "name": "Coastal Storm Surge Inundation Relief",
            "condition": f"Scenario Surge >= {trigger_3_threshold_m} m MSL",
            "measured_value": f"{surge_height} m",
            "status": "TRIGGERED" if trigger_3_activated else "NOT_MET",
            "allocated_cr": 10.0,
            "released_cr": tranche_3_payout_cr,
            "earmarked_for": "Artisanal fisherfolk equipment safeguarding, coastal embankment geotextile sandbags",
        },
        {
            "id": "PARAM_TRIG_04",
            "name": "Compound Pluvial & Vulnerability Catchment",
            "condition": "24h Rain >= 200 mm AND District CVI >= 0.70",
            "measured_value": f"{max_rain} mm Rain | CVI {cvi_score}",
            "status": "TRIGGERED" if trigger_4_activated else "NOT_MET",
            "allocated_cr": 5.0,
            "released_cr": tranche_4_payout_cr,
            "earmarked_for": "High-capacity de-watering tractor pumps, NH-16 culvert breach rapid repair teams",
        },
    ]

    # Beneficiary municipal disbursement breakdown
    disbursements: List[Dict[str, Any]] = [
        {
            "beneficiary": f"{target_district} District Disaster Management Authority (DDMA)",
            "share_percent": 45,
            "amount_cr": round(total_released_cr * 0.45, 2),
            "purpose": "Ward-level evacuation centers and relief staging",
        },
        {
            "beneficiary": "AP Eastern Power Distribution Company (APEPDCL)",
            "share_percent": 30,
            "amount_cr": round(total_released_cr * 0.30, 2),
            "purpose": "Transmission tower emergency staging & transformer protection",
        },
        {
            "beneficiary": "State Highways & Drainage Taskforce",
            "share_percent": 25,
            "amount_cr": round(total_released_cr * 0.25, 2),
            "purpose": "Arterial road clearing & mobile de-watering pump deployment",
        },
    ]

    return {
        "facility_metadata": {
            "policy_name": "Bay of Bengal Anticipatory Parametric Disaster Facility",
            "underwriter": "Global Climate Insurance Consortium / State Disaster Pool",
            "insured_state": "Andhra Pradesh, India",
            "total_facility_pool_inr_cr": total_facility_pool_inr_cr,
            "total_facility_pool_usd_m": round(total_facility_pool_inr_cr / 8.35, 2),
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
        },
        "execution_summary": {
            "payout_status": "LIQUIDITY_RELEASED_PRE_LANDFALL" if total_released_cr > 0 else "POLICY_STANDBY",
            "total_released_inr_cr": round(total_released_cr, 2),
            "total_released_usd_m": round(total_released_cr / 8.35, 2),
            "payout_percentage": payout_percentage,
            "active_triggers_count": len([t for t in triggers if t["status"] == "TRIGGERED"]),
            "priority_beneficiary": target_district,
        },
        "triggers": triggers,
        "disbursements": disbursements,
    }
