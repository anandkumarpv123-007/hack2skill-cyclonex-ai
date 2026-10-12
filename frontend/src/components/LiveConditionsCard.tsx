"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CloudSun, RefreshCw, Wind, Gauge, Droplets, Waves, Thermometer } from "lucide-react";
import { fetchLiveConditions, LiveConditions } from "@/lib/api";

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const compass = (deg: number | null | undefined) =>
  deg == null ? "" : COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];

const fmt = (v: number | null | undefined, digits = 0) =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(digits);

/**
 * Real-time current conditions at the scenario's landfall point (Open-Meteo via the CYCLONEX backend).
 * Clearly separated from the historical cyclone scenario; degrades to a quiet "unavailable" state.
 */
export default function LiveConditionsCard({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  const [data, setData] = useState<LiveConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await fetchLiveConditions(lat, lon, label));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, label]);

  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) load();
  }, [lat, lon, load]);

  const live = data?.status === "live" && data.conditions;
  const c = data?.conditions;
  const observed = data?.observed_at ? data.observed_at.replace("T", " ") : null;

  const tile = "p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-0.5";
  const lab = "text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1";
  const val = "text-lg font-black text-white font-mono";

  return (
    <div className="bg-[#0c1220] border border-emerald-800/40 rounded-2xl p-5 shadow-2xl space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
              Live conditions now · {label}
              {live && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/70 border border-emerald-700 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                </span>
              )}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Real-time Open-Meteo data{observed ? ` · observed ${observed} IST` : ""} · scenario above is a historical benchmark
            </span>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#131d31] hover:bg-[#1a2742] text-xs font-mono text-emerald-300 border border-[#22334e] transition"
          title="Fetch latest live conditions"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {live && c ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className={tile}>
              <span className={lab}><Wind className="w-3 h-3" /> Wind</span>
              <span className={val}>{fmt(c.wind_speed_kmh)}<span className="text-xs text-slate-400 font-normal"> km/h {compass(c.wind_direction_deg)}</span></span>
            </div>
            <div className={tile}>
              <span className={lab}><Wind className="w-3 h-3" /> Gusts</span>
              <span className={val}>{fmt(c.wind_gusts_kmh)}<span className="text-xs text-slate-400 font-normal"> km/h</span></span>
            </div>
            <div className={tile}>
              <span className={lab}><Gauge className="w-3 h-3" /> Pressure</span>
              <span className={val}>{fmt(c.surface_pressure_hpa)}<span className="text-xs text-slate-400 font-normal"> hPa</span></span>
            </div>
            <div className={tile}>
              <span className={lab}><Droplets className="w-3 h-3" /> Rain (now)</span>
              <span className={val}>{fmt(c.precipitation_mm, 1)}<span className="text-xs text-slate-400 font-normal"> mm</span></span>
            </div>
            <div className={tile}>
              <span className={lab}><Waves className="w-3 h-3" /> Wave height</span>
              <span className={val}>{fmt(c.wave_height_m, 1)}<span className="text-xs text-slate-400 font-normal"> m</span></span>
            </div>
            <div className={tile}>
              <span className={lab}><Thermometer className="w-3 h-3" /> Temp · RH</span>
              <span className={val}>{fmt(c.temperature_c)}°<span className="text-xs text-slate-400 font-normal"> · {fmt(c.relative_humidity_pct)}%</span></span>
            </div>
          </div>
          <p className={`text-[11px] font-mono ${data?.cyclonic_winds_now ? "text-rose-300" : "text-slate-400"}`}>
            {data?.cyclonic_winds_now
              ? `Live winds are at or above the ${fmt(data?.cyclonic_wind_threshold_kmh)} km/h cyclonic threshold — check official IMD bulletins.`
              : `No cyclonic winds at this point right now (below ${fmt(data?.cyclonic_wind_threshold_kmh)} km/h). The impact analysis above runs on the selected benchmark scenario.`}
          </p>
        </>
      ) : (
        <p className="text-[11px] font-mono text-slate-400">
          {loading
            ? "Fetching live conditions…"
            : failed || data?.status === "unavailable"
            ? "Live conditions are temporarily unavailable. The scenario analysis is unaffected."
            : "—"}
        </p>
      )}
    </div>
  );
}
