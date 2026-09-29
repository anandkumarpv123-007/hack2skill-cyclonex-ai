import sys
import fastapi
import geopandas
import numpy
import pandas
import shapely
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse, DeterministicStackInfo

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
        milestone="Milestone 1: Project Scaffolding & Monorepo Foundation",
        deterministic_stack=stack_info,
    )
