import { HealthResponse } from "@/types/health";
import {
  CycloneTrack,
  RiskEvaluationResponse,
  AdvisoryResponse,
  ShelterCandidate,
} from "@/types/cyclone";

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export async function fetchBackendHealth(): Promise<HealthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/health`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Backend health check failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchBenchmarks(): Promise<any[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/cyclone/benchmarks`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch benchmarks");
  return res.json();
}

export async function fetchActiveCyclone(): Promise<CycloneTrack> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/cyclone/active`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch active cyclone");
  return res.json();
}

export async function fetchCycloneById(cycloneId: string): Promise<CycloneTrack> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/cyclone/${cycloneId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch cyclone '${cycloneId}'`);
  return res.json();
}

export async function evaluateRisk(
  cycloneId?: string
): Promise<RiskEvaluationResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/risk/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cyclone_id: cycloneId || null }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to evaluate risk");
  return res.json();
}

export async function generateAdvisory(
  cycloneId?: string
): Promise<AdvisoryResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/advisory/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cyclone_id: cycloneId || null }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to generate grounded advisory");
  return res.json();
}

export async function fetchNearbyShelters(
  lat: number,
  lon: number,
  limit: number = 4,
  cycloneId?: string
): Promise<{ nearest_shelters: ShelterCandidate[] }> {
  const query = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    limit: limit.toString(),
  });
  if (cycloneId) {
    query.set("cyclone_id", cycloneId);
  }
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/infrastructure/shelters/nearby?${query.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch nearby shelters");
  return res.json();
}

export async function fetchInfrastructureGeoJSON(
  assetType?: string
): Promise<any> {
  const url = assetType
    ? `${getApiBaseUrl()}/api/v1/infrastructure/assets?asset_type=${assetType}`
    : `${getApiBaseUrl()}/api/v1/infrastructure/assets`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch infrastructure GeoJSON");
  return res.json();
}

export interface LiveConditions {
  status: "live" | "unavailable";
  reason?: string;
  source: string;
  note: string;
  observed_at?: string;
  location: { lat: number; lon: number; label?: string | null };
  conditions?: {
    temperature_c: number | null;
    relative_humidity_pct: number | null;
    precipitation_mm: number | null;
    wind_speed_kmh: number | null;
    wind_gusts_kmh: number | null;
    wind_direction_deg: number | null;
    surface_pressure_hpa: number | null;
    weather_code: number | null;
    wave_height_m: number | null;
  };
  cyclonic_winds_now?: boolean;
  cyclonic_wind_threshold_kmh?: number;
  served_from_cache?: boolean;
}

export async function fetchLiveConditions(lat: number, lon: number, label?: string): Promise<LiveConditions> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (label) params.set("label", label);
  const res = await fetch(`${getApiBaseUrl()}/api/v1/weather/live?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Live conditions request failed: ${res.status}`);
  return res.json();
}

/** URL of the engine-rendered hazard map image (the exact image sent to Gemini). */
export function hazardMapImageUrl(cycloneId?: string): string {
  const q = cycloneId ? `?cyclone_id=${encodeURIComponent(cycloneId)}` : "";
  return `${getApiBaseUrl()}/api/v1/advisory/hazard-map.png${q}`;
}

export interface TerrainCheck {
  status: "live" | "not_configured" | "error";
  reason?: string;
  source?: string;
  note?: string;
  landfall_target?: string;
  radius_km?: number;
  surge_height_m?: number;
  mean_land_elevation_m?: number | null;
  land_fraction_below_surge_pct?: number | null;
  land_area_below_surge_km2?: number | null;
  land_area_analysed_km2?: number | null;
  computed_at?: string;
}

export async function fetchTerrainCheck(cycloneId?: string): Promise<TerrainCheck> {
  const q = cycloneId ? `?cyclone_id=${encodeURIComponent(cycloneId)}` : "";
  const res = await fetch(`${getApiBaseUrl()}/api/v1/geospatial/terrain-check${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Terrain check failed: ${res.status}`);
  return res.json();
}
