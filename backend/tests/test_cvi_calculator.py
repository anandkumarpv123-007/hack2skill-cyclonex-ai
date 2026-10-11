import pytest
from app.engine.cvi_calculator import calculate_district_cvi, evaluate_coastal_districts


def test_calculate_district_cvi_bounds():
    """Verifies that CVI score is strictly bounded in [0.0, 1.0]."""
    # Extreme risk district
    extreme = calculate_district_cvi(
        district_name="Bapatla",
        max_wind_kmh=160.0,
        surge_fraction=0.85,
        mean_elevation_m=2.0,
        critical_assets_count=18,
        shelter_capacity_ratio=0.2,
    )
    assert 0.0 <= extreme["cvi_score"] <= 1.0
    assert extreme["risk_level"] in ["High", "Extreme"]

    # Low risk district
    low = calculate_district_cvi(
        district_name="Inland District",
        max_wind_kmh=40.0,
        surge_fraction=0.0,
        mean_elevation_m=45.0,
        critical_assets_count=2,
        shelter_capacity_ratio=0.9,
    )
    assert 0.0 <= low["cvi_score"] <= 1.0
    assert low["risk_level"] in ["Low", "Moderate"]


def test_evaluate_coastal_districts_ordering():
    """Verifies batch evaluation sorts districts by descending risk score."""
    districts = [
        {"name": "District A (Safe)", "max_wind_kmh": 50, "surge_fraction": 0.0, "mean_elevation_m": 40},
        {"name": "District B (Critical)", "max_wind_kmh": 160, "surge_fraction": 0.9, "mean_elevation_m": 1.5},
    ]
    ranked = evaluate_coastal_districts(districts)
    assert len(ranked) == 2
    assert ranked[0]["district"] == "District B (Critical)"
    assert ranked[0]["cvi_score"] > ranked[1]["cvi_score"]


def test_cvi_weight_arithmetic():
    """Verifies that the 4 positive hazard weights sum to 1.00 and shelter mitigation is 0.05."""
    from app.engine.cvi_calculator import DEFAULT_WEIGHTS

    positive_hazard_sum = (
        DEFAULT_WEIGHTS["wind"]
        + DEFAULT_WEIGHTS["surge"]
        + DEFAULT_WEIGHTS["elevation"]
        + DEFAULT_WEIGHTS["infra"]
    )
    assert positive_hazard_sum == pytest.approx(1.00)
    assert DEFAULT_WEIGHTS["shelter"] == pytest.approx(0.05)
    # The dictionary of all 5 magnitude coefficients sums to 1.05
    assert sum(DEFAULT_WEIGHTS.values()) == pytest.approx(1.05)


def test_cvi_shelter_mitigation_subtraction():
    """Verifies that shelter mitigation strictly reduces vulnerability score as designed."""
    base_params = dict(
        district_name="Test District",
        max_wind_kmh=120.0,
        surge_fraction=0.5,
        mean_elevation_m=5.0,
        critical_assets_count=10,
    )
    unmitigated = calculate_district_cvi(**base_params, shelter_capacity_ratio=0.0)
    mitigated = calculate_district_cvi(**base_params, shelter_capacity_ratio=1.0)

    # Max shelter capacity (1.0) with weight 0.05 reduces raw CVI by exactly 0.05
    assert mitigated["cvi_score"] < unmitigated["cvi_score"]
    assert unmitigated["cvi_score"] - mitigated["cvi_score"] == pytest.approx(0.05, abs=0.001)


def test_cvi_clamping_edge_cases():
    """Verifies bounding logic: raw negative clamps to 0.0, maximum unmitigated is 1.0."""
    # Zero hazard, full shelter -> raw CVI = -0.05, must clamp to 0.0
    zero_hazard = calculate_district_cvi(
        district_name="Zero Hazard",
        max_wind_kmh=0.0,
        surge_fraction=0.0,
        mean_elevation_m=35.0,  # elevation >= 30 means elevation deficit = 0.0
        critical_assets_count=0,
        shelter_capacity_ratio=1.0,
    )
    assert zero_hazard["cvi_score"] == 0.0
    assert zero_hazard["risk_level"] == "Low"

    # Max hazard, zero shelter -> raw CVI = 1.00
    max_hazard_no_shelter = calculate_district_cvi(
        district_name="Max Hazard No Shelter",
        max_wind_kmh=200.0,  # clamped to 1.0
        surge_fraction=1.0,
        mean_elevation_m=0.0,  # deficit = 1.0
        critical_assets_count=20,  # clamped to 1.0
        shelter_capacity_ratio=0.0,
    )
    assert max_hazard_no_shelter["cvi_score"] == 1.0
    assert max_hazard_no_shelter["risk_level"] == "Extreme"


def test_cvi_boundary_thresholds_and_rounding():
    """
    Verifies exact threshold boundaries at 0.30, 0.50, and 0.70,
    including the round-before-threshold behavior.
    """
    # Test boundary 0.70: Extreme vs High
    # We construct custom weights where a controlled raw score is produced
    custom_w = {"wind": 1.0, "surge": 0.0, "elevation": 0.0, "infra": 0.0, "shelter": 0.0}

    # 0.700 exactly -> Extreme
    res_070 = calculate_district_cvi("B070", max_wind_kmh=170.0 * 0.700, surge_fraction=0, mean_elevation_m=30, critical_assets_count=0, shelter_capacity_ratio=0, weights=custom_w)
    assert res_070["cvi_score"] == 0.700
    assert res_070["risk_level"] == "Extreme"
    assert res_070["action_code"] == "IMMEDIATE_MANDATORY_EVACUATION"

    # 0.699 -> High
    res_0699 = calculate_district_cvi("B0699", max_wind_kmh=170.0 * 0.699, surge_fraction=0, mean_elevation_m=30, critical_assets_count=0, shelter_capacity_ratio=0, weights=custom_w)
    assert res_0699["cvi_score"] == 0.699
    assert res_0699["risk_level"] == "High"
    assert res_0699["action_code"] == "PREPARE_SHELTERS_EVACUATE_VULNERABLE"

    # 0.500 exactly -> High
    res_050 = calculate_district_cvi("B050", max_wind_kmh=170.0 * 0.500, surge_fraction=0, mean_elevation_m=30, critical_assets_count=0, shelter_capacity_ratio=0, weights=custom_w)
    assert res_050["cvi_score"] == 0.500
    assert res_050["risk_level"] == "High"
    assert res_050["action_code"] == "PREPARE_SHELTERS_EVACUATE_VULNERABLE"

    # 0.499 -> Moderate
    res_0499 = calculate_district_cvi("B0499", max_wind_kmh=170.0 * 0.499, surge_fraction=0, mean_elevation_m=30, critical_assets_count=0, shelter_capacity_ratio=0, weights=custom_w)
    assert res_0499["cvi_score"] == 0.499
    assert res_0499["risk_level"] == "Moderate"
    assert res_0499["action_code"] == "RESTRICT_MOVEMENT_SECURE_ASSETS"

    # 0.300 exactly -> Moderate
    res_030 = calculate_district_cvi("B030", max_wind_kmh=170.0 * 0.300, surge_fraction=0, mean_elevation_m=30, critical_assets_count=0, shelter_capacity_ratio=0, weights=custom_w)
    assert res_030["cvi_score"] == 0.300
    assert res_030["risk_level"] == "Moderate"
    assert res_030["action_code"] == "RESTRICT_MOVEMENT_SECURE_ASSETS"

    # 0.299 -> Low
    res_0299 = calculate_district_cvi("B0299", max_wind_kmh=170.0 * 0.299, surge_fraction=0, mean_elevation_m=30, critical_assets_count=0, shelter_capacity_ratio=0, weights=custom_w)
    assert res_0299["cvi_score"] == 0.299
    assert res_0299["risk_level"] == "Low"
    assert res_0299["action_code"] == "MONITOR_UPDATES"

    # Round-before-threshold: 0.6996 rounds to 0.700 -> Extreme
    res_round_up = calculate_district_cvi("BRoundUp", max_wind_kmh=170.0 * 0.6996, surge_fraction=0, mean_elevation_m=30, critical_assets_count=0, shelter_capacity_ratio=0, weights=custom_w)
    assert res_round_up["cvi_score"] == 0.700
    assert res_round_up["risk_level"] == "Extreme"


def test_cvi_non_finite_and_invalid_inputs():
    """Verifies that calculate_district_cvi rejects NaN, Inf, invalid types, and negative values."""
    import math

    base_args = dict(
        district_name="Test District",
        max_wind_kmh=120.0,
        surge_fraction=0.5,
        mean_elevation_m=10.0,
        critical_assets_count=5,
        shelter_capacity_ratio=0.5,
    )

    # Test non-finite numeric inputs for each parameter
    for param in ["max_wind_kmh", "surge_fraction", "mean_elevation_m", "critical_assets_count", "shelter_capacity_ratio"]:
        for bad_val in [float("nan"), float("inf"), float("-inf"), math.nan, math.inf, -math.inf]:
            bad_kwargs = dict(base_args)
            bad_kwargs[param] = bad_val
            with pytest.raises(ValueError, match=f"must be a finite numeric value"):
                calculate_district_cvi(**bad_kwargs)

    # Test invalid types: string, None, boolean
    for param in ["max_wind_kmh", "surge_fraction", "mean_elevation_m", "critical_assets_count", "shelter_capacity_ratio"]:
        for bad_val in ["invalid", None, True, False]:
            bad_kwargs = dict(base_args)
            bad_kwargs[param] = bad_val
            with pytest.raises(ValueError, match=f"must be a finite numeric value"):
                calculate_district_cvi(**bad_kwargs)

    # Test negative values (elevation may be negative/below sea level, but wind, surge, assets, shelter cannot)
    negative_checks = [
        ("max_wind_kmh", -10.0),
        ("surge_fraction", -0.1),
        ("critical_assets_count", -1),
        ("shelter_capacity_ratio", -0.2),
    ]
    for param, neg_val in negative_checks:
        bad_kwargs = dict(base_args)
        bad_kwargs[param] = neg_val
        with pytest.raises(ValueError, match="cannot be negative"):
            calculate_district_cvi(**bad_kwargs)


def test_cvi_missing_and_invalid_weight_keys():
    """Verifies that weights dictionary validation rejects missing keys, non-finite values, or negative weights."""
    import math

    base_args = dict(
        district_name="Test District",
        max_wind_kmh=120.0,
        surge_fraction=0.5,
        mean_elevation_m=10.0,
        critical_assets_count=5,
        shelter_capacity_ratio=0.5,
    )

    # Missing required keys
    incomplete_weights = {"wind": 0.35, "surge": 0.25, "elevation": 0.20}  # missing infra & shelter
    with pytest.raises(ValueError, match="missing required factor"):
        calculate_district_cvi(**base_args, weights=incomplete_weights)

    # Non-dict weights
    with pytest.raises(ValueError, match="Weights must be a dictionary"):
        calculate_district_cvi(**base_args, weights=[0.35, 0.25, 0.20, 0.20, 0.05])

    # Non-finite weight values
    bad_val_weights = {"wind": math.nan, "surge": 0.25, "elevation": 0.20, "infra": 0.20, "shelter": 0.05}
    with pytest.raises(ValueError, match="must be a finite numeric value"):
        calculate_district_cvi(**base_args, weights=bad_val_weights)

    # Negative weight value
    neg_weights = {"wind": -0.35, "surge": 0.25, "elevation": 0.20, "infra": 0.20, "shelter": 0.05}
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_district_cvi(**base_args, weights=neg_weights)
