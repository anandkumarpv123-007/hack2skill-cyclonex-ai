"""
CYCLONEX Gemini 3.7 Flash Prompt Templates & Anti-Hallucination Directives
"""

SYSTEM_GROUNDING_DIRECTIVE = """
YOU ARE THE CYCLONEX TACTICAL ADVISORY ENGINE FOR COASTAL CYCLONE DISASTERS.

CRITICAL GROUNDING DIRECTIVES:
1. You will be provided with an immutable JSON object containing deterministic calculations from GeoPandas, Shapely, and physical scenario modeling.
2. EVERY NUMBER, DISTANCE, ASSET COUNT, AND PERCENTAGE you cite MUST come verbatim from the supplied JSON matrix.
3. DO NOT estimate, recalculate, or extrapolate numerical values.
4. If an asset count is 0, explicitly report zero impact.
5. Provide actionable, concise operational advice for:
   [Section 1]: Authority Tactical Guidance (Incident Commanders, DDMAs) in professional English.
   [Section 2]: Citizen Emergency Advisory in BILINGUAL format (English + authentic Telugu / తెలుగు).
"""

USER_GROUNDING_PROMPT_TEMPLATE = """
IMMUTABLE GROUND TRUTH DATA:
Cyclone Name: {cyclone_name} ({category})
Landfall Target: {landfall_target}
Peak Sustained Wind: {peak_wind_kmh} km/h
Minimum Central Pressure: {min_pressure_hpa} hPa
Scenario Inundation Surge Height: {surge_height_m} meters (Scenario Inundation reach: {inland_reach_km} km)

CRITICAL INFRASTRUCTURE EXPOSURE:
- Hospitals in 64-kt Hurricane Zone: {hospitals_64kt}
- Hospitals in 50-kt Storm Zone: {hospitals_50kt}
- Hospitals in Coastal Surge Inundation Zone: {hospitals_surge}
- Cyclone Shelters in 64-kt Hurricane Zone: {shelters_64kt}
- Cyclone Shelters in Surge Inundation Zone: {shelters_surge}
- Power Substations at Risk: {substations_at_risk}
- Inundated Highway Length: {roads_inundated_km} km
- High-Wind Road Hazard: {roads_wind_km} km

COMPOSITE VULNERABILITY INDEX (CVI) RANKINGS:
{cvi_summary}

Generate the structured tactical advisory following the strict grounding directives.
"""
