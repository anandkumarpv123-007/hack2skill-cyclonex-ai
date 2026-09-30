"""
CYCLONEX Rainfall Damage Pathways & Pluvial Drainage Engine
Models 24-hour localized convective precipitation accumulation,
evaluates inland drainage bottleneck pathways using GEE/SRTM elevation profiles,
and identifies arterial highway culvert washout vulnerabilities.
"""

from typing import Dict, Any, List
import math
from shapely.geometry import LineString, MultiPolygon, Polygon, mapping


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(dlam / 2.0) ** 2)
    return round(6371.0 * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)), 2)


# Verified arterial transit corridors along Andhra Pradesh coastal belt
COASTAL_ARTERIAL_CORRIDORS: List[Dict[str, Any]] = [
    {
        "id": "CORR_NH16_BAPATLA",
        "name": "NH-16 Coastal Transect (Chirala - Bapatla - Repalle)",
        "district": "Bapatla",
        "culverts_count": 14,
        "base_elevation_m": 4.2,
        "drainage_slope_m_per_km": 0.32,
        "coordinates": [[80.35, 15.68], [80.45, 15.75], [80.55, 15.82], [80.85, 15.95]],
    },
    {
        "id": "CORR_NH16_VIZAG",
        "name": "NH-16 Industrial Highway (Anakapalli - Gajuwaka - Vizag)",
        "district": "Visakhapatnam",
        "culverts_count": 22,
        "base_elevation_m": 8.5,
        "drainage_slope_m_per_km": 1.10,
        "coordinates": [[83.00, 17.68], [83.18, 17.70], [83.30, 17.72], [83.42, 17.78]],
    },
    {
        "id": "CORR_SH42_KRISHNA",
        "name": "State Highway 42 (Machilipatnam - Avanigadda Delta Corridor)",
        "district": "Krishna",
        "culverts_count": 18,
        "base_elevation_m": 3.5,
        "drainage_slope_m_per_km": 0.28,
        "coordinates": [[80.85, 16.02], [81.02, 16.10], [81.13, 16.18]],
    },
    {
        "id": "CORR_NH16_PRAKASAM",
        "name": "NH-16 Ongole Bypass (Singarayakonda - Ongole)",
        "district": "Prakasam",
        "culverts_count": 12,
        "base_elevation_m": 12.0,
        "drainage_slope_m_per_km": 0.70,
        "coordinates": [[80.02, 15.35], [80.05, 15.50], [80.12, 15.60]],
    },
]


def predict_rainfall_damage_pathways(
    landfall_lat: float,
    landfall_lon: float,
    peak_wind_kmh: float,
    districts: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Predicts 24-hour rainfall accumulation (in mm), pluvial drainage bottlenecks,
    and arterial road washout vulnerabilities based on landfall proximity and SRTM slope.
    """
    # Peak convective core rainfall scale
    base_core_rain_mm = 240.0 if peak_wind_kmh < 130.0 else 320.0

    district_rainfall_evaluations: List[Dict[str, Any]] = []

    for d in districts:
        dist_km = haversine_km(landfall_lat, landfall_lon, d.get("lat", 16.0), d.get("lon", 81.0))
        
        # Continuous exponential rainfall decay away from inner eye-wall rainbands
        decay_factor = math.exp(-dist_km / 160.0)
        accum_24h_mm = round(base_core_rain_mm * (0.35 + 0.65 * decay_factor), 1)

        slope = d.get("coastal_slope_m_per_km", 0.5)
        elevation = d.get("mean_elevation_m", 6.0)

        # Drainage Bottleneck Index (DVI)
        # Higher rainfall + flat coastal plain (low slope) + low elevation = high waterlogging & culvert choke
        slope_penalty = max(0.1, 1.0 - min(1.0, slope / 1.5))
        elevation_penalty = max(0.1, 1.0 - min(1.0, elevation / 25.0))
        dvi = round((accum_24h_mm / 350.0) * (0.5 * slope_penalty + 0.5 * elevation_penalty), 3)
        dvi = min(1.0, max(0.05, dvi))

        if dvi >= 0.65:
            flood_status = "CRITICAL_PLUVIAL_FLOOD_RISK"
        elif dvi >= 0.40:
            flood_status = "MODERATE_WATERLOGGING"
        else:
            flood_status = "ADEQUATE_RUNOFF_DISCHARGE"

        district_rainfall_evaluations.append({
            "district": d["name"],
            "distance_to_core_km": dist_km,
            "predicted_24h_rainfall_mm": accum_24h_mm,
            "drainage_vulnerability_index": dvi,
            "pluvial_status": flood_status,
            "mean_elevation_m": elevation,
            "coastal_slope_m_per_km": slope,
        })

    # Sort descending by drainage vulnerability index
    district_rainfall_evaluations.sort(key=lambda x: x["drainage_vulnerability_index"], reverse=True)

    # Evaluate Arterial Road & Culvert Washout Exposure
    corridor_evaluations: List[Dict[str, Any]] = []
    features_geojson: List[Dict[str, Any]] = []

    for c in COASTAL_ARTERIAL_CORRIDORS:
        c_coords = c["coordinates"]
        mid_lon, mid_lat = c_coords[len(c_coords) // 2]
        dist_to_landfall = haversine_km(landfall_lat, landfall_lon, mid_lat, mid_lon)

        # Match district evaluation
        dist_eval = next(
            (e for e in district_rainfall_evaluations if e["district"].lower() == c["district"].lower()),
            None
        )
        rainfall_mm = dist_eval["predicted_24h_rainfall_mm"] if dist_eval else 150.0
        dvi = dist_eval["drainage_vulnerability_index"] if dist_eval else 0.4

        # Washout risk score
        is_washout_risk = rainfall_mm >= 180.0 and c["drainage_slope_m_per_km"] < 0.65

        corridor_evaluations.append({
            "corridor_id": c["id"],
            "corridor_name": c["name"],
            "district": c["district"],
            "distance_km": dist_to_landfall,
            "culverts_count": c["culverts_count"],
            "local_rainfall_mm": rainfall_mm,
            "washout_risk": is_washout_risk,
            "severity": "HIGH_WASHOUT_RISK" if is_washout_risk else "MONITORED_DRAINAGE",
            "recommended_action": (
                "Deploy emergency portable de-watering pumps and close low-pass underpasses."
                if is_washout_risk else "Maintain active drainage channel clearing."
            ),
        })

        # Build GeoJSON feature for map rendering
        line_geom = LineString(c_coords)
        features_geojson.append({
            "type": "Feature",
            "properties": {
                "id": c["id"],
                "name": c["name"],
                "district": c["district"],
                "rainfall_mm": rainfall_mm,
                "washout_risk": is_washout_risk,
                "severity": "high" if is_washout_risk else "moderate",
            },
            "geometry": mapping(line_geom),
        })

    drainage_corridors_geojson = {
        "type": "FeatureCollection",
        "features": features_geojson,
    }

    return {
        "summary": {
            "max_24h_rainfall_mm": district_rainfall_evaluations[0]["predicted_24h_rainfall_mm"],
            "highest_vulnerability_district": district_rainfall_evaluations[0]["district"],
            "vulnerable_corridors_count": len([c for c in corridor_evaluations if c["washout_risk"]]),
        },
        "district_evaluations": district_rainfall_evaluations,
        "arterial_corridors": corridor_evaluations,
        "drainage_corridors_geojson": drainage_corridors_geojson,
    }
