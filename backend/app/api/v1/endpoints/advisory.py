"""
CYCLONEX AI Advisory API Endpoint
Integrates the deterministic ground truth matrix with Gemini 3.7 Flash on Vertex AI.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from app.api.v1.endpoints.risk_analysis import evaluate_risk
from app.ai.vertex_gemini import advisory_engine
from app.engine.dispatch_generator import generate_early_warning_dispatches

router = APIRouter()


@router.post("/generate", summary="Generate Grounded Bilingual Cyclone Advisory")
async def generate_cyclone_advisory(
    cyclone_id: Optional[str] = Body(None, embed=True, description="Cyclone ID or active if None"),
):
    """
    Executes the full anti-hallucination grounded pipeline:
      1. Evaluates deterministic spatial hazard metrics & infrastructure exposure.
      2. Injects verified JSON ground truth into Gemini 3.7 Flash (Vertex AI).
      3. Returns Authority tactical guidance, bilingual citizen alerts (English + Telugu),
         and automated CAP v1.2 multi-channel municipal dispatches.
    """
    # 1. Obtain verified deterministic ground truth
    ground_truth = await evaluate_risk(cyclone_id=cyclone_id)

    # 2. Synthesize grounded advisory
    advisory = advisory_engine.generate_advisory(ground_truth)

    # 3. Formulate automated early-warning CAP and multi-channel dispatches
    top_cvi = ground_truth["cvi_rankings"][0] if ground_truth["cvi_rankings"] else {"district": "Coastal AP", "cvi_score": 0.70}
    dispatches = generate_early_warning_dispatches(
        ground_truth["cyclone_metadata"],
        top_cvi,
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
            "cvi_top_district": top_cvi,
            "parametric_insurance": ground_truth.get("parametric_insurance"),
        },
    }
