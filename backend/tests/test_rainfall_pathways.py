"""
Unit tests for CYCLONEX Rainfall Damage Pathways & Drainage Bottleneck Engine.
"""

from app.engine.rainfall_pathways import predict_rainfall_damage_pathways, COASTAL_ARTERIAL_CORRIDORS


def test_predict_rainfall_damage_pathways_bounds():
    districts = [
        {"name": "Bapatla", "lat": 15.80, "lon": 80.55, "mean_elevation_m": 4.5, "coastal_slope_m_per_km": 0.35},
        {"name": "Visakhapatnam", "lat": 17.71, "lon": 83.30, "mean_elevation_m": 14.0, "coastal_slope_m_per_km": 1.40},
    ]
    
    # Test with Michaung landfall coordinates (Bapatla)
    res = predict_rainfall_damage_pathways(15.80, 80.55, 110.0, districts)
    
    assert "summary" in res
    assert "district_evaluations" in res
    assert "arterial_corridors" in res
    assert "drainage_corridors_geojson" in res
    
    # Bapatla is closest to landfall -> highest rainfall and drainage bottleneck
    bapatla_eval = next(d for d in res["district_evaluations"] if d["district"] == "Bapatla")
    vizag_eval = next(d for d in res["district_evaluations"] if d["district"] == "Visakhapatnam")
    
    assert bapatla_eval["predicted_24h_rainfall_mm"] > vizag_eval["predicted_24h_rainfall_mm"]
    assert bapatla_eval["drainage_vulnerability_index"] > vizag_eval["drainage_vulnerability_index"]
    assert 0.0 <= bapatla_eval["drainage_vulnerability_index"] <= 1.0
    
    # Verify GeoJSON structure
    geojson = res["drainage_corridors_geojson"]
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == len(COASTAL_ARTERIAL_CORRIDORS)
