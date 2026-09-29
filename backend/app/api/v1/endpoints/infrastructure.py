"""
CYCLONEX Critical Infrastructure API Endpoints
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query
from app.geospatial.osm_loader import osm_provider
from app.engine.shelter_allocator import find_nearest_safe_shelters

router = APIRouter()


@router.get("/assets", summary="Get Critical Infrastructure GeoJSON")
async def get_infrastructure_assets(
    asset_type: Optional[str] = Query(None, description="Filter by type: hospital, shelter, substation, road"),
    district: Optional[str] = Query(None, description="Filter by district name"),
):
    """Returns critical infrastructure assets formatted as a GeoJSON FeatureCollection."""
    records = await osm_provider.get_infrastructure_assets(asset_type=asset_type, district=district)
    
    features = [
        {
            "type": "Feature",
            "id": r["id"],
            "geometry": r["geometry"],
            "properties": {
                "id": r["id"],
                "name": r["name"],
                "type": r["type"],
                "district": r["district"],
                **(r.get("properties") or {}),
            },
        }
        for r in records
    ]

    return {
        "type": "FeatureCollection",
        "total_features": len(features),
        "features": features,
    }


@router.get("/shelters/nearby", summary="Find Nearest Safe Cyclone Shelters")
async def get_nearby_shelters(
    lat: float = Query(..., description="Citizen latitude"),
    lon: float = Query(..., description="Citizen longitude"),
    limit: int = Query(3, ge=1, le=10, description="Max shelters to return"),
):
    """
    Computes distance to registered shelters and returns prioritized safe shelters
    with bilingual guidance and compass headings.
    """
    all_shelters = await osm_provider.get_infrastructure_assets(asset_type="shelter")
    
    # Simple list format with lat/lon extracted
    shelter_list = [
        {
            "id": s["id"],
            "name": s["name"],
            "district": s["district"],
            "lat": s["lat"],
            "lon": s["lon"],
            "capacity": s.get("properties", {}).get("capacity", 500),
            "current_occupancy": s.get("properties", {}).get("current_occupancy", 0),
        }
        for s in all_shelters
        if s.get("lat") and s.get("lon")
    ]

    safe_shelters = find_nearest_safe_shelters(
        citizen_lat=lat,
        citizen_lon=lon,
        shelters=shelter_list,
        limit=limit,
    )

    return {
        "citizen_coordinates": {"lat": lat, "lon": lon},
        "total_candidates_evaluated": len(shelter_list),
        "nearest_shelters": safe_shelters,
    }
