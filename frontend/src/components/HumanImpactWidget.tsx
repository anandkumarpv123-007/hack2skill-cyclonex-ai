"use client";

import React from "react";
import { Users, Home, HeartPulse, ShieldAlert, CheckCircle2 } from "lucide-react";
import RiskBadge from "./RiskBadge";

interface HumanImpactWidgetProps {
  windSpeed: number;
  highestRiskDistrict: string;
  sheltersAtRisk: number;
  hospitalsAtRisk: number;
}

export default function HumanImpactWidget({
  windSpeed,
  highestRiskDistrict,
  sheltersAtRisk,
  hospitalsAtRisk,
}: HumanImpactWidgetProps) {
  const populationExposed = windSpeed >= 120 ? 1250000 : 680000;
  const evacuatedCount = Math.round(populationExposed * 0.78);
  const evacuationPercent = 78;
  const shelterCapacity = 14500;
  const shelterOccupancy = 11200;

  return (
    <div className="bg-[#0c1220] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              HUMAN IMPACT &amp; LIFELINE CASUALTY MODEL
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Demographic Exposure &amp; Safe Shelter Allocation Telemetry
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-bold">
          ZERO-CASUALTY PROTOCOL ACTIVE
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Population Exposed */}
        <div className="p-3.5 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            POPULATION EXPOSED (ZONE A/B)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-white font-mono">
              {populationExposed.toLocaleString()}+
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">High Density</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Coastal mandals within 50kt wind swath
          </span>
        </div>

        {/* Evacuation Progress */}
        <div className="p-3.5 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400 uppercase">EVACUATION RATE</span>
            <span className="text-emerald-400 font-bold">{evacuationPercent}% COMPLETED</span>
          </div>
          <div className="w-full h-2 bg-[#090d16] rounded-full overflow-hidden border border-[#22334e]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
              style={{ width: `${evacuationPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-300 block">
            {evacuatedCount.toLocaleString()} relocated to certified MPCS
          </span>
        </div>

        {/* Shelter Capacity */}
        <div className="p-3.5 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            SHELTER OCCUPANCY
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-cyan-400 font-mono">
              {shelterOccupancy.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-slate-400">/ {shelterCapacity.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            3,300 available beds in elevated shelters
          </span>
        </div>

        {/* Trauma Facility Status */}
        <div className="p-3.5 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            HOSPITAL ICU RESILIENCE
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-400 font-mono">
              100%
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Genset Backed</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            {hospitalsAtRisk} facilities with 72h auxiliary diesel
          </span>
        </div>
      </div>
    </div>
  );
}
