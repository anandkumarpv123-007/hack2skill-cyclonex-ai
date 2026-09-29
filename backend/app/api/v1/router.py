from fastapi import APIRouter
from app.api.v1.endpoints import health, cyclone, infrastructure, risk_analysis, advisory

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(cyclone.router, prefix="/cyclone", tags=["Cyclone Tracks"])
api_router.include_router(infrastructure.router, prefix="/infrastructure", tags=["Critical Infrastructure"])
api_router.include_router(risk_analysis.router, prefix="/risk", tags=["Risk Analysis"])
api_router.include_router(advisory.router, prefix="/advisory", tags=["AI Advisory"])
