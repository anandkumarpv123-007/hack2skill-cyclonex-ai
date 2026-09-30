"""
Unit tests for CYCLONEX Parametric Disaster Insurance Liquidity Trigger Engine.
"""

from app.engine.parametric_insurance import evaluate_parametric_insurance


def test_evaluate_parametric_insurance_triggers():
    meta = {
        "name": "Cyclone Michaung",
        "peak_wind_kmh": 110.0,
    }
    surge = {"total_scenario_surge_m": 2.2}
    rainfall = {"max_24h_rainfall_mm": 210.0}
    cvi = {"district": "Bapatla", "cvi_score": 0.72}

    res = evaluate_parametric_insurance(meta, surge, rainfall, cvi)

    summary = res["execution_summary"]
    triggers = res["triggers"]
    disbursements = res["disbursements"]

    # Michaung: 110 km/h >= 93 km/h (50 kt trigger met)
    # Michaung: 110 km/h < 118.5 km/h (64 kt trigger NOT met)
    # Surge 2.2m >= 2.0m (surge trigger met)
    # Rain 210mm >= 200mm AND CVI 0.72 >= 0.70 (compound trigger met)
    # Released: 15 (tranche 1) + 10 (tranche 3) + 5 (tranche 4) = 30 Cr
    assert summary["payout_status"] == "LIQUIDITY_RELEASED_PRE_LANDFALL"
    assert summary["total_released_inr_cr"] == 30.0
    assert summary["active_triggers_count"] == 3
    assert len(disbursements) == 3

    # Check sum of disbursements matches released total
    total_disbursed = sum(d["amount_cr"] for d in disbursements)
    assert abs(total_disbursed - 30.0) < 0.1
