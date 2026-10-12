import sys
import fastapi
import geopandas
import numpy
import pandas
import shapely
from fastapi import APIRouter
from app.core.config import settings
import os
from app.schemas.health import HealthResponse, DeterministicStackInfo, AIRuntimeInfo
from app.ai.vertex_gemini import advisory_engine

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="System Health & Deterministic Stack Verification")
def get_health() -> HealthResponse:
    """
    Returns system status, current milestone stage, and verified versions
    of the underlying deterministic scientific and geospatial libraries.
    """
    stack_info = DeterministicStackInfo(
        python=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        fastapi=fastapi.__version__,
        geopandas=geopandas.__version__,
        numpy=numpy.__version__,
        pandas=pandas.__version__,
        shapely=shapely.__version__,
    )

    return HealthResponse(
        status="healthy",
        service="cyclonex-backend",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        data_source_mode=settings.DATA_SOURCE_MODE,
        milestone="Milestone 6: Pre-Landfall Anticipatory Action Prototype (Simulated Data Mode)",
        deterministic_stack=stack_info,
        ai_runtime=AIRuntimeInfo(
            gemini_api_key_configured=bool(settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")),
            gemini_model=advisory_engine.model_name,
            last_gemini_fallback_reason=advisory_engine.last_fallback_reason,
            last_gemini_fallback_detail=advisory_engine.last_fallback_detail,
            earth_engine_live=False,
        ),
    )
