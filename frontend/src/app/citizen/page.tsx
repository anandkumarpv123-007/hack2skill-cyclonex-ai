"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Compass,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  Languages,
  Radio,
  PhoneCall,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import {
  fetchBenchmarks,
  fetchCycloneById,
  generateAdvisory,
  fetchNearbyShelters,
} from "@/lib/api";
import { DICTIONARY, Locale } from "@/lib/i18n";
import {
  CycloneTrack,
  AdvisoryData,
  ShelterCandidate,
} from "@/types/cyclone";

// Quick-select coastal locations by scenario
const MICHAUNG_LOCATIONS = [
  { name: "Suryalanka / Bapatla Beach", lat: 15.852, lon: 80.518 },
  { name: "Chirala Coastal Ward", lat: 15.824, lon: 80.352 },
  { name: "Nizampatnam Fishery Port", lat: 15.908, lon: 80.672 },
  { name: "Machilipatnam Manginapudi", lat: 16.248, lon: 81.242 },
];

const HUDHUD_LOCATIONS = [
  { name: "RK Beach / Visakhapatnam", lat: 17.712, lon: 83.318 },
  { name: "Bheemunipatnam Coast", lat: 17.892, lon: 83.456 },
  { name: "Madhurawada Sector", lat: 17.818, lon: 83.352 },
  { name: "Vizianagaram Fort Area", lat: 18.115, lon: 83.410 },
];

export default function CitizenPortalPage() {
  const [locale, setLocale] = useState<Locale>("te"); // Default to Telugu for coastal AP citizens
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("cyclone_michaung_2023");
  const [cyclone, setCyclone] = useState<CycloneTrack | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [shelters, setShelters] = useState<ShelterCandidate[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(MICHAUNG_LOCATIONS[0]);
  const [customLat, setCustomLat] = useState<string>("15.852");
  const [customLon, setCustomLon] = useState<string>("80.518");
  const [coordError, setCoordError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingShelters, setLoadingShelters] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [smsMode, setSmsMode] = useState<"full" | "short">("full");

  const t = DICTIONARY[locale];

  // Sync document html lang attribute for accessibility & browser localization
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Load benchmark list on mount
  useEffect(() => {
    async function loadBenchmarks() {
      try {
        const list = await fetchBenchmarks();
        setBenchmarks(list);
      } catch (e) {
        console.error("Failed to load benchmarks:", e);
      }
    }
    loadBenchmarks();
  }, []);

  // When scenario changes, update scenario data and reset default location
  useEffect(() => {
    loadScenarioData(selectedScenarioId);
  }, [selectedScenarioId]);

  const loadScenarioData = async (scenarioId: string) => {
    setLoading(true);
    setCoordError(null);
    try {
      const isHudhud = scenarioId.includes("hudhud");
      const defaultLoc = isHudhud ? HUDHUD_LOCATIONS[0] : MICHAUNG_LOCATIONS[0];
      setSelectedLocation(defaultLoc);
      setCustomLat(defaultLoc.lat.toString());
      setCustomLon(defaultLoc.lon.toString());

      const [track, advRes] = await Promise.all([
        fetchCycloneById(scenarioId),
        generateAdvisory(scenarioId),
      ]);
      setCyclone(track);
      setAdvisory(advRes.advisory);

      // Search shelters for initial default coordinates under this scenario
      await searchShelters(defaultLoc.lat, defaultLoc.lon, scenarioId);
    } catch (e) {
      console.error("Error loading scenario data:", e);
    } finally {
      setLoading(false);
    }
  };

  const validateCoordinates = (latStr: string, lonStr: string): { lat: number; lon: number } | null => {
    const trimmedLat = latStr.trim();
    const trimmedLon = lonStr.trim();

    if (!trimmedLat || !trimmedLon) {
      setCoordError(
        locale === "te"
          ? "దయచేసి అక్షాంశం మరియు రేఖాంశం నమోదు చేయండి."
          : "Please enter both latitude and longitude values."
      );
      return null;
    }

    const lat = Number(trimmedLat);
    const lon = Number(trimmedLon);

    if (isNaN(lat) || isNaN(lon)) {
      setCoordError(
        locale === "te"
          ? "అక్షాంశం మరియు రేఖాంశం సంఖ్యలుగా ఉండాలి (ఉదా: 15.852, 80.518)."
          : "Coordinates must be valid decimal numbers (e.g., 15.852, 80.518)."
      );
      return null;
    }

    if (lat < -90 || lat > 90) {
      setCoordError(
        locale === "te"
          ? "చెల్లని అక్షాంశం. అక్షాంశం -90 నుండి 90 మధ్య ఉండాలి."
          : "Invalid latitude. Latitude must be between -90 and 90 degrees."
      );
      return null;
    }

    if (lon < -180 || lon > 180) {
      setCoordError(
        locale === "te"
          ? "చెల్లని రేఖాంశం. రేఖాంశం -180 నుండి 180 మధ్య ఉండాలి."
          : "Invalid longitude. Longitude must be between -180 and 180 degrees."
      );
      return null;
    }

    setCoordError(null);
    return { lat, lon };
  };

  const searchShelters = async (lat: number, lon: number, scenarioId: string) => {
    setLoadingShelters(true);
    try {
      const res = await fetchNearbyShelters(lat, lon, 4, scenarioId);
      setShelters(res.nearest_shelters || []);
    } catch (e) {
      console.error("Failed to load nearby shelters:", e);
      setShelters([]);
    } finally {
      setLoadingShelters(false);
    }
  };

  const handleLocationSelect = (loc: { name: string; lat: number; lon: number }) => {
    setSelectedLocation(loc);
    setCustomLat(loc.lat.toString());
    setCustomLon(loc.lon.toString());
    setCoordError(null);
    searchShelters(loc.lat, loc.lon, selectedScenarioId);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateCoordinates(customLat, customLon);
    if (valid) {
      searchShelters(valid.lat, valid.lon, selectedScenarioId);
    } else {
      setShelters([]); // Clear stale recommendations on error
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 160-Character SMS Broadcast Template for Basic 2G Phones
  const shortSmsEn = cyclone
    ? `EMERGENCY CYCLONE WARNING: ${cyclone.name}. Peak winds ${cyclone.peak_wind_kmh}km/h near ${cyclone.landfall_target}. Evacuate low areas to nearest shelter now. Help: 1070/112.`
    : "";

  const shortSmsTe = cyclone
    ? `అత్యవసర తుఫాను హెచ్చరిక: ${cyclone.name}. తీరం: ${cyclone.landfall_target}. గాలులు ${cyclone.peak_wind_kmh}km/h. వెంటనే సురక్షిత ఆశ్రయాలకు వెళ్లండి. హెల్ప్‌లైన్: 1070/112.`
    : "";

  const activeLocations = selectedScenarioId.includes("hudhud")
    ? HUDHUD_LOCATIONS
    : MICHAUNG_LOCATIONS;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* High-Contrast Emergency Header */}
      <header className="border-b border-rose-900 bg-rose-950/70 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-rose-300 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-extrabold text-lg tracking-wider text-rose-200">
              CYCLONEX
            </span>
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-900/90 border border-rose-700 text-rose-200 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <Radio className="w-3 h-3 text-rose-400" />
            {t.citizen_portal}
          </span>
        </div>

        {/* Scenario Selector & Language Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1">
            <span className="text-[11px] text-slate-400">Scenario:</span>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  {b.name} ({b.year})
                </option>
              ))}
            </select>
            {loading && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
          </div>

          {/* Language Switcher Button */}
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-rose-400" />
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1 rounded-md transition ${
                  locale === "en"
                    ? "bg-rose-600 text-white font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLocale("te")}
                className={`px-3 py-1 rounded-md transition ${
                  locale === "te"
                    ? "bg-rose-600 text-white font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                తెలుగు (Telugu)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Extreme Danger Banner */}
        <div className="p-6 rounded-2xl bg-rose-950/70 border-2 border-rose-700 text-rose-100 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase tracking-wider">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>
                {locale === "te"
                  ? "తీవ్ర ప్రమాదం • అత్యవసర రక్షణ చర్యలు"
                  : "EXTREME HAZARD WARNING • IMMEDIATE ACTION"}
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-mono">
              [SIMULATED SCENARIO BENCHMARK]
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {locale === "te"
              ? "తీవ్ర తుఫాను తీరం దాటుతోంది. వెంటనే సురక్షిత ఆశ్రయాలకు వెళ్లండి!"
              : "Dangerous Cyclone Approaching. Evacuate to Designated Shelters Now!"}
          </h1>

          {cyclone && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-rose-900/60">
              <div>
                <span className="text-rose-300 block text-[10px]">{t.landfall_target}</span>
                <span className="font-bold text-white text-sm">{cyclone.landfall_target}</span>
              </div>
              <div>
                <span className="text-rose-300 block text-[10px]">{t.peak_wind}</span>
                <span className="font-bold text-white text-sm">{cyclone.peak_wind_kmh} km/h</span>
              </div>
              <div>
                <span className="text-rose-300 block text-[10px]">{t.central_pressure}</span>
                <span className="font-bold text-white text-sm">{cyclone.min_pressure_hpa} hPa</span>
              </div>
              <div>
                <span className="text-rose-300 block text-[10px]">Storm Category</span>
                <span className="font-bold text-amber-300 text-sm truncate block">{cyclone.category}</span>
              </div>
            </div>
          )}
        </div>

        {/* Verified Citizen Advisory Text in Active Language */}
        {advisory && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span>{t.citizen_warning}</span>
            </h2>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-medium">
              {locale === "te" ? advisory.citizen_advisory_te : advisory.citizen_advisory_en}
            </div>

            {/* Emergency Checklist */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t.emergency_instructions}
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <li className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2">
                  <span className="text-emerald-400">💧</span>
                  <span>{t.checklist_water}</span>
                </li>
                <li className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2">
                  <span className="text-amber-400">🍞</span>
                  <span>{t.checklist_food}</span>
                </li>
                <li className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2">
                  <span className="text-rose-400">⚡</span>
                  <span>{t.checklist_power}</span>
                </li>
                <li className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2">
                  <span className="text-cyan-400">🏃</span>
                  <span>{t.checklist_evac}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Nearest Safe Shelter Locator Component */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <span>{t.nearest_shelter_finder}</span>
              </h2>
              <p className="text-xs text-slate-400">{t.enter_coordinates}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
              Haversine & Hazard Clearance
            </span>
          </div>

          {/* Quick-Select Town Chips for Active Scenario */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">
              {locale === "te" ? "ప్రభావిత తీర ప్రాంతాలు (త్వరిత ఎంపిక):" : "Affected Coastal Locations (Quick-Select):"}
            </span>
            <div className="flex flex-wrap gap-2">
              {activeLocations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleLocationSelect(loc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedLocation.name === loc.name
                      ? "bg-emerald-600 border-emerald-500 text-white shadow"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Coordinate Form with Robust Validation */}
          <form onSubmit={handleCustomSearch} className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono">Lat:</span>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => {
                    setCustomLat(e.target.value);
                    if (coordError) setCoordError(null);
                  }}
                  placeholder="e.g. 15.852"
                  className="w-28 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono">Lon:</span>
                <input
                  type="text"
                  value={customLon}
                  onChange={(e) => {
                    setCustomLon(e.target.value);
                    if (coordError) setCoordError(null);
                  }}
                  placeholder="e.g. 80.518"
                  className="w-28 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loadingShelters}
                className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 text-white font-medium transition flex items-center gap-1.5 shadow"
              >
                {loadingShelters && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{loadingShelters ? "Calculating..." : t.find_shelter_btn}</span>
              </button>
            </div>

            {/* Validation Error Alert Banner */}
            {coordError && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{coordError}</span>
              </div>
            )}
          </form>

          {/* Shelter Cards List with Explicit Scientific Safety Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {shelters.map((s) => {
              // Determine safety badge styling and truthful guidance
              const isSurgeCompromised = s.in_surge_zone;
              const isWindRisk = s.in_extreme_wind && !isSurgeCompromised;
              const isSafe = s.is_safe && !isSurgeCompromised;

              const badgeColor = isSurgeCompromised
                ? "bg-rose-950 text-rose-300 border-rose-700"
                : isWindRisk
                ? "bg-amber-950 text-amber-300 border-amber-700"
                : "bg-emerald-950 text-emerald-300 border-emerald-700";

              const badgeText = isSurgeCompromised
                ? locale === "te"
                  ? "ముంపు ప్రమాదం (SURGE RISK)"
                  : "SURGE RISK / COMPROMISED"
                : isWindRisk
                ? locale === "te"
                  ? "తీవ్ర గాలుల ముప్పు (WIND RISK)"
                  : "CAUTION (HIGH WINDS)"
                : locale === "te"
                ? "సురక్షిత ఆశ్రయం (SAFE)"
                : "SAFE & OPERATIONAL";

              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border space-y-2 transition ${
                    isSurgeCompromised
                      ? "bg-rose-950/30 border-rose-800/80 shadow-inner"
                      : isWindRisk
                      ? "bg-amber-950/20 border-amber-800/80"
                      : "bg-slate-950/80 border-emerald-800/80 hover:border-emerald-500 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-white">{s.name}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border whitespace-nowrap ${badgeColor}`}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">{t.distance}</span>
                      <span className="font-bold text-cyan-300">{s.distance_km} km</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{t.bearing}</span>
                      <span className="font-bold text-emerald-300">{s.compass_direction}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">{t.capacity}</span>
                      <span className="font-bold text-slate-200">{s.capacity}</span>
                    </div>
                  </div>

                  {/* Truthful Guidance Subtitle */}
                  {isSurgeCompromised ? (
                    <div className="text-[11px] text-rose-400 font-semibold bg-rose-950/50 p-2 rounded border border-rose-900/60">
                      ⚠ {locale === "te"
                        ? "తీరప్రాంత అలల ముంపు ప్రమాదం ఉంది. ఈ ఆశ్రయానికి వెళ్లవద్దు!"
                        : "SURGE RISK: Located inside active coastal inundation zone. DO NOT USE."}
                    </div>
                  ) : isWindRisk ? (
                    <div className="text-[11px] text-amber-300 font-semibold bg-amber-950/50 p-2 rounded border border-amber-900/60">
                      ⚠ {locale === "te"
                        ? "ఆశ్రయం ముంపు లేని ఎత్తులో ఉంది, కానీ తీవ్ర తుఫాను గాలులు వీచే అవకాశం ఉంది. జాగ్రత్తగా వెళ్లండి."
                        : "WIND RISK: Safe from coastal surge, but expects storm/gale force winds. Proceed with caution."}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 p-2 rounded border border-emerald-900/60">
                      ✓ {locale === "te"
                        ? "ఈ ఆశ్రయం ముంపు స్థాయికి పైన ఉంది. సురక్షితంగా ఇక్కడికి వెళ్లవచ్చు."
                        : "SAFE: Elevated structure above active scenario surge level. Safe to evacuate."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Low-Bandwidth SMS Broadcast Mode (P2.18 for 2G Basic Phones) */}
        {cyclone && (
          <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-xs text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.sms_view}</span>
                </h3>
                {/* Toggle Full vs Short SMS */}
                <div className="inline-flex rounded-md bg-slate-950 border border-slate-800 p-0.5 text-[10px]">
                  <button
                    onClick={() => setSmsMode("full")}
                    className={`px-2 py-0.5 rounded transition ${
                      smsMode === "full"
                        ? "bg-slate-700 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Full Advisory
                  </button>
                  <button
                    onClick={() => setSmsMode("short")}
                    className={`px-2 py-0.5 rounded transition ${
                      smsMode === "short"
                        ? "bg-cyan-700 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Short SMS (&lt;160 char)
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  const content =
                    smsMode === "short"
                      ? locale === "te"
                        ? shortSmsTe
                        : shortSmsEn
                      : locale === "te"
                      ? advisory?.citizen_advisory_te || ""
                      : advisory?.citizen_advisory_en || "";
                  handleCopyText(content);
                }}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.sms_copied : t.copy_sms}</span>
              </button>
            </div>

            {smsMode === "short" ? (
              <div className="space-y-1">
                <div className="p-3 rounded-lg bg-black border border-cyan-900/60 font-mono text-xs text-cyan-300 select-all whitespace-pre-wrap leading-relaxed">
                  {locale === "te" ? shortSmsTe : shortSmsEn}
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  Characters: {(locale === "te" ? shortSmsTe : shortSmsEn).length} / 160 (Standard 2G GSM SMS)
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-black border border-slate-800 font-mono text-xs text-slate-300 select-all whitespace-pre-wrap leading-relaxed">
                {locale === "te"
                  ? advisory?.citizen_advisory_te
                  : advisory?.citizen_advisory_en}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
