export interface Waypoint {
  time: string;
  lat: number;
  lon: number;
  max_wind_kmh: number;
  central_pressure_hpa: number;
  r34_km: number;
  r50_km: number;
  r64_km: number;
  stage: string;
}

export interface CycloneTrack {
  id: string;
  name: string;
  year: number;
  category: string;
  is_simulated: boolean;
  data_source: string;
  landfall_target: string;
  landfall_lat: number;
  landfall_lon: number;
  peak_wind_kmh: number;
  min_pressure_hpa: number;
  waypoints: Waypoint[];
}

export interface AssetSummary {
  id: string;
  name: string;
  category: string;
  district: string;
  lat: number;
  lon: number;
  hazard_level: "extreme" | "high" | "moderate" | "none";
  in_surge_zone: boolean;
  in_64kt_wind: boolean;
  in_50kt_wind: boolean;
  in_34kt_wind: boolean;
}

export interface ExposureSummary {
  total_assets_evaluated: number;
  hospitals_at_risk: {
    in_64kt: number;
    in_50kt: number;
    in_34kt: number;
    in_surge: number;
    assets: AssetSummary[];
  };
  shelters_at_risk: {
    in_64kt: number;
    in_50kt: number;
    in_34kt: number;
    in_surge: number;
    assets: AssetSummary[];
  };
  substations_at_risk: {
    in_64kt: number;
    in_50kt: number;
    in_34kt: number;
    in_surge: number;
    assets: AssetSummary[];
  };
  roads_at_risk_km: {
    in_64kt_wind: number;
    in_surge_inundation: number;
  };
}

export interface DistrictCVI {
  district: string;
  cvi_score: number;
  risk_level: "Extreme" | "High" | "Moderate" | "Low";
  risk_color: string;
  action_code: string;
  components: {
    wind_exposure_normalized: number;
    surge_inundation_fraction: number;
    elevation_deficit_risk: number;
    mean_elevation_m: number;
    infrastructure_density_normalized: number;
    shelter_mitigation_normalized: number;
  };
}

export interface SurgeScenario {
  model_type: string;
  is_hydrodynamic_forecast: boolean;
  disclaimer: string;
  central_pressure_hpa: number;
  max_wind_speed_kmh: number;
  delta_h_pressure_m: number;
  delta_h_wind_m: number;
  tide_baseline_m: number;
  total_scenario_surge_m: number;
}

export interface RiskEvaluationResponse {
  cyclone_metadata: {
    id: string;
    name: string;
    category: string;
    peak_wind_kmh: number;
    min_pressure_hpa: number;
    landfall_target: string;
    is_simulated: boolean;
    data_source: string;
  };
  surge_scenario: SurgeScenario;
  exposure_summary: ExposureSummary;
  cvi_rankings: DistrictCVI[];
  rainfall_pathways?: RainfallPathways;
  parametric_insurance?: ParametricInsurance;
  spatial_layers: {
    track_line: any;
    swath_34kt: any;
    swath_50kt: any;
    swath_64kt: any;
    surge_inundation_zone: any;
    drainage_corridors?: any;
  };
}

export interface RainfallPathways {
  summary: {
    max_24h_rainfall_mm: number;
    highest_vulnerability_district: string;
    vulnerable_corridors_count: number;
  };
  district_evaluations: Array<{
    district: string;
    distance_to_core_km: number;
    predicted_24h_rainfall_mm: number;
    drainage_vulnerability_index: number;
    pluvial_status: string;
    mean_elevation_m: number;
    coastal_slope_m_per_km: number;
  }>;
  arterial_corridors: Array<{
    corridor_id: string;
    corridor_name: string;
    district: string;
    distance_km: number;
    culverts_count: number;
    local_rainfall_mm: number;
    washout_risk: boolean;
    severity: string;
    recommended_action: string;
  }>;
  drainage_corridors_geojson: any;
}

export interface ParametricInsurance {
  facility_metadata: {
    policy_name: string;
    underwriter: string;
    insured_state: string;
    total_facility_pool_inr_cr: number;
    total_facility_pool_usd_m: number;
    evaluated_at: string;
  };
  execution_summary: {
    payout_status: string;
    total_released_inr_cr: number;
    total_released_usd_m: number;
    payout_percentage: number;
    active_triggers_count: number;
    priority_beneficiary: string;
  };
  triggers: Array<{
    id: string;
    name: string;
    condition: string;
    measured_value: string;
    status: string;
    allocated_cr: number;
    released_cr: number;
    earmarked_for: string;
  }>;
  disbursements: Array<{
    beneficiary: string;
    share_percent: number;
    amount_cr: number;
    purpose: string;
  }>;
}

export interface EarlyWarningDispatches {
  dispatch_id: string;
  generated_at: string;
  cap_xml: string;
  cap_json: any;
  channels: Array<{
    channel_id: string;
    channel_name: string;
    protocol: string;
    target: string;
    payload: any;
    status: string;
  }>;
}

export interface AdvisoryData {
  is_live_ai: boolean;
  ai_provider: string;
  model: string;
  grounding_integrity_verified: boolean;
  metrics_cited: {
    cyclone_name: string;
    peak_wind_kmh: number;
    surge_height_m: number;
    hospitals_at_risk: number;
    roads_inundated_km: number;
    highest_risk_district: string;
    highest_cvi_score: number;
  };
  authority_guidance_en: string;
  citizen_advisory_en: string;
  citizen_advisory_te: string;
}

export interface AdvisoryResponse {
  status: string;
  advisory: AdvisoryData;
  dispatches?: EarlyWarningDispatches;
  ground_truth_context: any;
}

export interface ShelterCandidate {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  distance_km: number;
  compass_direction: string;
  is_safe: boolean;
  in_surge_zone: boolean;
  in_extreme_wind: boolean;
  capacity: number;
  available_slots: number;
  safety_status: string;
  safety_status_te: string;
}
