"""
CYCLONEX Composite Vulnerability Index (CVI) Calculator
Computes transparent, multi-factor normalized vulnerability scores per administrative district/ward:

Formula:
  CVI = w_w * V_wind + w_s * S_surge + w_e * (1 - E_elevation) + w_i * I_infra - w_c * C_shelter

Weights sum to 1.00 and are fully explainable from first principles.
"""

from typing import Dict, Any, List


DEFAULT_WEIGHTS = {
    "wind": 0.35,       # w_w: Peak sustained wind speed exposure
    "surge": 0.35,      # w_s: Inundation area fraction
    "elevation": 0.15,  # w_e: Elevation deficit (1 - normalized elevation)
    "infra": 0.15,      # w_i: Critical infrastructure asset density
    "shelter": 0.05,    # w_c: Cyclone shelter capacity mitigation factor
}


def calculate_district_cvi(
    district_name: str,
    max_wind_kmh: float,
    surge_fraction: float,
    mean_elevation_m: float,
    critical_assets_count: int,
    shelter_capacity_ratio: float,
    weights: Dict[str, float] = None,
) -> Dict[str, Any]:
    """
    Computes deterministic Composite Vulnerability Index for an administrative district.

    Inputs are normalized strictly to [0.0, 1.0]:
      - V_wind: min(1.0, max_wind_kmh / 170.0)
      - S_surge: clamp(surge_fraction, 0.0, 1.0)
      - E_elevation: min(1.0, max(0.0, mean_elevation_m / 30.0)) -> Risk is (1 - E)
      - I_infra: min(1.0, critical_assets_count / 15.0)
      - C_shelter: clamp(shelter_capacity_ratio, 0.0, 1.0)
    """
    w = weights or DEFAULT_WEIGHTS

    v_wind = min(1.0, max(0.0, max_wind_kmh / 170.0))
    s_surge = min(1.0, max(0.0, surge_fraction))
    e_norm = min(1.0, max(0.0, mean_elevation_m / 30.0))
    e_risk = 1.0 - e_norm
    i_infra = min(1.0, max(0.0, critical_assets_count / 15.0))
    c_shelter = min(1.0, max(0.0, shelter_capacity_ratio))

    # Compute weighted sum
    raw_cvi = (
        w["wind"] * v_wind +
        w["surge"] * s_surge +
        w["elevation"] * e_risk +
        w["infra"] * i_infra -
        w["shelter"] * c_shelter
    )

    # Clamp bounded result between 0.0 and 1.0
    cvi_score = round(max(0.0, min(1.0, raw_cvi)), 3)

    # Classify Risk Level and Directive Severity
    if cvi_score >= 0.80:
        risk_level = "Extreme"
        risk_color = "#ef4444" # Red
        action_code = "IMMEDIATE_MANDATORY_EVACUATION"
    elif cvi_score >= 0.60:
        risk_level = "High"
        risk_color = "#f97316" # Orange
        action_code = "PREPARE_SHELTERS_EVACUATE_VULNERABLE"
    elif cvi_score >= 0.35:
        risk_level = "Moderate"
        risk_color = "#eab308" # Yellow
        action_code = "RESTRICT_MOVEMENT_SECURE_ASSETS"
    else:
        risk_level = "Low"
        risk_color = "#22c55e" # Green
        action_code = "MONITOR_UPDATES"

    return {
        "district": district_name,
        "cvi_score": cvi_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "action_code": action_code,
        "components": {
            "wind_exposure_normalized": round(v_wind, 3),
            "surge_inundation_fraction": round(s_surge, 3),
            "elevation_deficit_risk": round(e_risk, 3),
            "mean_elevation_m": round(mean_elevation_m, 1),
            "infrastructure_density_normalized": round(i_infra, 3),
            "shelter_mitigation_normalized": round(c_shelter, 3),
        },
        "weights_applied": w,
    }


def evaluate_coastal_districts(
    districts: List[Dict[str, Any]],
    weights: Dict[str, float] = None,
) -> List[Dict[str, Any]]:
    """Evaluates and ranks a batch of coastal districts by vulnerability score."""
    results = [
        calculate_district_cvi(
            district_name=d["name"],
            max_wind_kmh=d.get("max_wind_kmh", 100.0),
            surge_fraction=d.get("surge_fraction", 0.2),
            mean_elevation_m=d.get("mean_elevation_m", 5.0),
            critical_assets_count=d.get("critical_assets_count", 8),
            shelter_capacity_ratio=d.get("shelter_capacity_ratio", 0.6),
            weights=weights,
        )
        for d in districts
    ]
    # Sort descending by risk score
    return sorted(results, key=lambda x: x["cvi_score"], reverse=True)
