"""
CYCLONEX AI Advisory API Endpoint
Integrates the deterministic ground truth matrix with Google Gemini (gemini-2.5-flash) or grounded fallback.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from starlette.concurrency import run_in_threadpool
from app.api.v1.endpoints.risk_analysis import evaluate_risk
from app.ai.vertex_gemini import advisory_engine
from app.engine.dispatch_generator import generate_early_warning_dispatches

router = APIRouter()


@router.post("/generate", summary="Generate Grounded Bilingual Cyclone Advisory")
async def generate_cyclone_advisory(
    cyclone_id: Optional[str] = Body(None, embed=True, description="Cyclone ID or active if None"),
    target_district: Optional[str] = Body(None, embed=True, description="Optional specific district to focus advisory"),
):
    """
    Executes the full anti-hallucination grounded pipeline:
      1. Evaluates deterministic spatial hazard metrics & infrastructure exposure.
      2. Injects verified JSON ground truth into Gemini (gemini-2.5-flash) or deterministic grounded fallback.
      3. Returns Authority tactical guidance, bilingual citizen alerts (English + Telugu),
         and automated CAP v1.2 multi-channel municipal dispatches.
    """
    # 1. Obtain verified deterministic ground truth
    ground_truth = await evaluate_risk(cyclone_id=cyclone_id)

    # 2. Synthesize grounded advisory
    try:
        # The Gemini call is blocking network I/O (up to the SDK timeout); run it off the event loop
        # so other dashboard requests are not frozen while the briefing is generated.
        advisory = await run_in_threadpool(
            advisory_engine.generate_advisory, ground_truth, target_district=target_district
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
