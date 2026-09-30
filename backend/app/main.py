from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan handler for startup and shutdown events."""
    logger.info(
        f"Starting {settings.PROJECT_NAME} v{settings.VERSION} "
        f"[env={settings.ENVIRONMENT}, mode={settings.DATA_SOURCE_MODE}]"
    )
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration for frontend and local network integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Metadata")
def root_metadata():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "milestone": "Milestone 1: Project Scaffolding & Monorepo Foundation",
        "documentation": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "architecture": "Deterministic Geospatial Engine + Grounded Multimodal Advisory",
    }
