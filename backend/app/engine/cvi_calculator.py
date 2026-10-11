"""
CYCLONEX Composite Vulnerability Index (CVI) Calculator
Computes transparent, multi-factor normalized vulnerability scores per administrative district/ward:

Formula:
  CVI = w_w * V_wind + w_s * S_surge + w_e * (1 - E_elevation) + w_i * I_infra - w_c * C_shelter

Weight Arithmetic & Explainability:
  - 4 Positive Hazard & Exposure Weights:
      w_w (wind: 0.35) + w_s (surge: 0.35) + w_e (elevation: 0.15) + w_i (infra: 0.15) = 1.00
  - 1 Protective Mitigation Factor (Subtracted):
      w_c (shelter: 0.05) is subtracted as a mitigation credit (- w_c * C_shelter)
  - Parameter Dictionary Total:
      The 5 dictionary magnitude values total 1.05 (1.00 hazard exposure baseline + 0.05 mitigation credit cap).
  - Theoretical Raw CVI Range:
      [-0.05, 1.00], strictly clamped to [0.0, 1.0].
  - Rounding & Threshold Boundary Semantics:
      Raw score is rounded to 3 decimal places (`round(raw, 3)`) before threshold classification:
        * >= 0.700: Extreme (IMMEDIATE_MANDATORY_EVACUATION)
        * >= 0.500 and < 0.700: High (PREPARE_SHELTERS_EVACUATE_VULNERABLE)
        * >= 0.300 and < 0.500: Moderate (RESTRICT_MOVEMENT_SECURE_ASSETS)
        * < 0.300: Low (MONITOR_UPDATES)
      Exact boundary values (0.300, 0.500, 0.700) fall into the higher risk category.
"""

import math
from typing import Dict, Any, List


DEFAULT_WEIGHTS = {
    "wind": 0.35,       # w_w: Peak sustained wind speed exposure (additive)
    "surge": 0.35,      # w_s: Inundation area fraction (additive)
    "elevation": 0.15,  # w_e: Elevation deficit (1 - normalized elevation) (additive)
    "infra": 0.15,      # w_i: Critical infrastructure asset density (additive)
    "shelter": 0.05,    # w_c: Cyclone shelter capacity mitigation factor (subtractive)
}

REQUIRED_WEIGHT_KEYS = {"wind", "surge", "elevation", "infra", "shelter"}


def _validate_finite_numeric(val: Any, param_name: str, allow_negative: bool = True) -> float:
    """
    Validates that an input is a real, finite numeric value.
    Rejects None, booleans, non-numeric types, NaN, +Inf, and -Inf with ValueError.
    """
    if val is None or isinstance(val, bool) or not isinstance(val, (int, float)):
        raise ValueError(
            f"Input '{param_name}' must be a finite numeric value, got {type(val).__name__} ({val!r})."
        )
    fval = float(val)
    if math.isnan(fval) or math.isinf(fval):
        raise ValueError(
            f"Input '{param_name}' must be a finite numeric value, got non-finite {fval!r}."
        )
    if not allow_negative and fval < 0.0:
        raise ValueError(
            f"Input '{param_name}' cannot be negative, got {fval!r}."
        )
    return fval


def _validate_weights(weights: Dict[str, float]) -> Dict[str, float]:
    """Validates that a custom weights dictionary contains all required factors with finite, non-negative values."""
    if not isinstance(weights, dict):
        raise ValueError(f"Weights must be a dictionary, got {type(weights).__name__}.")
    missing = REQUIRED_WEIGHT_KEYS - set(weights.keys())
    if missing:
        raise ValueError(f"Weights dictionary missing required factor(s): {sorted(missing)}.")
    validated = {}
    for k in REQUIRED_WEIGHT_KEYS:
        validated[k] = _validate_finite_numeric(weights[k], f"weights['{k}']", allow_negative=False)
    return validated


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

    Inputs are validated at the boundary for finite real numbers, then normalized to [0.0, 1.0]:
      - V_wind: min(1.0, max_wind_kmh / 170.0)
      - S_surge: clamp(surge_fraction, 0.0, 1.0)
      - E_elevation: min(1.0, max(0.0, mean_elevation_m / 30.0)) -> Risk is (1 - E)
      - I_infra: min(1.0, critical_assets_count / 15.0)
      - C_shelter: clamp(shelter_capacity_ratio, 0.0, 1.0)

    Weight Structure:
      - Positive hazard/exposure weights (wind + surge + elevation + infra) = 1.00
      - Shelter mitigation is subtracted (- shelter * C_shelter) with a max credit of 0.05.
      - Dictionary magnitudes sum to 1.05; final score is clamped to [0.0, 1.0].
    """
    if not district_name or not isinstance(district_name, str) or not district_name.strip():
        raise ValueError("district_name must be a non-empty string.")

    v_wind_val = _validate_finite_numeric(max_wind_kmh, "max_wind_kmh", allow_negative=False)
    s_surge_val = _validate_finite_numeric(surge_fraction, "surge_fraction", allow_negative=False)
    e_elev_val = _validate_finite_numeric(mean_elevation_m, "mean_elevation_m", allow_negative=True)
    i_infra_val = _validate_finite_numeric(critical_assets_count, "critical_assets_count", allow_negative=False)
    c_shelter_val = _validate_finite_numeric(shelter_capacity_ratio, "shelter_capacity_ratio", allow_negative=False)

    w = _validate_weights(weights) if weights is not None else DEFAULT_WEIGHTS

    v_wind = min(1.0, max(0.0, v_wind_val / 170.0))
    s_surge = min(1.0, max(0.0, s_surge_val))
    e_norm = min(1.0, max(0.0, e_elev_val / 30.0))
    e_risk = 1.0 - e_norm
    i_infra = min(1.0, max(0.0, i_infra_val / 15.0))
    c_shelter = min(1.0, max(0.0, c_shelter_val))

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

    # Classify Risk Level and Directive Severity (Unified CVI Threshold)
    if cvi_score >= 0.70:
        risk_level = "Extreme"
        risk_color = "#ef4444" # Red
        action_code = "IMMEDIATE_MANDATORY_EVACUATION"
    elif cvi_score >= 0.50:
        risk_level = "High"
        risk_color = "#f97316" # Orange
        action_code = "PREPARE_SHELTERS_EVACUATE_VULNERABLE"
    elif cvi_score >= 0.30:
        risk_level = "Moderate"
        risk_color = "#eab308" # Yellow
        action_code = "RESTRICT_MOVEMENT_SECURE_ASSETS"
    else:
        risk_level = "Low"
        risk_color = "#22c55e" # Green
        action_code = "MONITOR_UPDATES"

    return {
        "district": district_name.strip(),
        "cvi_score": cvi_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "action_code": action_code,
        "components": {
            "wind_exposure_normalized": round(v_wind, 3),
            "surge_inundation_fraction": round(s_surge, 3),
            "elevation_deficit_risk": round(e_risk, 3),
            "mean_elevation_m": round(e_elev_val, 1),
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
    if not isinstance(districts, list):
        raise ValueError(f"Districts must be a list, got {type(districts).__name__}.")
    validated_weights = _validate_weights(weights) if weights is not None else DEFAULT_WEIGHTS
    results = []
    for d in districts:
        if not isinstance(d, dict) or "name" not in d:
            raise ValueError(f"Each district entry must be a dictionary containing 'name', got: {d!r}")
        results.append(
            calculate_district_cvi(
                district_name=d["name"],
                max_wind_kmh=d.get("max_wind_kmh", 100.0),
                surge_fraction=d.get("surge_fraction", 0.2),
                mean_elevation_m=d.get("mean_elevation_m", 5.0),
                critical_assets_count=d.get("critical_assets_count", 8),
                shelter_capacity_ratio=d.get("shelter_capacity_ratio", 0.6),
                weights=validated_weights,
            )
        )
    # Sort descending by risk score
    return sorted(results, key=lambda x: x["cvi_score"], reverse=True)
