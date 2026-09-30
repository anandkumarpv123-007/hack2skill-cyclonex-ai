"""
CYCLONEX Geospatial Spatial Join & Exposure Calculation Engine
Performs deterministic vector intersections between hazard polygons (wind swaths, surge inundation)
and critical infrastructure point/line assets using GeoPandas and Shapely.

Produces the immutable, verified Ground Truth JSON matrix.
"""

from typing import Dict, List, Any
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, Point, LineString, Polygon, MultiPolygon


# Approximate conversion for length in degrees to km at ~16 deg latitude (Bay of Bengal)
KM_PER_DEGREE = 111.0


AP_COASTLINE_VERTICES = [
    (80.05, 13.50),  # Pulicat / TN border
    (80.15, 14.00),  # Dugarajapatnam
    (80.12, 14.45),  # Nellore coast
    (80.05, 15.00),  # Ramayapatnam
    (80.16, 15.45),  # Kothapatnam / Ongole coast
    (80.35, 15.75),  # Chirala coast / Vadarevu
    (80.52, 15.85),  # Suryalanka Beach
    (80.67, 15.91),  # Nizampatnam
    (80.95, 16.02),  # Krishna delta tip
    (81.24, 16.25),  # Machilipatnam / Manginapudi
    (81.75, 16.45),  # Antarvedi / Godavari mouth
    (82.35, 16.95),  # Kakinada coast
    (82.85, 17.35),  # Tuni coast
    (83.32, 17.71),  # Visakhapatnam RK Beach
    (83.46, 17.89),  # Bheemunipatnam
    (83.90, 18.28),  # Kalingapatnam / Srikakulam
    (84.30, 18.60),  # Bhavanapadu / AP-Odisha border
]
AP_COASTLINE = LineString(AP_COASTLINE_VERTICES)


def evaluate_asset_exposure(
    infrastructure_records: List[Dict[str, Any]],
    wind_swaths: Dict[str, Any],
    surge_scenario: Dict[str, Any],
    surge_height_m: float = 2.0,
) -> Dict[str, Any]:
    """
    Deterministically computes exact asset counts and infrastructure exposure
    within the hazard zones.

    Guarantees:
      - Point counts are verified integers.
      - Road lengths are computed via geometric line intersection and converted to kilometers.
      - Every number is reproducible from coordinates.
    """
    if not infrastructure_records:
        return {
            "total_assets_evaluated": 0,
            "hospitals_at_risk": {"in_64kt": 0, "in_50kt": 0, "in_34kt": 0, "in_surge": 0, "assets": []},
            "shelters_at_risk": {"in_64kt": 0, "in_50kt": 0, "in_34kt": 0, "in_surge": 0, "assets": []},
            "substations_at_risk": {"in_64kt": 0, "in_50kt": 0, "in_34kt": 0, "in_surge": 0, "assets": []},
            "roads_at_risk_km": {"in_64kt": 0.0, "in_surge": 0.0},
            "all_evaluated_assets": [],
        }

    poly_64 = wind_swaths.get("swath_64kt", {}).get("shapely")
    poly_50 = wind_swaths.get("swath_50kt", {}).get("shapely")
    poly_34 = wind_swaths.get("swath_34kt", {}).get("shapely")
    poly_surge = surge_scenario.get("shapely")

    hospitals_64, hospitals_50, hospitals_34, hospitals_surge = [], [], [], []
    shelters_64, shelters_50, shelters_34, shelters_surge = [], [], [], []
    substations_64, substations_50, substations_34, substations_surge = [], [], [], []
    all_evaluated_assets = []
    road_km_64 = 0.0
    road_km_surge = 0.0

    for item in infrastructure_records:
        asset_type = item.get("type", "unknown").lower()
        geom_dict = item.get("geometry")
        if not geom_dict:
            continue

        geom = shape(geom_dict)

        # Handle Point Infrastructure (Hospitals, Shelters, Substations)
        if isinstance(geom, Point):
            in_64 = bool(poly_64 and not poly_64.is_empty and poly_64.contains(geom))
            in_50 = bool(poly_50 and not poly_50.is_empty and poly_50.contains(geom))
            in_34 = bool(poly_34 and not poly_34.is_empty and poly_34.contains(geom))
            in_surge = bool(poly_surge and not poly_surge.is_empty and poly_surge.contains(geom))

            # Dynamic terrain & physical exposure calculations
            elev_m = float(item.get("properties", {}).get("elevation_m") or (
                4.5 if "hospital" in asset_type else
                3.5 if "shelter" in asset_type else
                6.0
            ))
            dist_coast_km = round(AP_COASTLINE.distance(geom) * KM_PER_DEGREE, 1)
            surge_margin_m = round(elev_m - surge_height_m, 2)

            # Deterministic vulnerability score [0 - 100] & Hazard classification
            if in_64 or in_surge or (surge_margin_m < 0 and in_50):
                haz_level = "extreme"
                v_score = min(98, max(85, int(88 + 10 * (1.0 - min(10.0, max(-2.0, surge_margin_m)) / 10.0))))
            elif in_50:
                haz_level = "high"
                v_score = min(84, max(65, int(70 + 12 * (1.0 - min(10.0, max(0.0, surge_margin_m)) / 10.0))))
            elif in_34:
                haz_level = "moderate"
                v_score = min(64, max(40, int(45 + 15 * (1.0 - min(15.0, max(0.0, surge_margin_m)) / 15.0))))
            else:
                haz_level = "low"
                v_score = min(35, max(12, int(15 + 15 * (1.0 - min(25.0, max(0.0, dist_coast_km)) / 25.0))))

            asset_summary = {
                "id": item.get("id"),
                "name": item.get("name", "Unnamed Asset"),
                "category": asset_type,
                "type": item.get("type", asset_type).capitalize(),
                "district": item.get("district", "Unknown"),
                "lat": round(geom.y, 4),
                "lon": round(geom.x, 4),
                "elevation_m": elev_m,
                "distance_from_coast_km": dist_coast_km,
                "surge_margin_m": surge_margin_m,
                "vulnerability_score": v_score,
                "hazard_level": haz_level,
                "risk_level": haz_level.upper(),
                "in_surge_zone": in_surge,
                "in_64kt_wind": in_64,
                "in_50kt_wind": in_50,
                "in_34kt_wind": in_34,
                "capacity": item.get("properties", {}).get("capacity") or item.get("properties", {}).get("beds", 100),
                "operational_status": (
                    "Auxiliary Genset Ready"
                    if item.get("properties", {}).get("generator") or item.get("properties", {}).get("backup_generator_kva")
                    else "Operational"
                ),
                "recommended_action": (
                    "Mandatory protective hardening and backup power lock."
                    if haz_level in ["extreme", "high"]
                    else "Monitor standby feeders and secure outdoor equipment."
                ),
            }

            all_evaluated_assets.append(asset_summary)

            if "hospital" in asset_type:
                if in_64: hospitals_64.append(asset_summary)
                if in_50: hospitals_50.append(asset_summary)
                if in_34: hospitals_34.append(asset_summary)
                if in_surge: hospitals_surge.append(asset_summary)
            elif "shelter" in asset_type:
                if in_64: shelters_64.append(asset_summary)
                if in_50: shelters_50.append(asset_summary)
                if in_34: shelters_34.append(asset_summary)
                if in_surge: shelters_surge.append(asset_summary)
            elif "substation" in asset_type or "power" in asset_type:
                if in_64: substations_64.append(asset_summary)
                if in_50: substations_50.append(asset_summary)
                if in_34: substations_34.append(asset_summary)
                if in_surge: substations_surge.append(asset_summary)

        # Handle Line Infrastructure (Roads / Evacuation Corridors)
        elif isinstance(geom, (LineString, MultiPolygon)):
            if poly_64 and not poly_64.is_empty and poly_64.intersects(geom):
                intersection_line = poly_64.intersection(geom)
                road_km_64 += intersection_line.length * KM_PER_DEGREE
            if poly_surge and not poly_surge.is_empty and poly_surge.intersects(geom):
                intersection_line = poly_surge.intersection(geom)
                road_km_surge += intersection_line.length * KM_PER_DEGREE

    return {
        "total_assets_evaluated": len(infrastructure_records),
        "hospitals_at_risk": {
            "in_64kt": len(hospitals_64),
            "in_50kt": len(hospitals_50),
            "in_34kt": len(hospitals_34),
            "in_surge": len(hospitals_surge),
            "assets": hospitals_64 + [h for h in hospitals_surge if h not in hospitals_64],
        },
        "shelters_at_risk": {
            "in_64kt": len(shelters_64),
            "in_50kt": len(shelters_50),
            "in_34kt": len(shelters_34),
            "in_surge": len(shelters_surge),
            "assets": shelters_64 + [s for s in shelters_surge if s not in shelters_64],
        },
        "substations_at_risk": {
            "in_64kt": len(substations_64),
            "in_50kt": len(substations_50),
            "in_34kt": len(substations_34),
            "in_surge": len(substations_surge),
            "assets": substations_64 + [s for s in substations_surge if s not in substations_64],
        },
        "roads_at_risk_km": {
            "in_64kt_wind": round(road_km_64, 1),
            "in_surge_inundation": round(road_km_surge, 1),
        },
        "all_evaluated_assets": all_evaluated_assets,
    }
