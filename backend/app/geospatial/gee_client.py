"""
CYCLONEX Coastal Elevation Benchmark Client
Provides coastal digital elevation and terrain slope profiles for pre-landfall screening.
In this prototype deployment, uses verified local coastal elevation benchmark profiles.
Live Earth Engine raster query integration is deactivated in this environment.
"""

from typing import Dict, Any, List
import numpy as np
from app.core.config import settings
from app.core.logging import logger


# Coastal elevation scenario benchmark baselines for Bay of Bengal coastal transects
COASTAL_ELEVATION_BENCHMARK = {
    "Bapatla": {"mean_elevation_m": 4.5, "coastal_slope_m_per_km": 0.35, "low_lying_fraction": 0.42},
    "Prakasam": {"mean_elevation_m": 12.0, "coastal_slope_m_per_km": 0.75, "low_lying_fraction": 0.22},
    "Krishna": {"mean_elevation_m": 4.0, "coastal_slope_m_per_km": 0.30, "low_lying_fraction": 0.48},
    "Nellore": {"mean_elevation_m": 15.0, "coastal_slope_m_per_km": 0.90, "low_lying_fraction": 0.18},
    "Visakhapatnam": {"mean_elevation_m": 14.0, "coastal_slope_m_per_km": 1.40, "low_lying_fraction": 0.12},
}


class EarthEngineElevationClient:
    def __init__(self):
        self.is_gee_initialized = False
        self._init_gee()

    def _init_gee(self):
        """
        Earth Engine initialization is restricted to explicit GEE_PROJECT_ID configuration.
        Does not activate a live path from GOOGLE_CLOUD_PROJECT alone.
        """
        project_id = settings.GEE_PROJECT_ID
        if not project_id:
            logger.info("GEE_PROJECT_ID not configured; operating in local coastal benchmark mode.")
            self.is_gee_initialized = False
            return

        try:
            import ee
            ee.Initialize(project=project_id)
            self.is_gee_initialized = True
            logger.info(f"Google Earth Engine initialized on project '{project_id}'.")
        except Exception as e:
            logger.warning(f"GEE initialization skipped/failed ({e}); using benchmark mode.")
            self.is_gee_initialized = False

    def get_coastal_elevation_profile(self, district_name: str) -> Dict[str, Any]:
        """
        Returns coastal elevation metrics for the specified district.
        Always returns clearly attributed benchmark profile data in this deployment.
        Does not report mock data as live Earth Engine raster queries.
        """
        base = COASTAL_ELEVATION_BENCHMARK.get(
            district_name,
            {"mean_elevation_m": 8.0, "coastal_slope_m_per_km": 0.50, "low_lying_fraction": 0.30},
        )
        return {
            "source": "LOCAL_COASTAL_BENCHMARK",
            "district": district_name,
            "mean_elevation_m": base["mean_elevation_m"],
            "coastal_slope_m_per_km": base["coastal_slope_m_per_km"],
            "low_lying_fraction": base["low_lying_fraction"],
            "is_live_gee": False,
            "status": "BENCHMARK_SCENARIO_DATA",
        }


gee_client = EarthEngineElevationClient()
