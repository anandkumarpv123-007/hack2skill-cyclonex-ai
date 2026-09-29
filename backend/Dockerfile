# ==============================================================================
# CYCLONEX Backend Production Dockerfile for Google Cloud Run
# Multi-stage container with GDAL, GEOS, and PROJ C-libraries for GeoPandas
# ==============================================================================

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

# Install required system C-libraries for geospatial computations (GDAL, GEOS, PROJ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application source code
COPY app/ app/
COPY tests/ tests/

# Expose target port for Google Cloud Run
EXPOSE 8000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Production server execution
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
