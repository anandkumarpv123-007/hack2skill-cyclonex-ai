"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Wind,
  Waves,
  MapPin,
  Building2,
  Zap,
  Navigation,
  FileDown,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
} from "lucide-react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("@/components/map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-400 font-mono">
      Initializing GPU-Accelerated Vector Map (WebGL)...
    </div>
  ),
});
import ExposureCharts from "@/components/analytics/ExposureCharts";
import {
  fetchBenchmarks,
  fetchActiveCyclone,
  fetchCycloneById,
  evaluateRisk,
  generateAdvisory,
  fetchInfrastructureGeoJSON,
} from "@/lib/api";
import {
  CycloneTrack,
  RiskEvaluationResponse,
  AdvisoryData,
} from "@/types/cyclone";

export default function AuthorityDashboardPage() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("cyclone_michaung_2023");
  const [cyclone, setCyclone] = useState<CycloneTrack | null>(null);
  const [riskData, setRiskData] = useState<RiskEvaluationResponse | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [infrastructureAssets, setInfrastructureAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (scenarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [benchmarkList, track, riskRes, advisoryRes, infraRes] = await Promise.all([
        fetchBenchmarks(),
        fetchCycloneById(scenarioId),
        evaluateRisk(scenarioId),
        generateAdvisory(scenarioId),
        fetchInfrastructureGeoJSON(),
      ]);

      setBenchmarks(benchmarkList);
      setCyclone(track);
      setRiskData(riskRes);
      setAdvisory(advisoryRes.advisory);
      setInfrastructureAssets(infraRes.features || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading authority dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedScenarioId);
  }, [selectedScenarioId]);

  const exportIncidentMatrix = () => {
    if (!riskData) return;
    const blob = new Blob([JSON.stringify(riskData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CYCLONEX_Incident_Matrix_${selectedScenarioId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold group-hover:scale-105 transition-transform">
              🌀
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CYCLONEX
              </span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                AUTHORITY COMMAND
              </span>
            </div>
          </Link>
        </div>

        {/* Scenario Selector & Navigation Links */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Scenario:</span>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.year}) — {b.category}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadData(selectedScenarioId)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Reload data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={exportIncidentMatrix}
            disabled={!riskData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-medium"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export JSON Matrix</span>
          </button>

          <Link
            href="/citizen"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-medium"
          >
            <span>Citizen Safety View</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Origin & Scenario Header Banner */}
        {cyclone && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{cyclone.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {cyclone.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 font-mono">
                  [SIMULATED SCENARIO BENCHMARK]
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Data Source: {cyclone.data_source} • Target: {cyclone.landfall_target}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">PEAK WINDS</span>
                <span className="text-cyan-400 font-bold text-sm">{cyclone.peak_wind_kmh} km/h</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">MIN PRESSURE</span>
                <span className="text-rose-400 font-bold text-sm">{cyclone.min_pressure_hpa} hPa</span>
              </div>
            </div>
          </div>
        )}

        {/* Key Operational KPI Cards */}
        {riskData && (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Peak Wind Swath</span>
                <Wind className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-cyan-300 font-mono">
                {riskData.cyclone_metadata.peak_wind_kmh}
                <span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
              </div>
              <span className="text-[10px] text-slate-500 block">64-kt Hurricane Core</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Scenario Surge</span>
                <Waves className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-cyan-300 font-mono">
                {riskData.surge_scenario.total_scenario_surge_m}
                <span className="text-xs font-normal text-slate-400 ml-1">meters</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Elevation Scenario</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Top CVI District</span>
                <MapPin className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-lg font-bold text-rose-400 truncate">
                {riskData.cvi_rankings[0]?.district || "N/A"}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                CVI: {riskData.cvi_rankings[0]?.cvi_score} ({riskData.cvi_rankings[0]?.risk_level})
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Hospitals at Risk</span>
                <Building2 className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-black text-rose-400 font-mono">
                {riskData.exposure_summary.hospitals_at_risk.in_64kt}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({riskData.exposure_summary.hospitals_at_risk.in_surge} surge)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">64-kt Hurricane Swath</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Substations</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-300 font-mono">
                {riskData.exposure_summary.substations_at_risk.in_64kt}
                <span className="text-xs font-normal text-slate-400 ml-1">at risk</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Critical Power Grid</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Inundated Highway</span>
                <Navigation className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-cyan-300 font-mono">
                {riskData.exposure_summary.roads_at_risk_km.in_surge_inundation}
                <span className="text-xs font-normal text-slate-400 ml-1">km</span>
              </div>
              <span className="text-[10px] text-slate-500 block">NH-216 Coastal Sector</span>
            </div>
          </section>
        )}

        {/* MapLibre GL WebGL Interactive Map */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              GPU-Accelerated Spatial Hazard & Infrastructure Map
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              MapLibre GL JS • Vector Swaths & OpenStreetMap Assets
            </span>
          </div>

          <MapContainer
            spatialLayers={riskData ? riskData.spatial_layers : null}
            infrastructureAssets={infrastructureAssets}
            center={cyclone ? [cyclone.landfall_lon, cyclone.landfall_lat] : [80.5, 15.8]}
            zoom={7.5}
          />
        </section>

        {/* Recharts Analytics Panels */}
        {riskData && cyclone && (
          <section className="space-y-2">
            <ExposureCharts
              exposure={riskData.exposure_summary}
              cviRankings={riskData.cvi_rankings}
              waypoints={cyclone.waypoints}
            />
          </section>
        )}

        {/* Incident Commander Grounded AI Advisory Panel */}
        {advisory && (
          <section className="p-6 rounded-xl bg-slate-900/90 border border-cyan-800/50 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">
                  Incident Commander Tactical Operational Directives
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {advisory.ai_provider}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Strict JSON Grounding: ACTIVE
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-cyan-100 whitespace-pre-line leading-relaxed">
              {advisory.authority_guidance_en}
            </div>

            {/* Verification of Grounded Metrics */}
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Verified Ground Truth Assertions:</span>
              <div className="flex flex-wrap gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Peak Wind: {advisory.metrics_cited.peak_wind_kmh} km/h
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Surge: {advisory.metrics_cited.surge_height_m}m
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Hospitals in Swath: {advisory.metrics_cited.hospitals_at_risk}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Road Inundation: {advisory.metrics_cited.roads_inundated_km} km
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Top CVI: {advisory.metrics_cited.highest_risk_district} ({advisory.metrics_cited.highest_cvi_score})
                </span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
