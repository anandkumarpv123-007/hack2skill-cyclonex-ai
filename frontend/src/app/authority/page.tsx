"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Wind,
  Waves,
  Building2,
  Zap,
  Navigation,
  FileDown,
  RefreshCw,
  MapPin,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CloudRain,
  ShieldCheck,
  Radio,
  DollarSign,
  Copy,
  Layers,
  Activity,
  Satellite,
  AlertCircle,
  Truck,
  Droplet,
} from "lucide-react";
import MapContainer from "@/components/map/MapContainer";
import ExposureCharts from "@/components/analytics/ExposureCharts";
import {
  fetchBenchmarks,
  fetchCycloneById,
  evaluateRisk,
  generateAdvisory,
  fetchInfrastructureGeoJSON,
} from "@/lib/api";
import {
  CycloneTrack,
  RiskEvaluationResponse,
  AdvisoryData,
  EarlyWarningDispatches,
} from "@/types/cyclone";

type ActiveTab = "map" | "rainfall" | "hardening" | "parametric" | "dispatches";

export default function AuthorityDashboardPage() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("cyclone_michaung_2023");
  const [cyclone, setCyclone] = useState<CycloneTrack | null>(null);
  const [riskData, setRiskData] = useState<RiskEvaluationResponse | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [dispatches, setDispatches] = useState<EarlyWarningDispatches | null>(null);
  const [infrastructureAssets, setInfrastructureAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("map");

  // Load benchmarks list on mount
  useEffect(() => {
    async function init() {
      try {
        const benchList = await fetchBenchmarks();
        setBenchmarks(benchList);
      } catch (err: any) {
        console.error("Failed to load benchmarks:", err);
      }
    }
    init();
  }, []);

  const loadData = async (scenarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [track, evaluation, advRes, assetsData] = await Promise.all([
        fetchCycloneById(scenarioId),
        evaluateRisk(scenarioId),
        generateAdvisory(scenarioId),
        fetchInfrastructureGeoJSON(),
      ]);

      setCyclone(track);
      setRiskData(evaluation);
      setAdvisory(advRes.advisory);
      setDispatches(advRes.dispatches || null);
      setInfrastructureAssets(assetsData.features || []);
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to load authority operational dataset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedScenarioId);
  }, [selectedScenarioId]);

  const exportIncidentMatrix = () => {
    if (!riskData) return;
    const filename = `CYCLONEX_Incident_Matrix_${selectedScenarioId}.json`;
    const blob = new Blob([JSON.stringify(riskData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setExportToast(`✓ Incident matrix exported successfully as ${filename}`);
    setTimeout(() => setExportToast(null), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(`✓ Copied ${label} to clipboard`);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const has64kt = riskData && riskData.cyclone_metadata.peak_wind_kmh >= 118.5;
  const rainfall = riskData?.rainfall_pathways;
  const insurance = riskData?.parametric_insurance;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
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

        {/* Scenario Selector & Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Scenario:</span>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
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
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 transition"
            title="Reload data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            onClick={exportIncidentMatrix}
            disabled={!riskData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-medium transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export JSON Matrix</span>
          </button>

          <Link
            href="/citizen"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-medium transition"
          >
            <span>Citizen Safety View</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Floating Notifications */}
        {exportToast && (
          <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-medium">{exportToast}</span>
            </div>
            <button onClick={() => setExportToast(null)} className="text-emerald-400 hover:text-white px-2">✕</button>
          </div>
        )}

        {copyToast && (
          <div className="p-3 rounded-xl bg-cyan-950/90 border border-cyan-700 text-cyan-200 text-xs flex items-center justify-between gap-2 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-medium">{copyToast}</span>
            </div>
            <button onClick={() => setCopyToast(null)} className="text-cyan-400 hover:text-white px-2">✕</button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Cyclone Scenario & Multi-Source Intelligence Header */}
        {cyclone && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{cyclone.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {cyclone.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 font-mono">
                  [SIMULATED SCENARIO BENCHMARK]
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-mono flex items-center gap-1">
                  <Satellite className="w-3 h-3 text-cyan-400" /> GEE + Open-Meteo Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Landfall Target: <b className="text-slate-200">{cyclone.landfall_target}</b> • Coordinates: [{cyclone.landfall_lat}°N, {cyclone.landfall_lon}°E]
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">PEAK SUSTAINED WINDS</span>
                <span className="text-cyan-400 font-bold text-sm">{cyclone.peak_wind_kmh} km/h</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">CENTRAL PRESSURE</span>
                <span className="text-rose-400 font-bold text-sm">{cyclone.min_pressure_hpa} hPa</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">SCENARIO SURGE</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {riskData?.surge_scenario.total_scenario_surge_m || 2.2} m MSL
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6 Key Pre-Landfall Anticipatory Action KPI Cards */}
        {riskData && (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Priority District</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
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
                {has64kt
                  ? riskData.exposure_summary.hospitals_at_risk.in_64kt
                  : riskData.exposure_summary.hospitals_at_risk.in_50kt}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({riskData.exposure_summary.hospitals_at_risk.in_surge} surge)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {has64kt ? "64-kt Hurricane Swath" : "50-kt Gale/Storm Swath"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Power Substations</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-300 font-mono">
                {has64kt
                  ? riskData.exposure_summary.substations_at_risk.in_64kt
                  : riskData.exposure_summary.substations_at_risk.in_50kt}
                <span className="text-xs font-normal text-slate-400 ml-1">exposed</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {has64kt ? "64-kt Wind Exposure" : "50-kt Storm Wind Grid"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>24h Pluvial Rain</span>
                <CloudRain className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-purple-300 font-mono">
                {rainfall?.summary.max_24h_rainfall_mm || 180}
                <span className="text-xs font-normal text-slate-400 ml-1">mm</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Peak Drainage Catchment
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Arterial Washout</span>
                <Navigation className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-cyan-300 font-mono">
                {rainfall?.summary.vulnerable_corridors_count || 1}
                <span className="text-xs font-normal text-slate-400 ml-1">corridors</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {riskData.exposure_summary.roads_at_risk_km.in_surge_inundation} km Surge Cutoff
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Parametric Payout</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                ₹{insurance?.execution_summary.total_released_inr_cr || 0}
                <span className="text-xs font-normal text-slate-400 ml-1">Cr</span>
              </div>
              <span className="text-[10px] text-emerald-300 block font-mono">
                {insurance?.execution_summary.payout_status === "LIQUIDITY_RELEASED_PRE_LANDFALL"
                  ? "RELEASED PRE-LANDFALL"
                  : "STANDBY"}
              </span>
            </div>
          </section>
        )}

        {/* Modular Operations Console Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "map"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Spatial Hazards &amp; Map</span>
          </button>

          <button
            onClick={() => setActiveTab("rainfall")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "rainfall"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <CloudRain className="w-4 h-4" />
            <span>Rainfall Pathways &amp; Washouts</span>
          </button>

          <button
            onClick={() => setActiveTab("hardening")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "hardening"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Anticipatory Infrastructure Hardening</span>
          </button>

          <button
            onClick={() => setActiveTab("parametric")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "parametric"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Parametric Insurance Liquidity</span>
          </button>

          <button
            onClick={() => setActiveTab("dispatches")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "dispatches"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Automated Early-Warning Dispatches (CAP)</span>
          </button>
        </div>

        {/* TAB 1: SPATIAL HAZARDS & MAP */}
        {activeTab === "map" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  GPU-Accelerated Spatial Hazard &amp; Infrastructure Map
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  MapLibre GL JS • Vector Swaths, Surge, Drainage &amp; OpenStreetMap Assets
                </span>
              </div>

              <MapContainer
                spatialLayers={riskData ? riskData.spatial_layers : null}
                infrastructureAssets={infrastructureAssets}
                center={cyclone ? [cyclone.landfall_lon, cyclone.landfall_lat] : [80.5, 15.8]}
                zoom={cyclone && cyclone.peak_wind_kmh > 150 ? 8.0 : 7.5}
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
                    <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Deterministic Synthesis Grounded
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                      Provider: {advisory.ai_provider}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                  {advisory.authority_guidance_en}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: RAINFALL DAMAGE PATHWAYS & ARTERIAL WASHOUTS */}
        {activeTab === "rainfall" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <CloudRain className="w-5 h-5" />
                <span>Localized Rainfall Accumulation &amp; Drainage Bottleneck Modeling</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Evaluates 24-hour convective rainband precipitation coupled with Google Earth Engine (SRTM 30m) coastal slopes.
                Low-elevation delta corridors with flat terrain slopes (&lt;0.5 m/km) create acute pluvial drainage chokepoints and arterial highway culvert breach risks.
              </p>
            </div>

            {/* Arterial Corridors Washout Status Cards */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-purple-400" />
                <span>Critical Highway &amp; Evacuation Corridors Exposure</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rainfall?.arterial_corridors.map((c) => (
                  <div
                    key={c.corridor_id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      c.washout_risk
                        ? "bg-rose-950/30 border-rose-800/60"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-white">{c.corridor_name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          District: {c.district} • Distance to Landfall: {c.distance_km} km
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          c.washout_risk
                            ? "bg-rose-900/80 text-rose-200 border border-rose-700"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {c.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-500 text-[10px] block">PREDICTED 24H RAINFALL</span>
                        <span className="text-purple-300 font-bold">{c.local_rainfall_mm} mm</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">CULVERTS MONITORED</span>
                        <span className="text-slate-200 font-bold">{c.culverts_count} culvert points</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="font-semibold text-slate-200">Recommended Action: </span>
                      {c.recommended_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* District Rainfall Vulnerability Table */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-400" />
                <span>District Pluvial Drainage Vulnerability Index (DVI)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Distance to Core</th>
                      <th className="py-2.5 px-3">24h Rain (mm)</th>
                      <th className="py-2.5 px-3">Mean Elevation</th>
                      <th className="py-2.5 px-3">Coastal Slope</th>
                      <th className="py-2.5 px-3">Drainage Vulnerability (DVI)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {rainfall?.district_evaluations.map((d) => (
                      <tr key={d.district} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{d.district}</td>
                        <td className="py-2.5 px-3 text-slate-300">{d.distance_to_core_km} km</td>
                        <td className="py-2.5 px-3 font-bold text-purple-300">{d.predicted_24h_rainfall_mm} mm</td>
                        <td className="py-2.5 px-3 text-slate-400">{d.mean_elevation_m}m MSL</td>
                        <td className="py-2.5 px-3 text-slate-400">{d.coastal_slope_m_per_km} m/km</td>
                        <td className="py-2.5 px-3 font-bold">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  d.drainage_vulnerability_index > 0.6
                                    ? "bg-rose-500"
                                    : d.drainage_vulnerability_index > 0.35
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${d.drainage_vulnerability_index * 100}%` }}
                              />
                            </div>
                            <span>{d.drainage_vulnerability_index}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              d.pluvial_status.includes("CRITICAL")
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : d.pluvial_status.includes("MODERATE")
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            }`}
                          >
                            {d.pluvial_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANTICIPATORY INFRASTRUCTURE HARDENING */}
        {activeTab === "hardening" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Anticipatory Critical Infrastructure Hardening Protocols</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Shifting disaster response from post-landfall repairs to pre-landfall structural hardening protects high-capital assets
                from irreversible seawater and wind damage. The protocols below are calibrated against deterministic wind and surge reaches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Power Grid Hardening Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-slate-800 pb-2">
                  <Zap className="w-4 h-4" />
                  <span>Power Grid &amp; Substations</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">1.</span>
                    <span><b>Islanding Protocol:</b> Schedule sequential de-energization of 33kV coastal feeders 4 hours prior to landfall to avert explosive short-circuits.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">2.</span>
                    <span><b>Transformer Elevation:</b> Secure control panels and auxiliary battery banks above 3.5m surge baseline using elevated plinths.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">3.</span>
                    <span><b>Guy-Wire Tensioning:</b> Conduct tension testing on transmission towers within the 50-kt wind cone to prevent structural harmonic collapse.</span>
                  </li>
                </ul>
              </div>

              {/* Arterial Highways & Drainage Hardening Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
                  <Navigation className="w-4 h-4" />
                  <span>Arterial Roads &amp; Drainage</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <span><b>De-watering Prepositioning:</b> Deploy high-volume mobile diesel tractor pumps (5000 GPM) at identified NH-16 culvert choke points.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <span><b>Underpass Barricading:</b> Close coastal railway underpasses and low-pass causeways 8 hours pre-landfall with lighted barriers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">3.</span>
                    <span><b>Emergency Transit Arterials:</b> Keep inland elevated bypasses exclusively cleared for ambulances, evacuation fleets, and relief logistics.</span>
                  </li>
                </ul>
              </div>

              {/* Medical Shelters & Trauma Facilities Card */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm border-b border-slate-800 pb-2">
                  <Building2 className="w-4 h-4" />
                  <span>Medical Shelters &amp; Hospitals</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">1.</span>
                    <span><b>72h Auxiliary Power Fuel:</b> Stockpile diesel reserves in watertight elevated storage tanks to sustain critical ICU and ventilator units.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">2.</span>
                    <span><b>Vertical Evacuation:</b> Transfer ground-floor emergency wards and pharmaceutical stores to 1st/2nd floor facilities.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">3.</span>
                    <span><b>Flood-Compromised Locks:</b> Lock shelters located within active surge envelopes; direct evacuees strictly to certified elevated MPCS centers.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PARAMETRIC DISASTER INSURANCE LIQUIDITY */}
        {activeTab === "parametric" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <DollarSign className="w-5 h-5" />
                  <span>Bay of Bengal Anticipatory Parametric Disaster Insurance Facility</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold">
                  {insurance?.execution_summary.payout_status}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Parametric insurance replaces post-disaster loss adjustments with verified, deterministic physical triggers.
                Payouts are automatically wired <b>pre-landfall</b> to municipal accounts to fund evacuation bus fleets, potable water staging, and grid restoration teams.
              </p>
            </div>

            {/* Insurance Facility Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">TOTAL FACILITY POOL</span>
                <span className="text-base font-bold text-white">₹{insurance?.facility_metadata.total_facility_pool_inr_cr} Crore</span>
                <span className="text-[10px] text-slate-400 block">${insurance?.facility_metadata.total_facility_pool_usd_m}M USD Equivalent</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">TOTAL PRE-LANDFALL RELEASE</span>
                <span className="text-base font-bold text-emerald-400">₹{insurance?.execution_summary.total_released_inr_cr} Crore</span>
                <span className="text-[10px] text-emerald-300 block">{insurance?.execution_summary.payout_percentage}% Facility Drawdown</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">ACTIVE TRIGGERS VERIFIED</span>
                <span className="text-base font-bold text-cyan-300">{insurance?.execution_summary.active_triggers_count} / 4 Triggers</span>
                <span className="text-[10px] text-slate-400 block">Deterministic Sensor Verified</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">PRIMARY BENEFICIARY</span>
                <span className="text-base font-bold text-rose-400 truncate block">
                  {insurance?.execution_summary.priority_beneficiary}
                </span>
                <span className="text-[10px] text-slate-400 block">Priority DDMA Staging Pool</span>
              </div>
            </div>

            {/* Parametric Triggers Evaluation Ledger */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Trigger Threshold Evaluation Ledger</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insurance?.triggers.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      t.status === "TRIGGERED"
                        ? "bg-emerald-950/20 border-emerald-800/50"
                        : "bg-slate-900/60 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">{t.id}</span>
                        <h4 className="font-bold text-sm text-white">{t.name}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          t.status === "TRIGGERED"
                            ? "bg-emerald-900/80 text-emerald-200 border border-emerald-700"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-500 text-[10px] block">POLICY TRIGGER RULE</span>
                        <span className="text-slate-300 font-medium">{t.condition}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">MEASURED VALUE</span>
                        <span className="text-cyan-300 font-bold">{t.measured_value}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Allocated: ₹{t.allocated_cr} Cr</span>
                      <span className="text-emerald-400 font-bold">Released: ₹{t.released_cr} Cr</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      <b className="text-slate-300">Earmarked:</b> {t.earmarked_for}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Beneficiary Municipal Disbursements Table */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Immediate Pre-Landfall Municipal Disbursements</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Beneficiary Entity</th>
                      <th className="py-2.5 px-3">Share</th>
                      <th className="py-2.5 px-3">Amount Released</th>
                      <th className="py-2.5 px-3">Operational Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {insurance?.disbursements.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{d.beneficiary}</td>
                        <td className="py-2.5 px-3 text-slate-300">{d.share_percent}%</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">₹{d.amount_cr} Crore</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">{d.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUTOMATED EARLY-WARNING DISPATCHES (CAP v1.2) */}
        {activeTab === "dispatches" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                  <Radio className="w-5 h-5" />
                  <span>Automated Early-Warning Advisory Multi-Channel Dispatches</span>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                  ITU / WMO Common Alerting Protocol (CAP v1.2)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automates instant dissemination of deterministic advisory packages across municipal PA siren networks,
                cell broadcast 2G SMS, SDMA command webhooks, and citizen messaging channels.
              </p>
            </div>

            {/* Multi-Channel Dispatch Feeds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dispatches?.channels.map((ch) => (
                <div key={ch.channel_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{ch.channel_name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Protocol: {ch.protocol}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      {ch.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 block uppercase">TARGET BROADCAST ENDPOINT</span>
                    <span className="text-slate-200 font-semibold">{ch.target}</span>
                  </div>

                  <div className="text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 space-y-1.5">
                    <span className="text-[10px] text-cyan-400 block uppercase">TRANSMISSION PAYLOAD</span>
                    <pre className="text-[11px] whitespace-pre-wrap text-slate-300 font-mono overflow-x-auto">
                      {JSON.stringify(ch.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            {/* Standard Common Alerting Protocol (CAP v1.2) XML Feed Viewer */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Standard CAP v1.2 XML Broadcast Feed
                  </h3>
                </div>
                <button
                  onClick={() => dispatches && copyToClipboard(dispatches.cap_xml, "CAP XML")}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy XML Payload</span>
                </button>
              </div>

              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto leading-relaxed">
                {dispatches?.cap_xml || "Loading CAP feed..."}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
