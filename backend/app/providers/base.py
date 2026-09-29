"""
CYCLONEX Abstract Data Provider Interfaces & Pydantic Schemas
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class Waypoint(BaseModel):
    time: str = Field(..., description="ISO 8601 timestamp or relative forecast hour")
    lat: float = Field(..., description="Latitude in decimal degrees")
    lon: float = Field(..., description="Longitude in decimal degrees")
    max_wind_kmh: float = Field(..., description="Maximum sustained wind speed in km/h")
    central_pressure_hpa: float = Field(..., description="Estimated central barometric pressure in hPa")
    r34_km: float = Field(..., description="Radius of 34-knot gale force winds in km")
    r50_km: float = Field(..., description="Radius of 50-knot storm force winds in km")
    r64_km: float = Field(..., description="Radius of 64-knot hurricane force winds in km")
    stage: str = Field(default="Cyclone", description="IMD classification stage")


class CycloneTrack(BaseModel):
    id: str = Field(..., description="Unique scenario or storm identifier")
    name: str = Field(..., description="Cyclone name (e.g. Cyclone Michaung)")
    year: int = Field(..., description="Year of storm event")
    category: str = Field(..., description="IMD Category (e.g. Severe Cyclonic Storm)")
    is_simulated: bool = Field(..., description="True if historical benchmark or offline simulated data")
    data_source: str = Field(..., description="Source citation (e.g. IMD Archive, Open-Meteo)")
    landfall_target: str = Field(..., description="Projected or historical landfall location")
    landfall_lat: float = Field(..., description="Landfall latitude")
    landfall_lon: float = Field(..., description="Landfall longitude")
    peak_wind_kmh: float = Field(..., description="Peak sustained wind speed in km/h")
    min_pressure_hpa: float = Field(..., description="Minimum central pressure in hPa")
    waypoints: List[Waypoint] = Field(..., description="Chronological track waypoints")


class InfrastructureAsset(BaseModel):
    id: str
    name: str
    type: str  # hospital, shelter, substation, road
    district: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    geometry: Dict[str, Any]


class AbstractWeatherProvider(ABC):
    @abstractmethod
    async def get_active_cyclone(self) -> CycloneTrack:
        """Retrieves active real-time cyclone or falls back to default benchmark."""
        pass

    @abstractmethod
    async def get_benchmark_cyclone(self, benchmark_id: str) -> Optional[CycloneTrack]:
        """Retrieves a specific verified historical benchmark."""
        pass

    @abstractmethod
    async def list_available_benchmarks(self) -> List[Dict[str, Any]]:
        """Lists metadata of available historical benchmark scenarios."""
        pass


class AbstractInfrastructureProvider(ABC):
    @abstractmethod
    async def get_infrastructure_assets(
        self,
        asset_type: Optional[str] = None,
        district: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves infrastructure records with vector geometries."""
        pass
