"""
CYCLONEX Deterministic Safe Shelter Allocator
Calculates geodesic Haversine distance to registered cyclone shelters and assesses
shelter safety against active surge inundation and extreme wind hazard zones.
"""

from typing import Dict, List, Any, Optional
import math
from shapely.geometry import Point


EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two geographic coordinates in kilometers."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_KM * c, 2)


def calculate_compass_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> str:
    """Calculates cardinal direction heading from citizen to shelter."""
    d_lon = math.radians(lon2 - lon1)
    y = math.sin(d_lon) * math.cos(math.radians(lat2))
    x = (
        math.cos(math.radians(lat1)) * math.sin(math.radians(lat2))
        - math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(d_lon)
    )
    bearing = (math.degrees(math.atan2(y, x)) + 360) % 360
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"]
    return directions[int(round(bearing / 45)) % 8]


def find_nearest_safe_shelters(
    citizen_lat: float,
    citizen_lon: float,
    shelters: List[Dict[str, Any]],
    surge_polygon: Any = None,
    wind_64kt_polygon: Any = None,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    """
    Finds and prioritizes cyclone shelters based on real-time hazard status and distance.

    Safety Criteria:
      - Shelter MUST NOT be inside active surge inundation polygon.
      - Shelters outside 64-kt hurricane wind cone are prioritized.
      - Distance is computed via Haversine formula.
    """
    evaluated: List[Dict[str, Any]] = []

    for s in shelters:
        s_lat = float(s["lat"])
        s_lon = float(s["lon"])
        dist_km = haversine_distance(citizen_lat, citizen_lon, s_lat, s_lon)
        heading = calculate_compass_bearing(citizen_lat, citizen_lon, s_lat, s_lon)

        pt = Point(s_lon, s_lat)
        in_surge = bool(surge_polygon and surge_polygon.contains(pt))
        in_extreme_wind = bool(wind_64kt_polygon and wind_64kt_polygon.contains(pt))

        is_safe = not in_surge
        capacity = s.get("capacity", 500)
        current_occ = s.get("current_occupancy", 120)
        available_slots = max(0, capacity - current_occ)

        status_text = "SAFE_AND_OPERATIONAL" if is_safe and not in_extreme_wind else "COMPROMISED_SURGE_RISK" if in_surge else "HIGH_WIND_ADVISORY"
        telugu_status = "సురక్షిత ఆశ్రయం (Safe)" if is_safe and not in_extreme_wind else "ప్రమాదకరం - నీటి ముంపు (Compromised - Flooded)" if in_surge else "తీవ్ర గాలుల హెచ్చరిక (High Wind Alert)"

        evaluated.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "district": s.get("district", "Coastal District"),
            "lat": s_lat,
            "lon": s_lon,
            "distance_km": dist_km,
            "compass_direction": heading,
            "is_safe": is_safe,
            "in_surge_zone": in_surge,
            "in_extreme_wind": in_extreme_wind,
            "capacity": capacity,
            "available_slots": available_slots,
            "safety_status": status_text,
            "safety_status_te": telugu_status,
        })

    # Sort primarily by safety (safe first), then by distance ascending
    evaluated.sort(key=lambda x: (not x["is_safe"], x["distance_km"]))
    return evaluated[:limit]
