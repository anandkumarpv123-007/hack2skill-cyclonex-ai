"""
CYCLONEX Deterministic Wind Swath Buffer Generator
Uses Shapely to compute continuous, directionally interpolated polygon hazard envelopes
for 34-knot (gale), 50-knot (storm), and 64-knot (hurricane) nautical wind thresholds.
"""

from typing import Dict, List, Any
import numpy as np
from shapely.geometry import Point, Polygon, MultiPolygon, LineString, mapping
from shapely.ops import unary_union


# KM per degree approximations for WGS84 coordinates
KM_PER_DEG_LAT = 111.0


def _km_to_deg(km: float, lat_deg: float) -> tuple[float, float]:
    """Converts a radial distance in kilometers to equivalent degrees in latitude and longitude."""
    deg_lat = km / KM_PER_DEG_LAT
    cos_lat = np.cos(np.radians(lat_deg))
    deg_lon = km / (KM_PER_DEG_LAT * max(cos_lat, 0.1))
    return deg_lat, deg_lon


def _create_elliptical_buffer(lon: float, lat: float, radius_km: float, num_pts: int = 32) -> Polygon:
    """Creates a metric-adjusted radial buffer polygon around a geographic point."""
    if radius_km <= 0:
        return Polygon()
    deg_lat, deg_lon = _km_to_deg(radius_km, lat)
    angles = np.linspace(0, 2 * np.pi, num_pts, endpoint=False)
    x = lon + deg_lon * np.cos(angles)
    y = lat + deg_lat * np.sin(angles)
    return Polygon(np.column_stack((x, y)))


THRESHOLD_34KT_KMH = 63.0   # 34-kt Gale (~63 km/h)
THRESHOLD_50KT_KMH = 92.6   # 50-kt Storm (~93 km/h)
THRESHOLD_64KT_KMH = 118.5  # 64-kt Hurricane (~119 km/h)


def generate_wind_swaths(waypoints: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes continuous 34-kt, 50-kt, and 64-kt wind hazard swaths from waypoint data.

    Each waypoint dict should contain:
      - 'lat': float (degrees)
      - 'lon': float (degrees)
      - 'max_wind_kmh': float (maximum sustained wind speed in km/h)
      - 'r34_km': float (radius of 34-kt / 63 km/h winds in km, default derived if absent)
      - 'r50_km': float (radius of 50-kt / 93 km/h winds in km, default derived if absent)
      - 'r64_km': float (radius of 64-kt / 119 km/h winds in km, default derived if absent)
    """
    if not waypoints:
        return {"swath_34kt": None, "swath_50kt": None, "swath_64kt": None}

    polygons_34: List[Polygon] = []
    polygons_50: List[Polygon] = []
    polygons_64: List[Polygon] = []

    # Process waypoints and swept volume hulls between successive points
    for i, wp in enumerate(waypoints):
        lat = float(wp["lat"])
        lon = float(wp["lon"])
        wind_kmh = float(wp.get("max_wind_kmh", 80.0))

        # Strict physical thresholds: Radii only exist if storm reaches threshold
        if wind_kmh < THRESHOLD_34KT_KMH:
            r34 = 0.0
        else:
            r34 = float(wp.get("r34_km") if wp.get("r34_km") is not None else ((wind_kmh / 120.0) * 180.0))

        if wind_kmh < THRESHOLD_50KT_KMH:
            r50 = 0.0
        else:
            r50 = float(wp.get("r50_km") if wp.get("r50_km") is not None else ((wind_kmh / 120.0) * 110.0))

        if wind_kmh < THRESHOLD_64KT_KMH:
            r64 = 0.0
        else:
            r64 = float(wp.get("r64_km") if wp.get("r64_km") is not None else ((wind_kmh / 120.0) * 60.0))

        buf34 = _create_elliptical_buffer(lon, lat, r34)
        buf50 = _create_elliptical_buffer(lon, lat, r50)
        buf64 = _create_elliptical_buffer(lon, lat, r64)

        if not buf34.is_empty:
            polygons_34.append(buf34)
        if not buf50.is_empty:
            polygons_50.append(buf50)
        if not buf64.is_empty:
            polygons_64.append(buf64)

        # Swept-volume convex hull between waypoint i and i-1 to ensure continuous track swath
        if i > 0:
            prev_wp = waypoints[i - 1]
            prev_lat = float(prev_wp["lat"])
            prev_lon = float(prev_wp["lon"])
            prev_wind = float(prev_wp.get("max_wind_kmh", 80.0))

            if prev_wind < THRESHOLD_34KT_KMH:
                prev_r34 = 0.0
            else:
                prev_r34 = float(prev_wp.get("r34_km") if prev_wp.get("r34_km") is not None else ((prev_wind / 120.0) * 180.0))

            if prev_wind < THRESHOLD_50KT_KMH:
                prev_r50 = 0.0
            else:
                prev_r50 = float(prev_wp.get("r50_km") if prev_wp.get("r50_km") is not None else ((prev_wind / 120.0) * 110.0))

            if prev_wind < THRESHOLD_64KT_KMH:
                prev_r64 = 0.0
            else:
                prev_r64 = float(prev_wp.get("r64_km") if prev_wp.get("r64_km") is not None else ((prev_wind / 120.0) * 60.0))

            prev_buf34 = _create_elliptical_buffer(prev_lon, prev_lat, prev_r34)
            prev_buf50 = _create_elliptical_buffer(prev_lon, prev_lat, prev_r50)
            prev_buf64 = _create_elliptical_buffer(prev_lon, prev_lat, prev_r64)

            if not buf34.is_empty and not prev_buf34.is_empty:
                polygons_34.append(unary_union([buf34, prev_buf34]).convex_hull)
            if not buf50.is_empty and not prev_buf50.is_empty:
                polygons_50.append(unary_union([buf50, prev_buf50]).convex_hull)
            if not buf64.is_empty and not prev_buf64.is_empty:
                polygons_64.append(unary_union([buf64, prev_buf64]).convex_hull)

    union_34 = unary_union(polygons_34) if polygons_34 else Polygon()
    union_50 = unary_union(polygons_50) if polygons_50 else Polygon()
    union_64 = unary_union(polygons_64) if polygons_64 else Polygon()

    # Track center line
    coords = [(float(wp["lon"]), float(wp["lat"])) for wp in waypoints]
    track_line = LineString(coords) if len(coords) >= 2 else None

    return {
        "track_geometry": mapping(track_line) if track_line else None,
        "swath_34kt": {
            "name": "34-kt Gale Force Swath (~63 km/h)",
            "geometry": mapping(union_34) if not union_34.is_empty else None,
            "shapely": union_34,
            "area_sq_deg": union_34.area,
        },
        "swath_50kt": {
            "name": "50-kt Storm Force Swath (~93 km/h)",
            "geometry": mapping(union_50) if not union_50.is_empty else None,
            "shapely": union_50,
            "area_sq_deg": union_50.area,
        },
        "swath_64kt": {
            "name": "64-kt Hurricane Force Swath (~119 km/h)",
            "geometry": mapping(union_64) if not union_64.is_empty else None,
            "shapely": union_64,
            "area_sq_deg": union_64.area,
        },
    }
