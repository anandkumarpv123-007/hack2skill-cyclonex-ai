"""
CYCLONEX AI Advisory API Endpoint
Integrates the deterministic ground truth matrix with Google Gemini (model set by GEMINI_MODEL) or grounded fallback.
"""

from typing import Optional
import time
from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool
from app.api.v1.endpoints.risk_analysis import evaluate_risk
from app.ai.vertex_gemini import advisory_engine
from app.engine.dispatch_generator import generate_early_warning_dispatches
from app.engine.hazard_map import render_hazard_map_png
from app.core.config import settings
from app.core.logging import logger

router = APIRouter()

# Rendered hazard maps are deterministic per scenario; cache them for an hour.
_MAP_CACHE: dict = {}
_MAP_CACHE_TTL_S = 3600


async def _hazard_map_for(cyclone_id: Optional[str], ground_truth: dict) -> Optional[bytes]:
    key = cyclone_id or "__active__"
    hit = _MAP_CACHE.get(key)
    if hit and time.time() - hit[0] < _MAP_CACHE_TTL_S:
        return hit[1]
    try:
        png = await run_in_threadpool(render_hazard_map_png, ground_truth)
    except Exception as e:  # never let map rendering break the advisory
        logger.warning(f"Hazard map rendering failed ({type(e).__name__}); continuing text-only.")
        png = None
    if png:
        _MAP_CACHE[key] = (time.time(), png)
    return png


@router.post("/generate", summary="Generate Grounded Bilingual Cyclone Advisory")
async def generate_cyclone_advisory(
    cyclone_id: Optional[str] = Body(None, embed=True, description="Cyclone ID or active if None"),
    target_district: Optional[str] = Body(None, embed=True, description="Optional specific district to focus advisory"),
):
    """
    Executes the full anti-hallucination grounded pipeline:
      1. Evaluates deterministic spatial hazard metrics & infrastructure exposure.
      2. Injects verified JSON ground truth into Gemini (GEMINI_MODEL) or deterministic grounded fallback.
      3. Returns Authority tactical guidance, bilingual citizen alerts (English + Telugu),
         and automated CAP v1.2 multi-channel municipal dispatches.
    """
    # 1. Obtain verified deterministic ground truth
    ground_truth = await evaluate_risk(cyclone_id=cyclone_id)

    # 2. Synthesize grounded advisory
    try:
        # The Gemini call is blocking network I/O (up to the SDK timeout); run it off the event loop
        # so other dashboard requests are not frozen while the briefing is generated.
        hazard_map_png = await _hazard_map_for(cyclone_id, ground_truth) if settings.GEMINI_MULTIMODAL else None
        advisory = await run_in_threadpool(
            advisory_engine.generate_advisory,
            ground_truth,
            target_district=target_district,
            hazard_map_png=hazard_map_png,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 3. Formulate automated early-warning CAP and multi-channel dispatches
    selected_cvi = None
    if target_district and ground_truth.get("cvi_rankings"):
        for d in ground_truth["cvi_rankings"]:
            if (d.get("district") or "").lower() == target_district.lower():
                selected_cvi = d
                break
    if not selected_cvi and ground_truth.get("cvi_rankings"):
        selected_cvi = ground_truth["cvi_rankings"][0]
    if not selected_cvi:
        selected_cvi = {"district": "Coastal AP", "cvi_score": 0.70, "risk_level": "Extreme"}

    dispatches = generate_early_warning_dispatches(
        ground_truth["cyclone_metadata"],
        selected_cvi,
        advisory,
        ground_truth["surge_scenario"],
    )

    return {
        "status": "success",
        "advisory": advisory,
        "dispatches": dispatches,
        "ground_truth_context": {
            "cyclone_metadata": ground_truth["cyclone_metadata"],
            "exposure_summary": ground_truth["exposure_summary"],
            "cvi_top_district": selected_cvi,
            "parametric_insurance": ground_truth.get("parametric_insurance"),
        },
    }


@router.get(
    "/hazard-map.png",
    summary="Scenario hazard map image (the exact image sent to Gemini)",
    response_class=Response,
)
async def get_hazard_map(cyclone_id: Optional[str] = Query(None, description="Cyclone ID or active if omitted")):
    ground_truth = await evaluate_risk(cyclone_id=cyclone_id)
    png = await _hazard_map_for(cyclone_id, ground_truth)
    if not png:
        raise HTTPException(status_code=503, detail="Hazard map rendering unavailable")
    return Response(content=png, media_type="image/png", headers={"Cache-Control": "public, max-age=600"})
