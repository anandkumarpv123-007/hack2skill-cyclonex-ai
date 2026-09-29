export interface DeterministicStackInfo {
  python: string;
  fastapi: string;
  geopandas: string;
  numpy: string;
  pandas: string;
  shapely: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  data_source_mode: "simulated" | "live" | string;
  milestone: string;
  deterministic_stack: DeterministicStackInfo;
  timestamp: string;
}
