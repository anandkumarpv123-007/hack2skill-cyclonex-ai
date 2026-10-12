from datetime import datetime, timezone
from typing import Dict, Optional
from pydantic import BaseModel, Field


class DeterministicStackInfo(BaseModel):
    python: str
    fastapi: str
    geopandas: str
    numpy: str
    pandas: str
    shapely: str


class AIRuntimeInfo(BaseModel):
    gemini_api_key_configured: bool = Field(..., description="True if GEMINI_API_KEY is present (value never exposed)")
    gemini_model: str = Field(..., description="Configured Gemini model ID")
    last_gemini_fallback_reason: Optional[str] = Field(None, description="Reason of the most recent failed Gemini call, if any")
    last_gemini_fallback_detail: Optional[str] = Field(None, description="Exception class / HTTP status of the most recent failure (no secrets)")
    earth_engine_live: bool = Field(False, description="Live Earth Engine raster queries are not active in this deployment")


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Current backend operational health")
    service: str = Field(default="cyclonex-backend", description="Microservice identifier")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Runtime environment")
    data_source_mode: str = Field(..., description="Configured data mode ('simulated' vs 'live')")
    milestone: str = Field(..., description="Current implementation milestone")
    deterministic_stack: DeterministicStackInfo = Field(..., description="Verified versions of deterministic scientific libraries")
    ai_runtime: Optional[AIRuntimeInfo] = Field(None, description="Gemini / Earth Engine runtime configuration status")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of the health check")
