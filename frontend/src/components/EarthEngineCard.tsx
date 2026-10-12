"use client";

import React, { useEffect, useState } from "react";
import { Satellite } from "lucide-react";
import { fetchTerrainCheck, TerrainCheck } from "@/lib/api";

/**
 * Live Google Earth Engine terrain cross-check. Renders nothing unless Earth Engine is live,
 * so an unconfigured deployment never shows a broken or misleading panel.
 */
export default function EarthEngineCard({ cycloneId }: { cycloneId: string }) {
  const [data, setData] = useState<TerrainCheck | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetchTerrainCheck(cycloneId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [cycloneId]);

  if (!data || data.status !== "live") return null;

  const tile = "p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-0.5";
  const lab = "text-[10px] font-mono text-slate-400 uppercase block";
  const val = "text-lg font-black text-white font-mono";

  return (
    <div className="bg-[#0c1220] border border-sky-800/40 rounded-2xl p-5 shadow-2xl space-y-3">
      <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-2.5">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/25">
          <Satellite className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
            Google Earth Engine terrain check
            <span className="text-[10px] text-sky-200 bg-sky-950/70 border border-sky-700 px-1.5 py-0.5 rounded">LIVE QUERY</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {data.source} · {data.radius_km} km around {(data.landfall_target || "landfall").split(",")[0]} · threshold = scenario surge {data.surge_height_m} m
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={tile}>
          <span className={lab}>Land below surge level</span>
          <span className="text-lg font-black text-sky-300 font-mono">{data.land_fraction_below_surge_pct ?? "—"}%</span>
        </div>
        <div className={tile}>
          <span className={lab}>Low-lying land area</span>
          <span className={val}>{data.land_area_below_surge_km2 ?? "—"}<span className="text-xs text-slate-400 font-normal"> km²</span></span>
        </div>
        <div className={tile}>
          <span className={lab}>Mean land elevation</span>
          <span className={val}>{data.mean_land_elevation_m ?? "—"}<span className="text-xs text-slate-400 font-normal"> m</span></span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 font-mono">{data.note}</p>
    </div>
  );
}
