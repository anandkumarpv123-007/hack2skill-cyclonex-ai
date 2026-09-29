"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  MapPin,
  Compass,
  Users,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  Languages,
  Radio,
  PhoneCall,
} from "lucide-react";
import {
  fetchActiveCyclone,
  generateAdvisory,
  fetchNearbyShelters,
} from "@/lib/api";
import { DICTIONARY, Locale } from "@/lib/i18n";
import {
  CycloneTrack,
  AdvisoryData,
  ShelterCandidate,
} from "@/types/cyclone";

// Quick-select coastal towns in Andhra Pradesh
const COASTAL_LOCATIONS = [
  { name: "Suryalanka / Bapatla Beach", lat: 15.852, lon: 80.518 },
  { name: "Chirala Coastal Ward", lat: 15.824, lon: 80.352 },
  { name: "Nizampatnam Fishery Port", lat: 15.908, lon: 80.672 },
  { name: "Machilipatnam Manginapudi", lat: 16.248, lon: 81.242 },
];

export default function CitizenPortalPage() {
  const [locale, setLocale] = useState<Locale>("te"); // Default to Telugu for coastal citizens
  const [cyclone, setCyclone] = useState<CycloneTrack | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [shelters, setShelters] = useState<ShelterCandidate[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(COASTAL_LOCATIONS[0]);
  const [customLat, setCustomLat] = useState<string>("15.852");
  const [customLon, setCustomLon] = useState<string>("80.518");
  const [loadingShelters, setLoadingShelters] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const t = DICTIONARY[locale];

  useEffect(() => {
    async function init() {
      try {
        const [track, advRes] = await Promise.all([
          fetchActiveCyclone(),
          generateAdvisory(),
        ]);
        setCyclone(track);
        setAdvisory(advRes.advisory);
      } catch (e) {
        console.error("Error loading citizen advisory:", e);
      }
    }
    init();
    searchShelters(selectedLocation.lat, selectedLocation.lon);
  }, []);

  const searchShelters = async (lat: number, lon: number) => {
    setLoadingShelters(true);
    try {
      const res = await fetchNearbyShelters(lat, lon, 4);
      setShelters(res.nearest_shelters || []);
    } catch (e) {
      console.error("Failed to load nearby shelters:", e);
    } finally {
      setLoadingShelters(false);
    }
  };

  const handleLocationSelect = (loc: typeof COASTAL_LOCATIONS[0]) => {
    setSelectedLocation(loc);
    setCustomLat(loc.lat.toString());
    setCustomLon(loc.lon.toString());
    searchShelters(loc.lat, loc.lon);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      searchShelters(lat, lon);
    }
  };

  const handleCopySMS = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* High-Contrast Emergency Header */}
      <header className="border-b border-rose-900 bg-rose-950/60 sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-rose-300 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-extrabold text-lg tracking-wider text-rose-200">
              CYCLONEX
            </span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-900/80 border border-rose-700 text-rose-200 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <Radio className="w-3 h-3 text-rose-400" />
            {t.citizen_portal}
          </span>
        </div>

        {/* Language Switcher Button */}
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-rose-400" />
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setLocale("en")}
              className={`px-3 py-1 rounded-md transition ${
                locale === "en"
                  ? "bg-rose-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLocale("te")}
              className={`px-3 py-1 rounded-md transition ${
                locale === "te"
                  ? "bg-rose-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              తెలుగు (Telugu)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Extreme Danger Banner */}
        <div className="p-6 rounded-2xl bg-rose-950/70 border-2 border-rose-700 text-rose-100 space-y-3 shadow-2xl">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
            <span>{locale === "te" ? "తీవ్ర ప్రమాదం • అత్యవసర రక్షణ చర్యలు" : "EXTREME HAZARD WARNING • IMMEDIATE ACTION"}</span>
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
                <span className="text-rose-300 block text-[10px]">Data Mode</span>
                <span className="font-bold text-amber-300 text-sm">SIMULATED</span>
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

          {/* Quick-Select Town Chips */}
          <div className="flex flex-wrap gap-2">
            {COASTAL_LOCATIONS.map((loc) => (
              <button
                key={loc.name}
                onClick={() => handleLocationSelect(loc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  selectedLocation.name === loc.name
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* Manual Coordinate Form */}
          <form onSubmit={handleCustomSearch} className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Lat:</span>
              <input
                type="text"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Lon:</span>
              <input
                type="text"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loadingShelters}
              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition"
            >
              {loadingShelters ? "Calculating..." : t.find_shelter_btn}
            </button>
          </form>

          {/* Shelter Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {shelters.map((s) => (
              <div
                key={s.id}
                className={`p-4 rounded-xl border space-y-2 transition ${
                  s.is_safe
                    ? "bg-slate-950/80 border-emerald-800/80 hover:border-emerald-500"
                    : "bg-rose-950/30 border-rose-800/60 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-white">{s.name}</h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      s.is_safe
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-rose-950 text-rose-300 border border-rose-700"
                    }`}
                  >
                    {locale === "te" ? s.safety_status_te : s.is_safe ? t.shelter_safe : t.shelter_compromised}
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

                {s.is_safe ? (
                  <div className="text-[11px] text-emerald-400 font-medium">
                    ✓ {locale === "te" ? "ఈ ఆశ్రయం సురక్షిత ఎత్తులో ఉంది. వెంటనే ఇక్కడికి వెళ్లవచ్చు." : "Certified safe elevation. Follow inland road to reach."}
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-400 font-medium">
                    ⚠ {locale === "te" ? "ముంపు ప్రమాదం ఉంది. ఈ ఆశ్రయానికి వెళ్లవద్దు!" : "Surge hazard alert. DO NOT evacuate to this coastal site."}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Low-Bandwidth SMS / Basic Phone Broadcast Copy View */}
        {advisory && (
          <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.sms_view}</span>
              </h3>
              <button
                onClick={() =>
                  handleCopySMS(
                    locale === "te" ? advisory.citizen_advisory_te : advisory.citizen_advisory_en
                  )
                }
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.sms_copied : t.copy_sms}</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-black border border-slate-800 font-mono text-xs text-slate-300 select-all whitespace-pre-wrap">
              {locale === "te" ? advisory.citizen_advisory_te : advisory.citizen_advisory_en}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
