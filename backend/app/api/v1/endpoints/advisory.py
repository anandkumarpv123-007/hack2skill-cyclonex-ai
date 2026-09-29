"""
CYCLONEX AI Advisory API Endpoint
Integrates the deterministic ground truth matrix with Gemini 3.7 Flash on Vertex AI.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from app.api.v1.endpoints.risk_analysis import evaluate_risk
from app.ai.vertex_gemini import advisory_engine

router = APIRouter()


@router.post("/generate", summary="Generate Grounded Bilingual Cyclone Advisory")
async def generate_cyclone_advisory(
    cyclone_id: Optional[str] = Body(None, embed=True, description="Cyclone ID or active if None"),
):
    """
    Executes the full anti-hallucination grounded pipeline:
      1. Evaluates deterministic spatial hazard metrics & infrastructure exposure.
      2. Injects verified JSON ground truth into Gemini 3.7 Flash (Vertex AI).
      3. Returns Authority tactical guidance and bilingual citizen alerts (English + Telugu).
    """
    # 1. Obtain verified deterministic ground truth
    ground_truth = await evaluate_risk(cyclone_id=cyclone_id)

    # 2. Synthesize grounded advisory
    advisory = advisory_engine.generate_advisory(ground_truth)

    return {
        "status": "success",
        "advisory": advisory,
        "ground_truth_context": {
            "cyclone_metadata": ground_truth["cyclone_metadata"],
            "exposure_summary": ground_truth["exposure_summary"],
            "cvi_top_district": ground_truth["cvi_rankings"][0] if ground_truth["cvi_rankings"] else None,
        },
    }
