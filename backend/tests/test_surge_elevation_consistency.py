"""
Regression tests: surge-zone membership must agree with terrain elevation and follow the coastline.
(Previously an asset 1.8 m below the surge was marked safe while one 7.9 m above it was flooded.)
"""

from shapely.geometry import Point

from app.engine.surge_scenario import generate_surge_inundation_polygon
from app.engine.spatial_join import evaluate_asset_exposure
from app.engine.shelter_allocator import find_nearest_safe_shelters

HUDHUD_LANDFALL = (17.70, 83.31)
SURGE_M = 4.61


def _asset(id_, type_, lon, lat, elev):
    return {
        "id": id_, "name": id_, "type": type_, "district": "Visakhapatnam",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {"elevation_m": elev},
    }


def test_envelope_follows_coastline_east_of_landfall_longitude():
    env = generate_surge_inundation_polygon(*HUDHUD_LANDFALL, surge_height_m=SURGE_M)
    # RK Beach lies slightly EAST of the landfall longitude; the old west-only rectangle missed it.
    assert env["shapely"].contains(Point(83.318, 17.712))
    assert env["shapely"].is_valid


def test_low_lying_coastal_asset_is_inundated_and_high_ground_is_not():
    env = generate_surge_inundation_polygon(*HUDHUD_LANDFALL, surge_height_m=SURGE_M)
    assets = [
        _asset("RK_BEACH_SHELTER", "shelter", 83.318, 17.712, 2.8),   # 1.81 m below surge
        _asset("KGH_HOSPITAL", "hospital", 83.3056, 17.7088, 12.5),    # 7.89 m above surge
        _asset("KALPAKA_SUB", "substation", 83.215, 17.685, 6.0),      # 1.39 m above surge
    ]
    ex = evaluate_asset_exposure(assets, {}, env, surge_height_m=SURGE_M)
    by_id = {a["id"]: a for a in ex["all_evaluated_assets"]}
    assert by_id["RK_BEACH_SHELTER"]["in_surge_zone"] is True
    assert by_id["KGH_HOSPITAL"]["in_surge_zone"] is False
    assert by_id["KALPAKA_SUB"]["in_surge_zone"] is False
    assert ex["shelters_at_risk"]["in_surge"] == 1
    assert ex["hospitals_at_risk"]["in_surge"] == 0
    # Every asset flagged in the surge zone must sit below the surge height.
    for a in ex["all_evaluated_assets"]:
        if a["in_surge_zone"]:
            assert a["surge_margin_m"] < 0


def test_shelter_allocator_marks_low_shelter_unsafe_and_high_shelter_safe():
    env = generate_surge_inundation_polygon(*HUDHUD_LANDFALL, surge_height_m=SURGE_M)
    shelters = [
        {"id": "LOW", "name": "Low", "lat": 17.712, "lon": 83.318, "elevation_m": 2.8},
        {"id": "HIGH", "name": "High", "lat": 17.715, "lon": 83.316, "elevation_m": 15.0},
    ]
    res = {s["id"]: s for s in find_nearest_safe_shelters(
        17.71, 83.31, shelters, surge_polygon=env["shapely"], surge_height_m=SURGE_M, limit=5)}
    assert res["LOW"]["in_surge_zone"] is True and res["LOW"]["is_safe"] is False
    assert res["HIGH"]["in_surge_zone"] is False and res["HIGH"]["is_safe"] is True


def test_hudhud_end_to_end_consistency(client):
    g = client.post("/api/v1/risk/evaluate", json={"cyclone_id": "cyclone_hudhud_2014"}).json()
    for a in g["exposure_summary"]["all_evaluated_assets"]:
        if a["in_surge_zone"]:
            assert a["surge_margin_m"] < 0, a["name"]
    names = [a["name"] for a in g["exposure_summary"]["all_evaluated_assets"] if a["in_surge_zone"]]
    assert any("RK Beach" in n for n in names)
