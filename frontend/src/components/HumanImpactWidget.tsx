"use client";

import React from "react";
import { Users } from "lucide-react";

interface EvaluatedAsset {
  category?: string;
  type?: string;
  capacity?: number;
  in_surge_zone?: boolean;
  in_64kt_wind?: boolean;
  in_50kt_wind?: boolean;
  in_34kt_wind?: boolean;
}

interface HumanImpactWidgetProps {
  windSpeed: number;
  highestRiskDistrict: string;
  sheltersAtRisk: number;
  hospitalsAtRisk: number;
  evaluatedAssets?: EvaluatedAsset[];
}

const isKind = (a: EvaluatedAsset, kind: string) =>
  `${a.category || ""} ${a.type || ""}`.toLowerCase().includes(kind);

/**
 * Lifeline exposure summary. Every figure is computed from the deterministic engine's
 * evaluated assets for the active scenario — no hard-coded operational statistics.
 */
export default function HumanImpactWidget({ highestRiskDistrict, evaluatedAssets = [] }: HumanImpactWidgetProps) {
  const shelters = evaluatedAssets.filter((a) => isKind(a, "shelter"));
  const hospitals = evaluatedAssets.filter((a) => isKind(a, "hospital"));
  const substations = evaluatedAssets.filter((a) => isKind(a, "substation") || isKind(a, "power"));

  const sheltersInStorm = shelters.filter((s) => s.in_34kt_wind);
  const usableShelters = sheltersInStorm.filter((s) => !s.in_surge_zone);
  const compromisedShelters = shelters.filter((s) => s.in_surge_zone);
  const usableCapacity = usableShelters.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);

  const hospitals64 = hospitals.filter((h) => h.in_64kt_wind).length;
  const hospitals50 = hospitals.filter((h) => h.in_50kt_wind).length;
  const hospitalsSurge = hospitals.filter((h) => h.in_surge_zone).length;

  const subs64 = substations.filter((s) => s.in_64kt_wind).length;
  const subsSurge = substations.filter((s) => s.in_surge_zone).length;

  const card = "p-3.5 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1";
  const label = "text-[10px] font-mono text-slate-400 block uppercase";
  const note = "text-[10px] text-slate-400 block";

  return (
    <div className="bg-[#0c1220] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              LIFELINE EXPOSURE SUMMARY
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Computed by the deterministic engine for this scenario · {evaluatedAssets.length} assets evaluated
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-700/60 px-2 py-0.5 rounded font-bold whitespace-nowrap">
          SCENARIO ESTIMATE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={card}>
          <span className={label}>Usable shelter capacity</span>
          <span className="text-xl font-black text-cyan-400 font-mono block">{usableCapacity.toLocaleString()}</span>
          <span className={note}>
            {usableShelters.length} of {sheltersInStorm.length} shelters in the storm zone are above the surge
          </span>
        </div>

        <div className={card}>
          <span className={label}>Shelters compromised by surge</span>
          <span className={`text-xl font-black font-mono block ${compromisedShelters.length ? "text-rose-400" : "text-emerald-400"}`}>
            {compromisedShelters.length}
          </span>
          <span className={note}>
            {compromisedShelters.length ? "Keep locked; redirect evacuees inland" : "No registered shelter below the surge line"}
          </span>
        </div>

        <div className={card}>
          <span className={label}>Hospitals exposed</span>
          <span className="text-xl font-black text-amber-300 font-mono block">
            {hospitals64} <span className="text-xs text-slate-400 font-normal">in 64-kt</span>
          </span>
          <span className={note}>
            {hospitals50} in 50-kt swath (zones nested) · {hospitalsSurge} in surge zone
          </span>
        </div>

        <div className={card}>
          <span className={label}>Power substations exposed</span>
          <span className="text-xl font-black text-amber-300 font-mono block">
            {subs64} <span className="text-xs text-slate-400 font-normal">in 64-kt</span>
          </span>
          <span className={note}>
            {subsSurge} in surge zone · priority district: {highestRiskDistrict}
          </span>
        </div>
      </div>
    </div>
  );
}
