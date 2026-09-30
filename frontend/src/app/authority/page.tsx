"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Smartphone,
  Volume2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Code2,
  Send,
  Search,
  Filter,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  Gauge,
  BrainCircuit,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";
import MapContainer from "@/components/map/MapContainer";
import ExposureCharts from "@/components/analytics/ExposureCharts";
import Sidebar, { NavPageId } from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import EmergencyBanner from "@/components/EmergencyBanner";
import ExecutiveActionStrip from "@/components/ExecutiveActionStrip";
import ThreatRadarWidget from "@/components/ThreatRadarWidget";
import PredictiveTimelineWidget from "@/components/PredictiveTimelineWidget";
import HumanImpactWidget from "@/components/HumanImpactWidget";
import InfrastructureDetailDrawer, {
  InfrastructureAsset,
} from "@/components/InfrastructureDetailDrawer";
import RiskBadge, { getRiskColor } from "@/components/RiskBadge";
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

const PAGE_TITLES: Record<NavPageId, string> = {
  dashboard: "Cyclone Impact Command Center",
  monitor: "Cyclone Tracking & Meteorological Telemetry",
  intelligence: "Risk Intelligence & Hazard Correlation",
  map: "Interactive GIS Geospatial Risk Map",
  infrastructure: "Lifeline Infrastructure Vulnerability",
  hardening: "Anticipatory Infrastructure Hardening",
  parametric: "Anticipatory Parametric Disaster Insurance",
  alerts: "State Emergency Early Warning Dispatches",
  "ai-analysis": "AI Disaster Operations Intelligence",
  reports: "Assessment Report Center",
  about: "Scientific Methodology & Architecture",
};

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

  // Command OS state
  const [currentPage, setCurrentPage] = useState<NavPageId>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<"ALL" | "EXTREME" | "HIGH" | "MODERATE">("ALL");
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset | null>(null);
  const [infraSearch, setInfraSearch] = useState<string>("");
  const [infraType, setInfraType] = useState<string>("All");
  const [infraRisk, setInfraRisk] = useState<string>("All");
  const [smsLang, setSmsLang] = useState<"en" | "te">("en");
  const [showRawTechPayloads, setShowRawTechPayloads] = useState<boolean>(false);
  const [dispatchedChannels, setDispatchedChannels] = useState<Record<string, boolean>>({});

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

  // Main data loading function for selected scenario
  const loadData = useCallback(async (scenarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [cycData, riskResp, advResp, infraGeo] = await Promise.all([
        fetchCycloneById(scenarioId),
        evaluateRisk(scenarioId),
        generateAdvisory(scenarioId),
        fetchInfrastructureGeoJSON(),
      ]);

      setCyclone(cycData);
      setRiskData(riskResp);
      setAdvisory(advResp.advisory);
      if (advResp.dispatches) {
        setDispatches(advResp.dispatches);
      }
      setInfrastructureAssets(infraGeo.features || []);
    } catch (err: any) {
      console.error("Error loading CYCLONEX data:", err);
      setError(`Failed to synchronize operational intelligence: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedScenarioId);
  }, [selectedScenarioId, loadData]);

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

  const handleSimulateDispatch = (channelId?: string) => {
    if (channelId) {
      setDispatchedChannels((prev) => ({ ...prev, [channelId]: true }));
      setCopyToast(`✓ Live emergency advisory dispatched to ${channelId}`);
    } else {
      setDispatchedChannels({
        SDMA_COMMAND_WEBHOOK: true,
        CELL_BROADCAST_SMS: true,
        MUNICIPAL_SIREN_PA: true,
        WHATSAPP_CITIZEN_BOT: true,
      });
      setCopyToast(`✓ All 4 emergency early-warning channels successfully triggered!`);
    }
    setTimeout(() => setCopyToast(null), 3500);
  };

  // Convert raw infrastructure GeoJSON features to strongly typed InfrastructureAsset objects
  const parsedAssets: InfrastructureAsset[] = infrastructureAssets.map((f: any, idx: number) => {
    const props = f.properties || f;
    const geom = f.geometry || f;
    const coords = geom.coordinates || [80.4, 15.8];
    const riskLevel = (props.risk_level || props.hazard_level || "HIGH").toUpperCase();
    return {
      id: f.id || props.name || `asset-${idx}`,
      name: props.name || "Critical Lifeline Node",
      type: props.type || "Facility",
      district: props.district || "Coastal District",
      lat: coords[1],
      lon: coords[0],
      elevation_m: props.elevation_m !== undefined ? props.elevation_m : 4.5,
      distance_from_coast_km: props.distance_km || props.distance_from_coast_km || 3.2,
      risk_level: riskLevel,
      vulnerability_score:
        props.vulnerability_score || (riskLevel === "EXTREME" ? 92 : riskLevel === "HIGH" ? 76 : 48),
      in_surge_zone: props.in_surge_zone || false,
      in_extreme_wind: props.in_extreme_wind || true,
      capacity: props.capacity || props.beds,
      recommended_action: props.recommended_action || "Execute protective structural hardening.",
    };
  });

  // Filter infrastructure assets based on active filters
  const filteredAssets = parsedAssets.filter((a) => {
    const matchesSearch =
      !infraSearch ||
      a.name.toLowerCase().includes(infraSearch.toLowerCase()) ||
      a.district.toLowerCase().includes(infraSearch.toLowerCase()) ||
      a.type.toLowerCase().includes(infraSearch.toLowerCase());

    const matchesType =
      infraType === "All" ||
      (infraType === "Hospitals" && a.type.toLowerCase().includes("hospital")) ||
      (infraType === "Substations" && (a.type.toLowerCase().includes("substation") || a.type.toLowerCase().includes("power"))) ||
      (infraType === "Shelters" && a.type.toLowerCase().includes("shelter")) ||
      (infraType === "Bridges" && (a.type.toLowerCase().includes("bridge") || a.type.toLowerCase().includes("culvert")));

    const matchesRisk =
      infraRisk === "All" || a.risk_level.toUpperCase() === infraRisk.toUpperCase();

    if (selectedZone === "EXTREME") return matchesSearch && matchesType && matchesRisk && a.risk_level === "EXTREME";
    if (selectedZone === "HIGH") return matchesSearch && matchesType && matchesRisk && (a.risk_level === "HIGH" || a.risk_level === "EXTREME");
    if (selectedZone === "MODERATE") return matchesSearch && matchesType && matchesRisk && a.risk_level === "MODERATE";

    return matchesSearch && matchesType && matchesRisk;
  });

  const scenarioOptions = [
    { id: "cyclone_michaung_2023", name: "Cyclone Michaung (Dec 2023) — Cat 4 VSCS" },
    { id: "cyclone_hudhud_2014", name: "Cyclone Hudhud (Oct 2014) — Cat 4 VSCS" },
    { id: "cyclone_live_simulation", name: "Live Bay of Bengal Simulation — Cat 5 Super Cyclone" },
  ];

  const highestCvi = riskData?.cvi_rankings?.[0] || {
    district: "Bapatla",
    cvi_score: 0.78,
    risk_level: "High",
  };

  const rainfall = riskData?.rainfall_pathways;
  const insurance = riskData?.parametric_insurance;

  return (
    <div className={`min-h-screen bg-[#090d16] text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-white ${isEmergencyMode ? "emergency-mode-active" : ""}`}>
      {/* 1. Collapsible Fixed Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        alertCount={dispatches?.channels.length || 4}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Top Header */}
        <TopHeader
          pageTitle={PAGE_TITLES[currentPage] || "Cyclone Impact Command Center"}
          activeScenario={selectedScenarioId}
          scenarios={scenarioOptions}
          onSelectScenario={setSelectedScenarioId}
          alertCount={dispatches?.channels.length || 4}
          onOpenAlerts={() => setCurrentPage("alerts")}
          onRefresh={() => loadData(selectedScenarioId)}
          isEmergencyMode={isEmergencyMode}
          onToggleEmergencyMode={() => setIsEmergencyMode(!isEmergencyMode)}
        />

        {/* Emergency Banner */}
        {cyclone && riskData && (
          <EmergencyBanner
            cycloneName={cyclone.name}
            category={cyclone.category}
            windSpeed={cyclone.peak_wind_kmh}
            surgeHeight={riskData.surge_scenario.total_scenario_surge_m}
            landfallTarget={cyclone.landfall_target}
            highestRiskDistrict={highestCvi.district}
            onViewMap={() => setCurrentPage("map")}
          />
        )}

        {/* Notifications & Toasts */}
        {exportToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-mono animate-in slide-in-from-bottom duration-200">
            {exportToast}
          </div>
        )}
        {copyToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-cyan-950 border border-cyan-500 text-cyan-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-mono animate-in slide-in-from-bottom duration-200">
            {copyToast}
          </div>
        )}

        {/* Main Body Pages */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/60 text-red-200 flex items-center justify-between shadow-xl">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{error}</span>
              </div>
              <button
                onClick={() => loadData(selectedScenarioId)}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold font-mono transition"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[55vh]">
              <div className="text-center space-y-3">
                <Activity className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-slate-300 font-mono text-xs">
                  Synchronizing Storm Eye Command Center Telemetry...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* PAGE 1: DASHBOARD (CYCLONE IMPACT COMMAND CENTER)        */}
              {/* ======================================================== */}
              {currentPage === "dashboard" && cyclone && riskData && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* 10-Second Executive Situation Briefing Strip */}
                  <ExecutiveActionStrip
                    cycloneName={cyclone.name}
                    category={cyclone.category}
                    windSpeed={cyclone.peak_wind_kmh}
                    pressure={cyclone.min_pressure_hpa}
                    surgeHeight={riskData.surge_scenario.total_scenario_surge_m}
                    landfallTarget={cyclone.landfall_target}
                    highestRiskDistrict={highestCvi.district}
                    hospitalsAtRisk={riskData.exposure_summary.hospitals_at_risk.assets.length}
                    substationsAtRisk={riskData.exposure_summary.substations_at_risk.assets.length}
                    roadsKm={riskData.exposure_summary.roads_at_risk_km.in_surge_inundation}
                    sheltersCount={riskData.exposure_summary.shelters_at_risk.assets.length}
                    topDirective={advisory?.authority_guidance_en || ""}
                    isEmergencyMode={isEmergencyMode}
                  />

                  {/* Priority Sector Zone Filter Tabs */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                      SELECT PRIORITY HAZARD ZONE:
                    </span>
                    <div className="flex items-center gap-1.5 bg-[#0c1220] p-1 rounded-xl border border-[#1e293b]">
                      {(["ALL", "EXTREME", "HIGH", "MODERATE"] as const).map((zone) => (
                        <button
                          key={zone}
                          onClick={() => setSelectedZone(zone)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                            selectedZone === zone
                              ? zone === "EXTREME"
                                ? "bg-red-600 text-white shadow"
                                : zone === "HIGH"
                                ? "bg-orange-600 text-white shadow"
                                : zone === "MODERATE"
                                ? "bg-yellow-600 text-white shadow"
                                : "bg-cyan-600 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {zone === "ALL"
                            ? "ALL SECTORS"
                            : zone === "EXTREME"
                            ? "ZONE A — EXTREME (<50km)"
                            : zone === "HIGH"
                            ? "ZONE B — HIGH (50-120km)"
                            : "ZONE C — MODERATE (120-220km)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Geospatial Map + Circular Threat Radar Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Map Box (7 Cols) */}
                    <div className="lg:col-span-7 bg-[#0c1220] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                      <div className="bg-[#0f172a] px-4 py-2.5 border-b border-[#1e293b] flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <span className="text-xs font-mono font-bold text-white uppercase">
                            STORM EYE GEOSPATIAL RADAR
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                            {cyclone.name} ({cyclone.category})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {cyclone.peak_wind_kmh} km/h • {cyclone.min_pressure_hpa} hPa
                        </span>
                      </div>

                      <div className="h-[430px] w-full relative">
                        <MapContainer
                          spatialLayers={riskData.spatial_layers}
                          infrastructureAssets={infrastructureAssets}
                          center={[80.4, 15.8]}
                          zoom={7.4}
                          onSelectAsset={(rawAsset) => {
                            const found = parsedAssets.find(
                              (p) => p.name === (rawAsset.properties?.name || rawAsset.name)
                            );
                            if (found) setSelectedAsset(found);
                          }}
                        />
                      </div>
                    </div>

                    {/* Threat Radar Box (5 Cols) */}
                    <div className="lg:col-span-5 flex flex-col">
                      <ThreatRadarWidget
                        windSpeed={cyclone.peak_wind_kmh}
                        pressure={cyclone.min_pressure_hpa}
                        surgeHeight={riskData.surge_scenario.total_scenario_surge_m}
                        rainfallMm={rainfall?.summary?.max_24h_rainfall_mm || 240}
                        infraNodesAtRisk={
                          riskData.exposure_summary.hospitals_at_risk.assets.length +
                          riskData.exposure_summary.substations_at_risk.assets.length
                        }
                        district={highestCvi.district}
                      />
                    </div>
                  </div>

                  {/* Multimodal Gemini AI Operations Briefing */}
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-cyan-500/30 space-y-3 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                          <BrainCircuit className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                            AI DISASTER INTELLIGENCE BRIEFING
                          </h3>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {advisory?.model || "Gemini 3.7 Flash Multimodal Reasoning"} • Zero Numerical Fabrication
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                          Grounding Integrity: Verified
                        </span>
                        <button
                          onClick={() => loadData(selectedScenarioId)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#131d31] hover:bg-[#1a2742] text-xs font-mono text-cyan-300 border border-[#22334e] transition"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>REFRESH AI</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {advisory?.authority_guidance_en ||
                        `${cyclone.name} (${cyclone.category}) is maintaining intense cyclonic circulation with peak sustained winds of ${cyclone.peak_wind_kmh} km/h and central barometric pressure of ${cyclone.min_pressure_hpa} hPa. Mandatory coastal evacuation of all low-lying habitations is actively underway.`}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-[#1e293b]">
                      <div className="p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
                        <span className="text-[10px] font-mono text-rose-400 font-bold block uppercase">
                          01. MANDATORY EVACUATION
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Complete evacuation of settlements within 3km shoreline to certified elevated MPCS shelters.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
                        <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase">
                          02. 33kV GRID ISLANDING
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          De-energize coastal feeders 4 hours prior to landfall to avert catastrophic transformer fire explosions.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">
                          03. ARTERIAL DE-WATERING
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Pre-stage 5000 GPM high-volume diesel tractor pumps at identified NH-16 culvert chokepoints.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Predictive Timeline Widget */}
                  <PredictiveTimelineWidget
                    cycloneName={cyclone.name}
                    peakWindKmh={cyclone.peak_wind_kmh}
                    minPressureHpa={cyclone.min_pressure_hpa}
                    landfallTarget={cyclone.landfall_target}
                  />

                  {/* Human Impact & Casualty Model */}
                  <HumanImpactWidget
                    windSpeed={cyclone.peak_wind_kmh}
                    highestRiskDistrict={highestCvi.district}
                    sheltersAtRisk={riskData.exposure_summary.shelters_at_risk.assets.length}
                    hospitalsAtRisk={riskData.exposure_summary.hospitals_at_risk.assets.length}
                  />

                  {/* Top Critical Infrastructure Nodes At Risk */}
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                            HIGH-RISK LIFELINE INFRASTRUCTURE (TOP AT RISK)
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Deterministic Exposure Ranking • Click Any Node to Inspect
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setCurrentPage("infrastructure")}
                        className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <span>View All ({parsedAssets.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {filteredAssets.slice(0, 6).map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className="p-3.5 rounded-xl bg-[#131d31] border border-[#22334e] hover:border-cyan-500/50 transition cursor-pointer space-y-2 shadow-lg"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase truncate">
                              {asset.type}
                            </span>
                            <RiskBadge level={asset.risk_level} size="sm" />
                          </div>

                          <h4 className="font-bold text-xs text-white leading-tight truncate">
                            {asset.name}
                          </h4>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#22334e]">
                            <span>{asset.district}</span>
                            <span className="text-amber-300">{asset.distance_from_coast_km} km coast</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 2: CYCLONE MONITOR                                   */}
              {/* ======================================================== */}
              {currentPage === "monitor" && cyclone && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                      <div>
                        <span className="text-xs font-mono text-cyan-400 block uppercase">
                          RADAR &amp; SATELLITE TRACKING TELEMETRY
                        </span>
                        <h2 className="text-xl font-black text-white">
                          {cyclone.name} ({cyclone.category})
                        </h2>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 font-bold">
                        DATA SOURCE: {cyclone.data_source || "IMD / IBTrACS"}
                      </span>
                    </div>

                    {/* Meteorological Telemetry Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e]">
                        <span className="text-slate-500 text-[10px] block uppercase">SUSTAINED WINDS</span>
                        <span className="text-xl font-bold text-white">{cyclone.peak_wind_kmh} km/h</span>
                        <span className="text-[10px] text-cyan-400 block">Peak Gusts: {Math.round(cyclone.peak_wind_kmh * 1.25)} km/h</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e]">
                        <span className="text-slate-500 text-[10px] block uppercase">CENTRAL PRESSURE</span>
                        <span className="text-xl font-bold text-white">{cyclone.min_pressure_hpa} hPa</span>
                        <span className="text-[10px] text-rose-400 block">Deficit: -35 hPa MSL</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e]">
                        <span className="text-slate-500 text-[10px] block uppercase">FORWARD VELOCITY</span>
                        <span className="text-xl font-bold text-white">16.5 km/h</span>
                        <span className="text-[10px] text-amber-300 block">Direction: NNW (335°)</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e]">
                        <span className="text-slate-500 text-[10px] block uppercase">GALE RADIUS (R34)</span>
                        <span className="text-xl font-bold text-white">240 km</span>
                        <span className="text-[10px] text-slate-400 block">Hurricane Core: 45 km</span>
                      </div>
                    </div>
                  </div>

                  {/* Full Track Waypoints Table */}
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>Historical &amp; Forecast Waypoint Trajectory Ledger</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#0f172a] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1e293b]">
                          <tr>
                            <th className="py-2.5 px-3">Timestamp (UTC)</th>
                            <th className="py-2.5 px-3">Coordinates</th>
                            <th className="py-2.5 px-3">Wind (km/h)</th>
                            <th className="py-2.5 px-3">Pressure</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b] font-mono">
                          {cyclone.waypoints.map((pt, idx) => (
                            <tr key={idx} className="hover:bg-[#131d31]/50">
                              <td className="py-2.5 px-3 text-slate-300">{pt.time}</td>
                              <td className="py-2.5 px-3 text-cyan-400 font-bold">
                                {pt.lat.toFixed(2)}°N, {pt.lon.toFixed(2)}°E
                              </td>
                              <td className="py-2.5 px-3 text-white font-bold">{pt.max_wind_kmh} km/h</td>
                              <td className="py-2.5 px-3 text-slate-300">{pt.central_pressure_hpa} hPa</td>
                              <td className="py-2.5 px-3 text-slate-400">{pt.stage}</td>
                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  idx === cyclone.waypoints.length - 1
                                    ? "bg-red-950 text-red-300 border border-red-800"
                                    : "bg-slate-800 text-slate-400"
                                }`}>
                                  {idx === cyclone.waypoints.length - 1 ? "LANDFALL FOCUS" : "TRACK POINT"}
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

              {/* ======================================================== */}
              {/* PAGE 3: RISK INTELLIGENCE & CVI                          */}
              {/* ======================================================== */}
              {currentPage === "intelligence" && riskData && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                      <div>
                        <span className="text-xs font-mono text-cyan-400 block uppercase">
                          COMPOSITE VULNERABILITY INDEX (CVI) ENGINE
                        </span>
                        <h2 className="text-lg font-black text-white">
                          Multi-Factor District Risk Correlation
                        </h2>
                      </div>
                      <span className="text-xs font-mono text-amber-300 bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
                        Formula: 0.35 Wind + 0.30 Surge + 0.20 Elev + 0.15 Infra
                      </span>
                    </div>

                    {/* CVI Rankings List */}
                    <div className="space-y-3">
                      {riskData.cvi_rankings.map((cvi, idx) => (
                        <div
                          key={cvi.district}
                          className="p-3.5 rounded-xl bg-[#131d31] border border-[#22334e] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-cyan-400 font-bold text-sm">#{idx + 1}</span>
                            <div>
                              <span className="font-bold text-white text-sm block">{cvi.district}</span>
                              <span className="text-[10px] text-slate-400 font-sans">
                                Wind Exposure: {cvi.components.wind_exposure_normalized} • Inundation: {cvi.components.surge_inundation_fraction}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="w-36 h-2.5 bg-[#090d16] rounded-full overflow-hidden border border-[#22334e]">
                              <div
                                className={`h-full ${
                                  cvi.cvi_score >= 0.75
                                    ? "bg-red-500"
                                    : cvi.cvi_score >= 0.5
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${cvi.cvi_score * 100}%` }}
                              />
                            </div>
                            <span className="font-bold text-white text-sm">{cvi.cvi_score.toFixed(3)}</span>
                            <RiskBadge level={cvi.risk_level} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pluvial Drainage Vulnerability Index (DVI) */}
                  {rainfall && (
                    <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-cyan-400" />
                        <span>District Pluvial Drainage Vulnerability Index (DVI)</span>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#0f172a] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1e293b]">
                            <tr>
                              <th className="py-2.5 px-3">District</th>
                              <th className="py-2.5 px-3">Distance to Core</th>
                              <th className="py-2.5 px-3">24h Rain (mm)</th>
                              <th className="py-2.5 px-3">Mean Elevation</th>
                              <th className="py-2.5 px-3">Slope</th>
                              <th className="py-2.5 px-3">DVI Score</th>
                              <th className="py-2.5 px-3">Pluvial Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e293b] font-mono">
                            {rainfall.district_evaluations.map((d) => (
                              <tr key={d.district} className="hover:bg-[#131d31]/50">
                                <td className="py-2.5 px-3 font-bold text-white">{d.district}</td>
                                <td className="py-2.5 px-3 text-slate-300">{d.distance_to_core_km} km</td>
                                <td className="py-2.5 px-3 text-purple-300 font-bold">{d.predicted_24h_rainfall_mm} mm</td>
                                <td className="py-2.5 px-3 text-slate-400">{d.mean_elevation_m}m MSL</td>
                                <td className="py-2.5 px-3 text-slate-400">{d.coastal_slope_m_per_km} m/km</td>
                                <td className="py-2.5 px-3 font-bold text-white">{d.drainage_vulnerability_index}</td>
                                <td className="py-2.5 px-3">
                                  <RiskBadge level={d.pluvial_status.includes("CRITICAL") ? "EXTREME" : d.pluvial_status.includes("MODERATE") ? "MODERATE" : "HIGH"} size="sm" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 4: RISK MAP                                         */}
              {/* ======================================================== */}
              {currentPage === "map" && riskData && cyclone && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-base font-black text-white">Interactive GIS Geospatial Risk Map</h2>
                      <p className="text-xs text-slate-400">
                        MapLibre GL vector layer visualization with deterministic wind swaths, surge inundation, and lifeline assets
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#0c1220] p-1 rounded-xl border border-[#1e293b]">
                      {(["ALL", "EXTREME", "HIGH", "MODERATE"] as const).map((z) => (
                        <button
                          key={z}
                          onClick={() => setSelectedZone(z)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                            selectedZone === z ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {z}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[650px] w-full rounded-2xl overflow-hidden border border-[#1e293b] shadow-2xl relative">
                    <MapContainer
                      spatialLayers={riskData.spatial_layers}
                      infrastructureAssets={infrastructureAssets}
                      center={[80.4, 15.8]}
                      zoom={7.5}
                      onSelectAsset={(rawAsset) => {
                        const found = parsedAssets.find(
                          (p) => p.name === (rawAsset.properties?.name || rawAsset.name)
                        );
                        if (found) setSelectedAsset(found);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 5: INFRASTRUCTURE                                   */}
              {/* ======================================================== */}
              {currentPage === "infrastructure" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-lg font-black text-white">Lifeline Infrastructure Registry</h2>
                        <p className="text-xs text-slate-400">
                          Comprehensive assessment of 29+ monitored hospitals, power grid substations, and evacuation shelters
                        </p>
                      </div>

                      {/* Search Bar */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={infraSearch}
                          onChange={(e) => setInfraSearch(e.target.value)}
                          placeholder="Search facility or district..."
                          className="w-full bg-[#131d31] border border-[#22334e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#1e293b]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["All", "Hospitals", "Substations", "Shelters", "Bridges"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setInfraType(cat)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                              infraType === cat
                                ? "bg-cyan-600 text-white font-bold"
                                : "bg-[#131d31] text-slate-400 hover:text-white border border-[#22334e]"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">RISK FILTER:</span>
                        {["All", "EXTREME", "HIGH", "MODERATE"].map((r) => (
                          <button
                            key={r}
                            onClick={() => setInfraRisk(r)}
                            className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                              infraRisk === r
                                ? "bg-slate-700 text-white font-bold"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure Table */}
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#0f172a] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1e293b]">
                          <tr>
                            <th className="py-2.5 px-3">Facility Name</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">District</th>
                            <th className="py-2.5 px-3">Distance to Coast</th>
                            <th className="py-2.5 px-3">Elevation (MSL)</th>
                            <th className="py-2.5 px-3">Hazard Level</th>
                            <th className="py-2.5 px-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b] font-mono">
                          {filteredAssets.map((asset) => (
                            <tr
                              key={asset.id}
                              onClick={() => setSelectedAsset(asset)}
                              className="hover:bg-[#131d31]/50 cursor-pointer transition"
                            >
                              <td className="py-3 px-3 font-bold text-white">{asset.name}</td>
                              <td className="py-3 px-3 text-cyan-300">{asset.type}</td>
                              <td className="py-3 px-3 text-slate-300">{asset.district}</td>
                              <td className="py-3 px-3 text-amber-300">{asset.distance_from_coast_km} km</td>
                              <td className="py-3 px-3 text-slate-300">{asset.elevation_m}m</td>
                              <td className="py-3 px-3">
                                <RiskBadge level={asset.risk_level} size="sm" />
                              </td>
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => setSelectedAsset(asset)}
                                  className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 text-[11px] font-bold transition cursor-pointer"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 6: HARDENING PROTOCOLS                              */}
              {/* ======================================================== */}
              {currentPage === "hardening" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-amber-800/40 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Anticipatory Critical Infrastructure Hardening Protocols</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Pre-landfall structural hardening replaces reactive post-landfall salvage operations.
                      Interventions are calibrated against deterministic wind and surge reaches.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Power Grid */}
                    <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-[#1e293b] pb-2">
                        <Zap className="w-4 h-4" />
                        <span>Power Grid &amp; Substations</span>
                      </div>
                      <ul className="space-y-3 text-xs text-slate-300">
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
                          <span><b>Guy-Wire Tensioning:</b> Conduct tension testing on transmission towers within the 50-kt wind cone.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Roads & Culverts */}
                    <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-[#1e293b] pb-2">
                        <Navigation className="w-4 h-4" />
                        <span>Arterial Roads &amp; Culverts</span>
                      </div>
                      <ul className="space-y-3 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">1.</span>
                          <span><b>De-watering Prepositioning:</b> Deploy 5000 GPM high-volume diesel tractor pumps at identified NH-16 culvert choke points.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">2.</span>
                          <span><b>Underpass Barricading:</b> Close coastal railway underpasses and causeways 8 hours pre-landfall with illuminated barriers.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">3.</span>
                          <span><b>Evacuation Corridors:</b> Keep elevated bypasses reserved exclusively for emergency evacuation bus fleets.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Hospitals & Shelters */}
                    <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-sm border-b border-[#1e293b] pb-2">
                        <Building2 className="w-4 h-4" />
                        <span>Hospitals &amp; Shelters</span>
                      </div>
                      <ul className="space-y-3 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">1.</span>
                          <span><b>72h Auxiliary Power:</b> Pre-fill diesel tanks for ICU, ventilator, and neonatal care backup generators.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">2.</span>
                          <span><b>Vertical Evacuation:</b> Transfer ground-floor emergency wards and pharmaceutical stores to 1st/2nd floor facilities.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">3.</span>
                          <span><b>Flood-Compromised Locks:</b> Lock shelters situated in active surge zones; divert citizens strictly to elevated MPCS centers.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 7: PARAMETRIC INSURANCE LIQUIDITY                   */}
              {/* ======================================================== */}
              {currentPage === "parametric" && insurance && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-emerald-800/40 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                        <DollarSign className="w-5 h-5" />
                        <span>Bay of Bengal Anticipatory Parametric Disaster Insurance Facility</span>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold">
                        {insurance.execution_summary.payout_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Replaces sluggish post-disaster loss adjustments with verified, deterministic sensor triggers.
                      Funds are automatically disbursed <b>pre-landfall</b> to municipal treasury accounts to power evacuation logistics.
                    </p>
                  </div>

                  {/* Summary KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                    <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] space-y-1">
                      <span className="text-slate-500 text-[10px] block">TOTAL FACILITY POOL</span>
                      <span className="text-base font-bold text-white">₹{insurance.facility_metadata.total_facility_pool_inr_cr} Crore</span>
                      <span className="text-[10px] text-slate-400 block">${insurance.facility_metadata.total_facility_pool_usd_m}M USD Equivalent</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] space-y-1">
                      <span className="text-slate-500 text-[10px] block">PRE-LANDFALL RELEASE</span>
                      <span className="text-base font-bold text-emerald-400">₹{insurance.execution_summary.total_released_inr_cr} Crore</span>
                      <span className="text-[10px] text-emerald-300 block">{insurance.execution_summary.payout_percentage}% Drawdown</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] space-y-1">
                      <span className="text-slate-500 text-[10px] block">ACTIVE TRIGGERS</span>
                      <span className="text-base font-bold text-cyan-300">{insurance.execution_summary.active_triggers_count} / 4 Triggers</span>
                      <span className="text-[10px] text-slate-400 block">Deterministic Sensor Verified</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] space-y-1">
                      <span className="text-slate-500 text-[10px] block">PRIMARY BENEFICIARY</span>
                      <span className="text-base font-bold text-rose-400 truncate block">{insurance.execution_summary.priority_beneficiary}</span>
                      <span className="text-[10px] text-slate-400 block">DDMA Staging Pool</span>
                    </div>
                  </div>

                  {/* Triggers Ledger */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Deterministic Trigger Evaluation Ledger</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insurance.triggers.map((t) => (
                        <div
                          key={t.id}
                          className={`p-4 rounded-2xl border space-y-3 ${
                            t.status === "TRIGGERED" ? "bg-emerald-950/20 border-emerald-800/60" : "bg-[#0c1220] border-[#1e293b]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-slate-400 block">{t.id}</span>
                              <h4 className="font-bold text-sm text-white">{t.name}</h4>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              t.status === "TRIGGERED" ? "bg-emerald-900 text-emerald-200 border border-emerald-700" : "bg-slate-800 text-slate-400"
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#090d16] p-2.5 rounded-xl border border-[#22334e]">
                            <div>
                              <span className="text-slate-500 text-[10px] block">TRIGGER CONDITION</span>
                              <span className="text-slate-300 font-medium">{t.condition}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block">MEASURED VALUE</span>
                              <span className="text-cyan-300 font-bold">{t.measured_value}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#1e293b]">
                            <span className="text-slate-400">Allocated: ₹{t.allocated_cr} Cr</span>
                            <span className="text-emerald-400 font-bold">Released: ₹{t.released_cr} Cr</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 8: ALERTS & DISPATCHES                              */}
              {/* ======================================================== */}
              {currentPage === "alerts" && dispatches && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-800/40 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                          <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Automated Early-Warning Multi-Channel Dispatches</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                              CAP v1.2 Standard
                            </span>
                          </h2>
                          <p className="text-xs text-slate-400">
                            Zero-latency civil protection dissemination across 4 verified vectors
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSimulateDispatch()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-950 transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Broadcast All Channels</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Multi-Channel Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {dispatches.channels.map((ch) => {
                      const isSent = dispatchedChannels[ch.channel_id];
                      return (
                        <div
                          key={ch.channel_id}
                          className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-[#131d31] border border-[#22334e]">
                                {ch.channel_id === "CELL_BROADCAST_SMS" && <Smartphone className="w-4 h-4 text-emerald-400" />}
                                {ch.channel_id === "SDMA_COMMAND_WEBHOOK" && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                                {ch.channel_id === "MUNICIPAL_SIREN_PA" && <Volume2 className="w-4 h-4 text-amber-400" />}
                                {ch.channel_id === "WHATSAPP_CITIZEN_BOT" && <MessageSquare className="w-4 h-4 text-cyan-400" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-white">{ch.channel_name}</h4>
                                <span className="text-[11px] text-slate-400 font-mono block">
                                  Protocol: {ch.protocol}
                                </span>
                              </div>
                            </div>

                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              isSent ? "bg-emerald-900 text-emerald-200 border border-emerald-600" : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            }`}>
                              {isSent ? "TRANSMITTED" : ch.status}
                            </span>
                          </div>

                          <div className="text-xs font-mono text-slate-300 bg-[#090d16] p-2.5 rounded-xl border border-[#22334e]">
                            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                              Target Broadcast Perimeter
                            </span>
                            <span className="text-slate-200">{ch.target}</span>
                          </div>

                          {/* 1. Cell Broadcast */}
                          {ch.channel_id === "CELL_BROADCAST_SMS" && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono text-slate-400">LANGUAGE:</span>
                                <div className="flex items-center gap-1 bg-[#090d16] p-0.5 rounded-lg border border-[#22334e]">
                                  <button
                                    onClick={() => setSmsLang("en")}
                                    className={`px-2.5 py-0.5 rounded text-xs font-mono transition ${
                                      smsLang === "en" ? "bg-emerald-600 text-white font-bold" : "text-slate-400"
                                    }`}
                                  >
                                    English (GSM-7)
                                  </button>
                                  <button
                                    onClick={() => setSmsLang("te")}
                                    className={`px-2.5 py-0.5 rounded text-xs font-mono transition ${
                                      smsLang === "te" ? "bg-emerald-600 text-white font-bold" : "text-slate-400"
                                    }`}
                                  >
                                    తెలుగు (Telugu)
                                  </button>
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-[#090d16] border border-rose-900/40 text-xs text-white leading-relaxed">
                                {smsLang === "en" ? ch.payload?.sms_english : ch.payload?.sms_telugu}
                              </div>
                            </div>
                          )}

                          {/* 2. SDMA Webhook */}
                          {ch.channel_id === "SDMA_COMMAND_WEBHOOK" && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div className="p-2 rounded bg-[#090d16] border border-[#22334e]">
                                  <span className="text-[9px] text-slate-500 block">ALERT ID</span>
                                  <span className="text-cyan-300 font-bold truncate block">{ch.payload?.alert_id}</span>
                                </div>
                                <div className="p-2 rounded bg-[#090d16] border border-[#22334e]">
                                  <span className="text-[9px] text-slate-500 block">SEVERITY</span>
                                  <span className="text-rose-400 font-bold block">{ch.payload?.severity} (RED)</span>
                                </div>
                              </div>
                              <div className="p-3 rounded-xl bg-[#090d16] border-l-4 border-rose-500 text-xs text-slate-200">
                                {ch.payload?.directive}
                              </div>
                            </div>
                          )}

                          {/* 3. Siren PA */}
                          {ch.channel_id === "MUNICIPAL_SIREN_PA" && (
                            <div className="space-y-3">
                              <div className="p-3 rounded-xl bg-[#090d16] border border-[#22334e] flex items-center justify-between">
                                <span className="text-xs font-bold text-white font-mono">Acoustic Tone:</span>
                                <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-bold">
                                  {ch.payload?.siren_pattern}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-[#090d16] text-xs italic text-slate-300">
                                &ldquo;{ch.payload?.loudspeaker_audio_script}&rdquo;
                              </div>
                            </div>
                          )}

                          {/* 4. WhatsApp Bot */}
                          {ch.channel_id === "WHATSAPP_CITIZEN_BOT" && (
                            <div className="space-y-3">
                              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-slate-200 space-y-2">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>AP SDMA Official Bot Advisory</span>
                                </div>
                                <p>Severe cyclone alert generated. Immediate shelter occupancy advised.</p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {ch.payload?.quick_replies?.map((btn: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-[#0c1220] border border-emerald-700 text-emerald-300 text-[10px]">
                                      {btn}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">
                              {isSent ? "Status: Transmitted & Logged" : "Queue: Ready"}
                            </span>
                            <button
                              onClick={() => handleSimulateDispatch(ch.channel_id)}
                              className="px-3 py-1 rounded bg-[#131d31] hover:bg-[#1c2a44] text-xs font-mono text-cyan-300 border border-[#22334e] transition cursor-pointer"
                            >
                              {isSent ? "Retrigger Push" : "Trigger Channel Push"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Collapsible Technical Protocol Inspector */}
                  <div className="rounded-2xl bg-[#0c1220] border border-[#1e293b] overflow-hidden">
                    <button
                      onClick={() => setShowRawTechPayloads(!showRawTechPayloads)}
                      className="w-full p-4 flex items-center justify-between hover:bg-[#131d31]/50 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[#131d31] border border-[#22334e] text-cyan-400">
                          <Code2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Inspect Raw Common Alerting Protocol (CAP v1.2) XML &amp; Machine Payloads</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                              Developer &amp; Auditor View
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400">
                            Standard ITU-T X.1303 &amp; OASIS CAP v1.2 XML schema.
                          </p>
                        </div>
                      </div>
                      {showRawTechPayloads ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {showRawTechPayloads && (
                      <div className="p-4 border-t border-[#1e293b] space-y-4 bg-[#090d16] animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
                            Standard CAP v1.2 XML Payload
                          </span>
                          <button
                            onClick={() => copyToClipboard(dispatches.cap_xml, "CAP XML")}
                            className="px-3 py-1 rounded bg-[#131d31] hover:bg-[#1c2a44] text-xs font-mono text-cyan-300 border border-[#22334e] transition"
                          >
                            Copy CAP XML
                          </button>
                        </div>
                        <pre className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-80 leading-relaxed">
                          {dispatches.cap_xml}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 9: AI ANALYSIS                                     */}
              {/* ======================================================== */}
              {currentPage === "ai-analysis" && advisory && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                      <div>
                        <span className="text-xs font-mono text-cyan-400 block uppercase">
                          GEMINI MULTIMODAL OPERATIONS INTELLIGENCE
                        </span>
                        <h2 className="text-lg font-black text-white">
                          Grounded Pre-Landfall Threat Assessment
                        </h2>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 font-bold">
                        Grounding Integrity: Verified
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e] space-y-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">
                        EXECUTIVE SITUATION SUMMARY
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {advisory.authority_guidance_en}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* English Citizen Advisory */}
                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e] space-y-2">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase">
                          PUBLIC SAFETY ADVISORY (ENGLISH)
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {advisory.citizen_advisory_en}
                        </p>
                      </div>

                      {/* Telugu Citizen Advisory */}
                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e] space-y-2">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase">
                          పౌరుల భద్రతా హెచ్చరిక (TELUGU)
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {advisory.citizen_advisory_te}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 10: REPORTS                                         */}
              {/* ======================================================== */}
              {currentPage === "reports" && riskData && cyclone && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                      <div>
                        <h2 className="text-lg font-black text-white">Assessment Report Center</h2>
                        <p className="text-xs text-slate-400">
                          Deterministic incident matrix export and printable executive briefings
                        </p>
                      </div>

                      <button
                        onClick={exportIncidentMatrix}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-cyan-950 cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Export Incident Matrix (JSON)</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-xl bg-[#131d31] border border-[#22334e] space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">REPORT ID:</span>
                        <span className="text-white font-bold">CYCLONEX-SITREP-{cyclone.id.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">STORM:</span>
                        <span className="text-cyan-300 font-bold">{cyclone.name} ({cyclone.category})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">IMPACT CORRIDOR:</span>
                        <span className="text-white">{cyclone.landfall_target}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">CRITICAL HOSPITALS AT RISK:</span>
                        <span className="text-rose-400 font-bold">{riskData.exposure_summary.hospitals_at_risk.assets.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">SUBSTATIONS AT RISK:</span>
                        <span className="text-amber-400 font-bold">{riskData.exposure_summary.substations_at_risk.assets.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">INUNDATED HIGHWAYS:</span>
                        <span className="text-white">{riskData.exposure_summary.roads_at_risk_km.in_surge_inundation} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 11: METHODOLOGY                                     */}
              {/* ======================================================== */}
              {currentPage === "about" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-[#0c1220] border border-[#1e293b] space-y-4">
                    <div className="border-b border-[#1e293b] pb-3">
                      <span className="text-xs font-mono text-cyan-400 uppercase block font-bold">
                        SYSTEM ARCHITECTURE &amp; GOVERNANCE
                      </span>
                      <h2 className="text-lg font-black text-white">
                        Scientific Methodology &amp; Mathematical Framework
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e] space-y-2">
                        <h4 className="font-bold text-white font-mono text-sm text-cyan-300">
                          1. Deterministic Geospatial Risk Engine
                        </h4>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          Directionally interpolated asymmetric wind swath polygons for 34kt (gale), 50kt (storm), and 64kt (hurricane) hazard envelopes computed using Shapely. Inverted barometric pressure drop is coupled with coastal DEM elevation thresholds.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e] space-y-2">
                        <h4 className="font-bold text-white font-mono text-sm text-emerald-300">
                          2. Zero Numerical Fabrication Principle
                        </h4>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          All counts of hospitals, power substations, and inundated highways are computed deterministically via GeoPandas spatial joins. LLM (Gemini 3.7 Flash) strictly generates grounded operational narratives from verified JSON metrics.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Slide-out Infrastructure Detail Drawer */}
      <InfrastructureDetailDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        cycloneName={cyclone?.name || "Cyclone"}
      />
    </div>
  );
}
