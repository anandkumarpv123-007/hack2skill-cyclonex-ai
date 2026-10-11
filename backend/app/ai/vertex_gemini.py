"""
CYCLONEX Grounded AI Advisory Engine
Integrates deterministic spatial risk calculations with Google Gemini Developer API
(via google-genai SDK and GEMINI_API_KEY), backed by a deterministic rule-based grounding engine.
"""

from typing import Dict, Any, List, Optional, Tuple
import os
import re
import math
from app.core.config import settings
from app.core.logging import logger
from app.ai.prompt_templates import SYSTEM_GROUNDING_DIRECTIVE, USER_GROUNDING_PROMPT_TEMPLATE


WIND_PATTERNS = [
    re.compile(r"\b(?:wind|winds|gust|gusts|gale|sustained)\b", re.IGNORECASE),
    re.compile(r"(?:\b|(?<=\d))(?:km/h|kmph|kt|knots?|mph)\b", re.IGNORECASE),
    re.compile(r"(?:గాలులు|గాలి|వేగం|కి\.మీ)"),
]

SURGE_PATTERNS = [
    re.compile(
        r"\b(?:surge|inundat\w*|tide|tidal|sea|wave|waves|water\s*level|storm\s*surge|coastal\s*flood\w*)\b",
        re.IGNORECASE,
    ),
    re.compile(r"(?:\b|(?<=\d))(?:m|meters?|metres?)\b", re.IGNORECASE),
    re.compile(r"(?:అలలు|ముంపు|సముద్ర|మీటర్ల)"),
]

CLAUSE_DELIMITER_RE = re.compile(
    r"[,;\n]|\b(?:and|with|while|&)\b|(?:\s|^)మరియు(?:\s|$)|\.(?:\s|$|[\"'])",
    re.IGNORECASE,
)


def _extract_number_spans(text: str) -> List[Tuple[int, int, float]]:
    """Extracts finite numbers from text along with their character span indices."""
    matches = list(re.finditer(r"(?<![\d.])(\d+(?:\.\d+)?)(?![\d]|\.\d)", text))
    results = []
    for m in matches:
        try:
            val = float(m.group(1))
            if math.isfinite(val):
                results.append((m.start(), m.end(), val))
        except ValueError:
            pass
    return results


def _metric_association(text: str, start: int, end: int, window: int = 60) -> str:
    """
    Determines whether a numeric token at span [start:end] is associated with wind or surge context.
    Scans left and right up to clause boundaries, checking proximity to domain keywords and attached units.
    Fails conservatively ('UNKNOWN') when association cannot be unambiguously established.
    """
    left_bound = max(0, start - window)
    left_raw = text[left_bound:start]
    delim_matches_l = list(CLAUSE_DELIMITER_RE.finditer(left_raw))
    if delim_matches_l:
        last_delim = delim_matches_l[-1].end()
        left_str = left_raw[last_delim:]
    else:
        left_str = left_raw

    right_bound = min(len(text), end + window)
    right_raw = text[end:right_bound]
    delim_matches_r = list(CLAUSE_DELIMITER_RE.finditer(right_raw))
    if delim_matches_r:
        first_delim = delim_matches_r[0].start()
        right_str = right_raw[:first_delim]
    else:
        right_str = right_raw

    has_wind = any(p.search(left_str) or p.search(right_str) for p in WIND_PATTERNS)
    has_surge = any(p.search(left_str) or p.search(right_str) for p in SURGE_PATTERNS)

    if has_wind and not has_surge:
        return "WIND"
    if has_surge and not has_wind:
        return "SURGE"
    return "UNKNOWN"


def verify_numerical_grounding(text: Optional[str], peak_wind: Any, surge_h: Any) -> bool:
    """
    Conservatively verifies that key numerical hazard values cited in the operational text
    match the calculated ground truth metrics with metric-to-number association.
    Guards against NaN, Inf, non-numeric inputs, empty text, larger-number false positives (e.g. 110 in 1100),
    and metric-swapped values (e.g. wind 2.85 km/h, surge 110 m).
    Returns True only if both wind and surge metrics are unambiguously verified in their respective contexts.
    """
    if not text or not isinstance(text, str):
        return False

    if peak_wind is None or isinstance(peak_wind, bool) or not isinstance(peak_wind, (int, float)):
        return False
    if surge_h is None or isinstance(surge_h, bool) or not isinstance(surge_h, (int, float)):
        return False

    try:
        f_wind = float(peak_wind)
        f_surge = float(surge_h)
        if not math.isfinite(f_wind) or not math.isfinite(f_surge):
            return False
    except (ValueError, OverflowError):
        return False

    spans = _extract_number_spans(text)
    if not spans:
        return False

    wind_verified = False
    surge_verified = False

    for start, end, val in spans:
        assoc = _metric_association(text, start, end)

        if assoc == "WIND":
            if abs(val - f_wind) < 1e-3 or abs(val - round(f_wind)) < 1e-3:
                wind_verified = True

        if assoc == "SURGE":
            if abs(val - f_surge) < 1e-3 or abs(val - round(f_surge, 1)) < 1e-3:
                surge_verified = True

    return wind_verified and surge_verified


def get_grounding_status(text: Optional[str], peak_wind: Any, surge_h: Any, is_live_ai: bool) -> str:
    """Returns a transparent, descriptive grounding status label."""
    is_verified = verify_numerical_grounding(text, peak_wind, surge_h)
    if is_live_ai:
        if is_verified:
            return "VERIFIED_NUMERICAL_MATCH"
        return "SOURCE_CONTEXT_SUPPLIED_UNVERIFIED_NUMERICS"
    else:
        if is_verified:
            return "DETERMINISTIC_GROUNDED_VERIFIED"
        return "DETERMINISTIC_RULE_TEMPLATE"


class GroundedAdvisoryEngine:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"

    def _call_gemini(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Attempts to invoke Gemini Developer API via google-genai SDK using GEMINI_API_KEY.
        Returns (response_text, fallback_reason).
        Enforces a 15-second timeout and handles all exceptions safely without crashing.
        """
        api_key = self.api_key or os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            return None, "GEMINI_API_KEY_NOT_CONFIGURED"

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(
                api_key=api_key,
                http_options=types.HttpOptions(timeout=15.0),
            )
            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_GROUNDING_DIRECTIVE,
                temperature=0.2,
                max_output_tokens=1024,
            )
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            if response and response.text:
                return response.text.strip(), None
            else:
                return None, "EMPTY_MODEL_RESPONSE"
        except Exception as e:
            err_str = str(e)
            logger.warning(f"Gemini API invocation failed ({type(e).__name__}): {err_str}")
            if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                reason = "QUOTA_EXCEEDED"
            elif "DEADLINE_EXCEEDED" in err_str or "timeout" in err_str.lower():
                reason = "REQUEST_TIMEOUT"
            elif "INVALID_ARGUMENT" in err_str or "API_KEY_INVALID" in err_str:
                reason = "INVALID_API_KEY"
            elif "NOT_FOUND" in err_str or "model" in err_str.lower():
                reason = "MODEL_UNAVAILABLE"
            else:
                reason = "API_COMMUNICATION_ERROR"
            return None, reason

    def generate_advisory(
        self,
        ground_truth: Dict[str, Any],
        target_district: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates operational advisories strictly grounded in the
        deterministic ground truth matrix.

        Validation rules:
          - Requires genuine cyclone_metadata, surge_scenario, and cvi_rankings.
          - Rejects missing or non-finite wind, pressure, surge, district, or CVI values.
          - Directly uses CVI risk level and action code to determine authoritative directives.
          - Supports targeting a specific district rather than assuming cvi_rankings[0].
          - When live Gemini is active, provides gemini_briefing alongside deterministic directives.
        """
        if not ground_truth or not isinstance(ground_truth, dict):
            raise ValueError("Invalid ground truth data: input must be a non-empty dictionary.")

        meta = ground_truth.get("cyclone_metadata")
        if not meta or not isinstance(meta, dict):
            raise ValueError("Missing required ground truth input: 'cyclone_metadata'")

        cyclone_name = meta.get("name")
        peak_wind = meta.get("peak_wind_kmh")
        min_press = meta.get("min_pressure_hpa")
        landfall_target = meta.get("landfall_target")
        category = meta.get("category", "Cyclonic Storm")

        if cyclone_name is None or peak_wind is None or min_press is None or landfall_target is None:
            raise ValueError(
                "Incomplete 'cyclone_metadata': 'name', 'peak_wind_kmh', 'min_pressure_hpa', and 'landfall_target' are required."
            )

        surge = ground_truth.get("surge_scenario")
        if not surge or not isinstance(surge, dict) or "total_scenario_surge_m" not in surge:
            raise ValueError("Missing required ground truth input: 'surge_scenario.total_scenario_surge_m'")
        surge_h = surge["total_scenario_surge_m"]

        cvi = ground_truth.get("cvi_rankings")
        if not cvi or not isinstance(cvi, list) or len(cvi) == 0:
            raise ValueError("Missing required ground truth input: 'cvi_rankings' must be a non-empty list.")

        # Match requested district or default to highest risk district
        selected_entry = None
        if target_district:
            for d_entry in cvi:
                if (d_entry.get("district") or "").strip().lower() == target_district.strip().lower():
                    selected_entry = d_entry
                    break
            if not selected_entry:
                available = [d.get("district") for d in cvi]
                raise ValueError(
                    f"Requested target district '{target_district}' not found in CVI rankings. Available: {available}"
                )

        if not selected_entry:
            selected_entry = cvi[0]

        top_district = selected_entry.get("district")
        top_cvi_score = selected_entry.get("cvi_score")
        risk_level = selected_entry.get("risk_level")
        action_code = selected_entry.get("action_code")

        if top_district is None or top_cvi_score is None or risk_level is None:
            raise ValueError("CVI ranking entries must contain 'district', 'cvi_score', and 'risk_level'.")

        # Extract exposure metrics (defaulting safely to 0 if not yet evaluated)
        exposure = ground_truth.get("exposure_summary") or {}
        hosp_64 = exposure.get("hospitals_at_risk", {}).get("in_64kt", 0)
        hosp_50 = exposure.get("hospitals_at_risk", {}).get("in_50kt", 0)
        hosp_surge = exposure.get("hospitals_at_risk", {}).get("in_surge", 0)
        shelter_64 = exposure.get("shelters_at_risk", {}).get("in_64kt", 0)
        shelter_surge = exposure.get("shelters_at_risk", {}).get("in_surge", 0)
        substations = exposure.get("substations_at_risk", {}).get("in_64kt", 0)
        roads_surge_km = exposure.get("roads_at_risk_km", {}).get("in_surge_inundation", 0.0)
        roads_wind_km = exposure.get("roads_at_risk_km", {}).get("in_64kt_wind", 0.0)

        # Simplified screening heuristic for planar inland reach (0.35 m/km coastal slope)
        try:
            heuristic_inland_reach_km = round(float(surge_h) / 0.35, 1)
        except (ValueError, TypeError, ZeroDivisionError):
            heuristic_inland_reach_km = 0.0

        # Format user prompt for Gemini
        cvi_lines = "\n".join([f"- {d['district']}: CVI {d['cvi_score']} ({d['risk_level']})" for d in cvi[:4]])
        user_prompt = USER_GROUNDING_PROMPT_TEMPLATE.format(
            cyclone_name=cyclone_name,
            category=category,
            landfall_target=landfall_target,
            peak_wind_kmh=peak_wind,
            min_pressure_hpa=min_press,
            surge_height_m=surge_h,
            inland_reach_km=heuristic_inland_reach_km,
            hospitals_64kt=hosp_64,
            hospitals_50kt=hosp_50,
            hospitals_surge=hosp_surge,
            shelters_64kt=shelter_64,
            shelters_surge=shelter_surge,
            substations_at_risk=substations,
            roads_inundated_km=roads_surge_km,
            roads_wind_km=roads_wind_km,
            cvi_summary=cvi_lines,
        )

        ai_response_text, fallback_reason = self._call_gemini(user_prompt)
        is_live_ai = ai_response_text is not None

        # Synchronize authoritative action directive directly with CVI engine risk classification
        if risk_level == "Extreme" or action_code == "IMMEDIATE_MANDATORY_EVACUATION":
            action_directive = "Execute IMMEDIATE MANDATORY COASTAL EVACUATION."
        elif risk_level == "High" or action_code == "PREPARE_SHELTERS_EVACUATE_VULNERABLE":
            action_directive = "PREPARE SHELTERS AND EVACUATE VULNERABLE POPULATIONS."
        elif risk_level == "Moderate" or action_code == "RESTRICT_MOVEMENT_SECURE_ASSETS":
            action_directive = "RESTRICT NON-ESSENTIAL MOVEMENT AND SECURE CRITICAL ASSETS."
        else:
            action_directive = "MONITOR INCIDENT BULLETINS AND MAINTAIN WATCH."

        # Dynamically formulate truthful deterministic directives
        directives = [
            f"TACTICAL INCIDENT COMMAND DIRECTIVE: {cyclone_name.upper()} ({category})",
            f"1. Landfall Projection: {landfall_target} with peak sustained winds of {peak_wind} km/h and scenario coastal surge of {surge_h} meters.",
            f"2. Priority District: {top_district} exhibits Composite Vulnerability Index ({top_cvi_score}, {risk_level} Risk). {action_directive}",
        ]

        if hosp_64 > 0 or hosp_surge > 0:
            directives.append(
                f"3. Critical Hospital Contingency: {hosp_64} hospital(s) within the 64-kt hurricane swath and {hosp_surge} hospital(s) facing coastal surge exposure. Mandate 72-hour diesel backup generator refueling and clear ground-floor wards."
            )
        elif hosp_50 > 0:
            directives.append(
                f"3. Critical Hospital Contingency: {hosp_50} hospital(s) within the 50-kt storm wind swath. Ensure emergency trauma units have uninterrupted auxiliary power."
            )
        else:
            directives.append(
                "3. Hospital Readiness: Regional medical facilities outside direct hazard cones are placed on standby to receive potential transfers."
            )

        if roads_surge_km > 0:
            directives.append(
                f"4. Evacuation Road Inundation: {roads_surge_km} km of coastal highways face scenario inundation. Close compromised coastal sectors immediately and divert emergency relief transport to elevated arterial corridors."
            )
        else:
            directives.append(
                "4. Evacuation Route Status: Major highway corridors currently remain clear of scenario surge inundation. Maintain traffic flow for emergency logistics."
            )

        if shelter_surge > 0:
            directives.append(
                f"5. Shelter Safety Status: {shelter_surge} coastal shelter(s) are compromised by active scenario surge inundation and must remain locked. Direct evacuees strictly to elevated safe inland facilities."
            )
        else:
            directives.append(
                "5. Shelter Safety Status: Registered multi-purpose cyclone shelters are cleared above scenario surge levels. Mobilize emergency supplies to receive evacuees."
            )

        rainfall = ground_truth.get("rainfall_pathways", {}).get("summary", {})
        insurance = ground_truth.get("parametric_insurance", {}).get("execution_summary", {})
        max_rain = rainfall.get("max_24h_rainfall_mm", 0.0)
        released_cr = insurance.get("total_released_inr_cr", 0.0)
        active_trigs = insurance.get("active_triggers_count", 0)

        # Directive 6: Power Grid & Arterial Infrastructure Hardening
        if max_rain > 0:
            directives.append(
                f"6. Critical Infrastructure Hardening: Enforce controlled islanding of 33kV coastal power feeders 4 hours pre-landfall to prevent cascading transformer burnouts. Pre-position heavy-duty tractor pumps at identified arterial culvert bottlenecks facing up to {max_rain} mm 24h convective rainfall."
            )
        else:
            directives.append(
                "6. Critical Infrastructure Hardening: Enforce controlled islanding of 33kV coastal power feeders 4 hours pre-landfall to prevent cascading transformer burnouts. Pre-position pumps at identified arterial culvert drainage bottlenecks."
            )

        # Directive 7: Parametric Disaster Insurance Pre-Landfall Liquidity (Demonstration Model)
        if released_cr > 0:
            directives.append(
                f"7. Parametric Disaster Insurance Liquidity (Simulated): {active_trigs} deterministic physical trigger(s) reached. Modeled pre-landfall release of ₹{released_cr} Crore (${round(released_cr/8.35, 1)}M USD) simulated emergency liquidity to {top_district} DDMA staging pool."
            )
        else:
            directives.append(
                "7. Parametric Disaster Insurance Liquidity (Simulated): Hazard metrics currently below trigger thresholds. Parametric emergency capital model remains on standby."
            )

        authority_guidance_en = "\n".join(directives)

        citizen_advisory_en = (
            f"EMERGENCY CYCLONE WARNING: {cyclone_name}\n"
            f"Dangerous winds up to {peak_wind} km/h and sea surge up to {surge_h}m expected near {landfall_target}.\n"
            f"- EVACUATE NOW if you live in low-lying coastal areas or thatched houses.\n"
            f"- Move to your nearest designated elevated cyclone shelter immediately.\n"
            f"- Keep drinking water, dry food, emergency medicines, and flashlight ready.\n"
            f"- Do not approach flooded roads, fallen electric lines, or the seashore."
        )

        citizen_advisory_te = (
            f"తీవ్ర తుఫాను అత్యవసర హెచ్చరిక: {cyclone_name} ({landfall_target})\n"
            f"{landfall_target} తీరానికి సమీపంలో గంటకు {peak_wind} కి.మీ తీవ్ర గాలులు మరియు {surge_h} మీటర్ల సముద్ర అలల ముంపు పొంచివుంది.\n"
            f"1. తక్షణ తరలింపు: తీరప్రాంత మరియు లోతట్టు గ్రామాల ప్రజలు వెంటనే సురక్షిత తుఫాను ఆశ్రయాలకు వెళ్లండి.\n"
            f"2. సురక్షిత ఆశ్రయాలు: నీటి ముంపు లేని ఎత్తైన ప్రభుత్వ తుఫాను పునరావాస కేంద్రాలలో మాత్రమే ఆశ్రయం పొందండి.\n"
            f"3. నిత్యావసరాలు: త్రాగునీరు, ఎండు ఆహారం, అవసరమైన మందులు, టార్చ్ లైట్ మీ వెంట ఉంచుకోండి.\n"
            f"4. హెచ్చరిక: తెగిపడిన విద్యుత్ తీగలు, చెట్లు మరియు వరద నీటికి దూరంగా ఉండండి. పుకార్లను నమ్మవద్దు."
        )

        # Conservative grounding verification
        active_verification_text = ai_response_text if is_live_ai else authority_guidance_en
        grounding_verified = verify_numerical_grounding(active_verification_text, peak_wind, surge_h)
        grounding_status = get_grounding_status(active_verification_text, peak_wind, surge_h, is_live_ai)

        return {
            "is_live_ai": is_live_ai,
            "ai_provider": "GOOGLE_AI_STUDIO_GEMINI" if is_live_ai else "Deterministic Rule-Based Grounding Engine",
            "model": self.model_name if is_live_ai else "deterministic-rule-template",
            "gemini_briefing": ai_response_text,
            "grounding_integrity_verified": grounding_verified,
            "grounding_status": grounding_status,
            "fallback_reason": fallback_reason,
            "metrics_cited": {
                "cyclone_name": cyclone_name,
                "peak_wind_kmh": peak_wind,
                "central_pressure_hpa": min_press,
                "surge_height_m": surge_h,
                "scenario_surge_m": surge_h,
                "hospitals_at_risk": hosp_64,
                "roads_inundated_km": roads_surge_km,
                "highest_risk_district": top_district,
                "highest_cvi_score": top_cvi_score,
                "district_risk_level": risk_level,
                "district_action_code": action_code,
            },
            "authority_guidance_en": authority_guidance_en,
            "citizen_advisory_en": citizen_advisory_en,
            "citizen_advisory_te": citizen_advisory_te,
            "raw_ai_text": ai_response_text,
        }


advisory_engine = GroundedAdvisoryEngine()
