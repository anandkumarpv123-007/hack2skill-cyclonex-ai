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
  Search,
  MapPin,
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

export interface CoastalPlace {
  name: string;
  nameTe: string;
  district: string;
  pincode: string;
  lat: number;
  lon: number;
}

export const AP_COASTAL_PLACES: CoastalPlace[] = [
  // Bapatla District
  { name: "Bapatla Center", nameTe: "బాపట్ల సెంటర్", district: "Bapatla", pincode: "522101", lat: 15.904, lon: 80.467 },
  { name: "Suryalanka Beach", nameTe: "సూర్యలంక బీచ్", district: "Bapatla", pincode: "522101", lat: 15.865, lon: 80.505 },
  { name: "Chirala Coastal Town", nameTe: "చీరాల", district: "Bapatla", pincode: "523155", lat: 15.815, lon: 80.355 },
  { name: "Vetapalem Mandal", nameTe: "వేటపాలెం", district: "Bapatla", pincode: "523187", lat: 15.783, lon: 80.317 },
  { name: "Nizampatnam Harbor", nameTe: "నిజాంపట్నం హార్బర్", district: "Bapatla", pincode: "522314", lat: 15.915, lon: 80.665 },
  { name: "Repalle Town", nameTe: "రేపల్లె", district: "Bapatla", pincode: "522265", lat: 16.020, lon: 80.840 },

  // Krishna District
  { name: "Machilipatnam Town Center", nameTe: "మచిలీపట్నం", district: "Krishna", pincode: "521001", lat: 16.195, lon: 81.145 },
  { name: "Manginapudi Beach", nameTe: "మంగినపూడి బీచ్", district: "Krishna", pincode: "521002", lat: 16.230, lon: 81.180 },
  { name: "Avanigadda Mandal", nameTe: "అవనిగడ్డ", district: "Krishna", pincode: "521121", lat: 16.020, lon: 80.920 },
  { name: "Nagayalanka Coastal Village", nameTe: "నాగాయలంక", district: "Krishna", pincode: "521120", lat: 15.950, lon: 80.920 },

  // Prakasam District
  { name: "Ongole City Center", nameTe: "ఒంగోలు", district: "Prakasam", pincode: "523001", lat: 15.505, lon: 80.050 },
  { name: "Kothapatnam Beach", nameTe: "కొత్తపట్నం బీచ్", district: "Prakasam", pincode: "523286", lat: 15.460, lon: 80.120 },
  { name: "Singarayakonda Mandal", nameTe: "సింగరాయకొండ", district: "Prakasam", pincode: "523101", lat: 15.250, lon: 80.030 },

  // SPSR Nellore District
  { name: "Nellore City Center", nameTe: "నెల్లూరు", district: "SPSR Nellore", pincode: "524001", lat: 14.442, lon: 79.986 },
  { name: "Kavali Coastal Town", nameTe: "కావలి", district: "SPSR Nellore", pincode: "524201", lat: 14.915, lon: 79.990 },
  { name: "Mypadu Beach Habitation", nameTe: "మైపాడు బీచ్", district: "SPSR Nellore", pincode: "524313", lat: 14.510, lon: 80.180 },
  { name: "Krishnapatnam Port Sector", nameTe: "కృష్ణపట్నం పోర్ట్", district: "SPSR Nellore", pincode: "524344", lat: 14.250, lon: 80.120 },

  // Visakhapatnam District
  { name: "Visakhapatnam City Center", nameTe: "విశాఖపట్నం సెంటర్", district: "Visakhapatnam", pincode: "530002", lat: 17.725, lon: 83.325 },
  { name: "RK Beach / Maharani Peta", nameTe: "ఆర్కే బీచ్ / మహారాణిపేట", district: "Visakhapatnam", pincode: "530002", lat: 17.715, lon: 83.315 },
  { name: "Bheemunipatnam (Bheemili)", nameTe: "భీమునిపట్నం (భీమిలి)", district: "Visakhapatnam", pincode: "531163", lat: 17.885, lon: 83.445 },
  { name: "Madhurawada Sector", nameTe: "మధురవాడ", district: "Visakhapatnam", pincode: "530048", lat: 17.825, lon: 83.345 },
  { name: "Gajuwaka Industrial Zone", nameTe: "గాజువాక", district: "Visakhapatnam", pincode: "530026", lat: 17.690, lon: 83.210 },
  { name: "Anakapalle Town Center", nameTe: "అనకాపల్లి", district: "Anakapalli", pincode: "531001", lat: 17.689, lon: 83.003 },

  // Vizianagaram & Srikakulam
  { name: "Vizianagaram Fort Center", nameTe: "విజయనగరం కోట", district: "Vizianagaram", pincode: "535001", lat: 18.125, lon: 83.415 },
  { name: "Srikakulam Town", nameTe: "శ్రీకాకుళం", district: "Srikakulam", pincode: "532001", lat: 18.297, lon: 83.897 },
  { name: "Kalingapatnam Coastal Ward", nameTe: "కళింగపట్నం", district: "Srikakulam", pincode: "532406", lat: 18.340, lon: 84.130 },

  // Godavari Coastal
  { name: "Kakinada Port City", nameTe: "కాకినాడ", district: "Kakinada", pincode: "533001", lat: 16.989, lon: 82.247 },
  { name: "Uppada Beach Village", nameTe: "ఉప్పాడ బీచ్", district: "Kakinada", pincode: "533448", lat: 17.085, lon: 82.330 },
  { name: "Amalapuram Coastal Sector", nameTe: "అమలాపురం", district: "Konaseema", pincode: "533201", lat: 16.578, lon: 82.006 },
  { name: "Antarvedi Temple Coastal Habitation", nameTe: "అంతర్వేది", district: "Konaseema", pincode: "533252", lat: 16.330, lon: 81.730 },
  { name: "Narsapur Harbor Town", nameTe: "నర్సాపూర్", district: "West Godavari", pincode: "534275", lat: 16.435, lon: 81.695 },
];

// Quick-select coastal locations by scenario with actual village/ward center coordinates
const MICHAUNG_LOCATIONS = [
  { name: "Suryalanka Village / Bapatla Center", lat: 15.865, lon: 80.505 },
  { name: "Chirala Coastal Ward Center", lat: 15.815, lon: 80.355 },
  { name: "Nizampatnam Harbor Habitation", lat: 15.915, lon: 80.665 },
  { name: "Machilipatnam Town Center", lat: 16.195, lon: 81.145 },
];

const HUDHUD_LOCATIONS = [
  { name: "RK Beach Town Colony / Vizag Center", lat: 17.725, lon: 83.325 },
  { name: "Bheemunipatnam Village Center", lat: 17.885, lon: 83.445 },
  { name: "Madhurawada Residential Sector", lat: 17.825, lon: 83.345 },
  { name: "Vizianagaram Fort Center", lat: 18.125, lon: 83.415 },
];

const ERROR_MESSAGES: Record<string, { en: string; te: string }> = {
  EMPTY: {
    en: "Please enter both latitude and longitude values.",
    te: "దయచేసి అక్షాంశం మరియు రేఖాంశం నమోదు చేయండి.",
  },
  NAN: {
    en: "Coordinates must be valid decimal numbers (e.g., 15.865, 80.505).",
    te: "అక్షాంశం మరియు రేఖాంశం సంఖ్యలుగా ఉండాలి (ఉదా: 15.865, 80.505).",
  },
  LAT_RANGE: {
    en: "Invalid latitude. Latitude must be between -90 and 90 degrees.",
    te: "చెల్లని అక్షాంశం. అక్షాంశం -90 నుండి 90 మధ్య ఉండాలి.",
  },
  LON_RANGE: {
    en: "Invalid longitude. Longitude must be between -180 and 180 degrees.",
    te: "చెల్లని రేఖాంశం. రేఖాంశం -180 నుండి 180 మధ్య ఉండాలి.",
  },
  GEO_DENIED: {
    en: "Location access denied. Please enter coordinates manually or select a location above.",
    te: "లొకేషన్ యాక్సెస్ నిరాకరించబడింది. దయచేసి వివరాలను మాన్యువల్‌గా నమోదు చేయండి.",
  },
  GEO_UNAVAILABLE: {
    en: "Unable to retrieve your location. Please enter coordinates manually.",
    te: "మీ స్థానాన్ని పొందలేకపోయాము. దయచేసి వివరాలను మాన్యువల్‌గా నమోదు చేయండి.",
  },
};

export default function CitizenPortalPage() {
  const [locale, setLocale] = useState<Locale>("te"); // Default to Telugu for coastal AP citizens
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("cyclone_michaung_2023");
  const [cyclone, setCyclone] = useState<CycloneTrack | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [shelters, setShelters] = useState<ShelterCandidate[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(MICHAUNG_LOCATIONS[0]);
  const [customLat, setCustomLat] = useState<string>("15.865");
  const [customLon, setCustomLon] = useState<string>("80.505");
  const [coordErrorCode, setCoordErrorCode] = useState<string | null>(null);
  const [placeSearchQuery, setPlaceSearchQuery] = useState<string>("");
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingShelters, setLoadingShelters] = useState<boolean>(false);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
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
    setCoordErrorCode(null);
    try {
      const isHudhud = scenarioId.includes("hudhud");
      const defaultLoc = isHudhud ? HUDHUD_LOCATIONS[0] : MICHAUNG_LOCATIONS[0];
      setSelectedLocation(defaultLoc);
      setPlaceSearchQuery(defaultLoc.name);
      setShowPlaceSuggestions(false);
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
      setCoordErrorCode("EMPTY");
      return null;
    }

    const lat = Number(trimmedLat);
    const lon = Number(trimmedLon);

    if (isNaN(lat) || isNaN(lon)) {
      setCoordErrorCode("NAN");
      return null;
    }

    if (lat < -90 || lat > 90) {
      setCoordErrorCode("LAT_RANGE");
      return null;
    }

    if (lon < -180 || lon > 180) {
      setCoordErrorCode("LON_RANGE");
      return null;
    }

    setCoordErrorCode(null);
    return { lat, lon };
  };

  const searchShelters = async (lat: number, lon: number, scenarioId: string) => {
    setLoadingShelters(true);
    try {
      const res = await fetchNearbyShelters(lat, lon, 4, scenarioId);
      setShelters(res.nearest_shelters || []);
    } catch (e) {
      console.error("Failed to load nearby shelters:", e);
      // Keep previous shelters on network error if available
    } finally {
      setLoadingShelters(false);
    }
  };

  const filteredPlaces = placeSearchQuery.trim()
    ? AP_COASTAL_PLACES.filter((p) => {
        const q = placeSearchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.nameTe.includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.pincode.includes(q)
        );
      }).slice(0, 6)
    : [];

  const handleSelectPlace = (place: CoastalPlace) => {
    const displayName = locale === "te" ? `${place.nameTe} (${place.pincode})` : `${place.name} (${place.pincode})`;
    setPlaceSearchQuery(displayName);
    setShowPlaceSuggestions(false);
    setSelectedLocation({
      name: locale === "te" ? place.nameTe : place.name,
      lat: place.lat,
      lon: place.lon,
    });
    setCustomLat(place.lat.toString());
    setCustomLon(place.lon.toString());
    setCoordErrorCode(null);
    searchShelters(place.lat, place.lon, selectedScenarioId);
  };

  const handleLocationSelect = (loc: { name: string; lat: number; lon: number }) => {
    setSelectedLocation(loc);
    setPlaceSearchQuery(loc.name);
    setShowPlaceSuggestions(false);
    setCustomLat(loc.lat.toString());
    setCustomLon(loc.lon.toString());
    setCoordErrorCode(null);
    searchShelters(loc.lat, loc.lon, selectedScenarioId);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateCoordinates(customLat, customLon);
    if (valid) {
      searchShelters(valid.lat, valid.lon, selectedScenarioId);
    }
    // Do not wipe shelters on invalid input: keep previous shelters and show error above
  };

  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setCoordErrorCode("GEO_UNAVAILABLE");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setCustomLat(lat.toString());
        setCustomLon(lon.toString());
        const locLabel = locale === "te" ? `నా స్థానం (GPS: ${lat}, ${lon})` : `My GPS Location (${lat}, ${lon})`;
        setPlaceSearchQuery(locLabel);
        setSelectedLocation({ name: locLabel, lat, lon });
        setShowPlaceSuggestions(false);
        setCoordErrorCode(null);
        searchShelters(lat, lon, selectedScenarioId);
        setLoadingLocation(false);
      },
      (err) => {
        setLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setCoordErrorCode("GEO_DENIED");
        } else {
          setCoordErrorCode("GEO_UNAVAILABLE");
        }
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
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
                <span className="text-rose-300 block text-[10px]">{t.storm_category}</span>
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

          {/* Primary Citizen-Friendly Location / Pincode Search Bar */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.search_place_label}</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2 relative">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={placeSearchQuery}
                  onChange={(e) => {
                    setPlaceSearchQuery(e.target.value);
                    setShowPlaceSuggestions(true);
                  }}
                  onFocus={(e) => {
                    setShowPlaceSuggestions(true);
                    e.target.select();
                  }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredPlaces.length > 0) {
                        handleSelectPlace(filteredPlaces[0]);
                      }
                    }
                  }}
                  placeholder={t.search_place_placeholder}
                  data-testid="place-search-input"
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
                />

                {placeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlaceSearchQuery("");
                      setShowPlaceSuggestions(true);
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs font-mono"
                  >
                    ✕
                  </button>
                )}

                {/* Instant Autocomplete Suggestions */}
                {showPlaceSuggestions && filteredPlaces.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800/80">
                    {filteredPlaces.map((place) => (
                      <button
                        key={`${place.name}-${place.pincode}`}
                        type="button"
                        data-testid="place-suggestion-item"
                        onClick={() => handleSelectPlace(place)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-900 transition flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <span className="font-bold text-white block">
                              {locale === "te" ? place.nameTe : place.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {place.district} District • PIN: {place.pincode}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Large GPS Detect Button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={loadingLocation}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow cursor-pointer whitespace-nowrap"
              >
                {loadingLocation ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>📍</span>
                )}
                <span>{loadingLocation ? t.calculating : t.use_my_location}</span>
              </button>
            </div>
          </div>

          {/* Active Area Indicator */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">{t.selected_area}:</span>
              <strong className="text-white font-semibold">{selectedLocation.name}</strong>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              GPS: {customLat}° N, {customLon}° E
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

          {/* Manual Coordinate Form with Robust Validation (For advanced/testing/emergency override) */}
          <form onSubmit={handleCustomSearch} className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mb-1">
              <span>⚙ {t.advanced_coords}:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono">Lat:</span>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => {
                    setCustomLat(e.target.value);
                    if (coordErrorCode) setCoordErrorCode(null);
                  }}
                  placeholder="e.g. 15.865"
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
                    if (coordErrorCode) setCoordErrorCode(null);
                  }}
                  placeholder="e.g. 80.505"
                  className="w-28 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loadingShelters}
                className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 text-white font-medium transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                {loadingShelters && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{loadingShelters ? t.calculating : t.find_shelter_btn}</span>
              </button>
            </div>

            {/* Validation Error Alert Banner */}
            {coordErrorCode && ERROR_MESSAGES[coordErrorCode] && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{ERROR_MESSAGES[coordErrorCode][locale]}</span>
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

                  {/* Directions and Helpline Quick Links */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat || 15.85},${s.lon || 80.51}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[11px] font-bold text-center flex items-center justify-center gap-1 transition"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{t.directions}</span>
                    </a>
                    <a
                      href="tel:1070"
                      className="py-1.5 px-3 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{t.call_helpline}</span>
                    </a>
                  </div>
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

      {/* Sticky Bottom Emergency Quick-Action Bar */}
      <div className="sticky bottom-0 z-40 bg-rose-950/95 border-t border-rose-800/80 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-2 text-rose-200 text-xs font-semibold">
          <PhoneCall className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>{locale === "te" ? "24/7 రాష్ట్ర అత్యవసర హెల్ప్‌లైన్:" : "24/7 State Emergency Helplines:"}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:1070"
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <PhoneCall className="w-3 h-3" />
            <span>{t.call_helpline} (SDMA)</span>
          </a>
          <a
            href="tel:112"
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <PhoneCall className="w-3 h-3" />
            <span>{t.call_police}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
