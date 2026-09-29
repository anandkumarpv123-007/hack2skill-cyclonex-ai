from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel, Field


class DeterministicStackInfo(BaseModel):
    python: str
    fastapi: str
    geopandas: str
    numpy: str
    pandas: str
    shapely: str


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Current backend operational health")
    service: str = Field(default="cyclonex-backend", description="Microservice identifier")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Runtime environment")
    data_source_mode: str = Field(..., description="Configured data mode ('simulated' vs 'live')")
    milestone: str = Field(..., description="Current implementation milestone")
    deterministic_stack: DeterministicStackInfo = Field(..., description="Verified versions of deterministic scientific libraries")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of the health check")
