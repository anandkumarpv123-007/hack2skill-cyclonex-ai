import { HealthResponse } from "@/types/health";
import {
  CycloneTrack,
  RiskEvaluationResponse,
  AdvisoryResponse,
  ShelterCandidate,
} from "@/types/cyclone";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchBackendHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Backend health check failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchBenchmarks(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cyclone/benchmarks`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch benchmarks");
  return res.json();
}

export async function fetchActiveCyclone(): Promise<CycloneTrack> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cyclone/active`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch active cyclone");
  return res.json();
}

export async function fetchCycloneById(cycloneId: string): Promise<CycloneTrack> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cyclone/${cycloneId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch cyclone '${cycloneId}'`);
  return res.json();
}

export async function evaluateRisk(
  cycloneId?: string
): Promise<RiskEvaluationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/risk/evaluate`, {
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
  const res = await fetch(`${API_BASE_URL}/api/v1/advisory/generate`, {
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
    `${API_BASE_URL}/api/v1/infrastructure/shelters/nearby?${query.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch nearby shelters");
  return res.json();
}

export async function fetchInfrastructureGeoJSON(
  assetType?: string
): Promise<any> {
  const url = assetType
    ? `${API_BASE_URL}/api/v1/infrastructure/assets?asset_type=${assetType}`
    : `${API_BASE_URL}/api/v1/infrastructure/assets`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch infrastructure GeoJSON");
  return res.json();
}
