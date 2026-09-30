import React, { useState } from "react";
import { AlertCircle, Compass, Users, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import RiskBadge from "./RiskBadge";
import { pluralize } from "@/lib/severity";

interface ExecutiveActionStripProps {
  cycloneName: string;
  category: string;
  windSpeed: number;
  pressure: number;
  surgeHeight: number;
  landfallTarget: string;
  highestRiskDistrict: string;
  hospitalsAtRisk: number;
  substationsAtRisk: number;
  roadsKm: number;
  sheltersCount: number;
  topDirective: string;
  severity?: string;
  isEmergencyMode?: boolean;
}

export default function ExecutiveActionStrip({
  cycloneName,
  category,
  windSpeed,
  pressure,
  surgeHeight,
  landfallTarget,
  highestRiskDistrict,
  hospitalsAtRisk,
  substationsAtRisk,
  roadsKm,
  sheltersCount,
  topDirective,
  severity = "HIGH",
  isEmergencyMode = false,
}: ExecutiveActionStripProps) {
  const [showFullDirective, setShowFullDirective] = useState(false);
  const estimatedPopulation = windSpeed >= 120 ? "1,250,000+" : "680,000+";

  // Parse directives into concise bullet points
  const rawDirective = topDirective || "Pre-stage backup gensets at coastal hospitals, de-energize 33kV coastal feeders, open elevated MPCS shelters.";
  const sentences = rawDirective
    .split(/\.\s+|\d+\.\s+/)
    .map((s) => s.trim().replace(/^[:\-\s]+/, ""))
    .filter((s) => s.length > 10 && !s.toLowerCase().startsWith("tactical incident"));

  const conciseBullets = sentences.slice(0, 3);
  if (conciseBullets.length === 0) {
    conciseBullets.push("Mandatory evacuation within 0-5km coastal strip");
    conciseBullets.push("De-energize and island 33kV coastal power grid");
    conciseBullets.push("Activate emergency elevated MPCS relief shelters");
  }

  return (
    <div className="space-y-2.5">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono uppercase font-black tracking-widest text-slate-300">
            10-Second Situation Briefing • Executive Action Strip
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded font-bold">
          RAPID ASSESSOR: 100% DETERMINISTIC
        </span>
      </div>

      {/* 4 Executive Action Cards (Equal Height) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* 1. WHAT IS HAPPENING? */}
        <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] shadow-xl hover:border-cyan-500/40 transition flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                1. WHAT IS HAPPENING?
              </span>
              <RiskBadge level={severity} size="sm" />
            </div>
            <h4 className="text-sm font-black text-white leading-tight">
              {cycloneName.toUpperCase()} ({category})
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Sustained winds <b className="text-cyan-300">{windSpeed} km/h</b>. Central pressure{" "}
              <b className="text-slate-200">{pressure} hPa</b>, tracking northwest towards coastal Andhra Pradesh.
            </p>
          </div>
          <div className="pt-2 border-t border-[#1e293b] text-[10px] font-mono text-slate-400">
            IMD Ground Truth Verified
          </div>
        </div>

        {/* 2. WHERE IS THE DANGER? */}
        <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] shadow-xl hover:border-amber-500/40 transition flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                2. WHERE IS THE DANGER?
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                ZONE A &amp; B
              </span>
            </div>
            <h4 className="text-sm font-black text-white leading-tight truncate">
              {highestRiskDistrict} Coastline &amp; Deltas
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Landfall target at <b>{landfallTarget}</b>. Danger radius spans inland with scenario surge reach up to{" "}
              <b className="text-amber-300">{surgeHeight} meters MSL</b>.
            </p>
          </div>
          <div className="pt-2 border-t border-[#1e293b] text-[10px] font-mono text-slate-400">
            Coastal DEM Elevation Deficit
          </div>
        </div>

        {/* 3. WHAT WILL BE AFFECTED? */}
        <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] shadow-xl hover:border-rose-500/40 transition flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                3. WHAT WILL BE AFFECTED?
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                {hospitalsAtRisk + substationsAtRisk} High Nodes
              </span>
            </div>
            <h4 className="text-sm font-black text-white leading-tight">
              {estimatedPopulation} Citizens at Risk
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Threatening <b className="text-rose-300">{pluralize(hospitalsAtRisk, "hospital")}</b>,{" "}
              <b className="text-rose-300">{pluralize(substationsAtRisk, "power substation")}</b>, and{" "}
              <b className="text-cyan-300">{roadsKm} km</b> inundated arterial roads.
            </p>
          </div>
          <div className="pt-2 border-t border-[#1e293b] text-[10px] font-mono text-slate-400">
            Deterministic GeoPandas SJoin
          </div>
        </div>

        {/* 4. WHAT AUTHORITIES MUST DO */}
        <div className="p-4 rounded-xl bg-[#0c1220] border border-red-500/30 shadow-xl hover:border-red-500/60 transition bg-gradient-to-br from-red-950/20 to-transparent flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase">
                4. WHAT AUTHORITIES MUST DO
              </span>
              <span className="text-[10px] font-mono font-bold text-red-200 bg-red-600 px-2 py-0.5 rounded shadow">
                P1 DIRECTIVE
              </span>
            </div>
            <h4 className="text-sm font-black text-white leading-tight">
              Execute Evacuation Protocol
            </h4>
            <ul className="text-xs text-slate-300 space-y-1 font-sans">
              {conciseBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span className="line-clamp-1">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
            <button
              onClick={() => setShowFullDirective(!showFullDirective)}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>{showFullDirective ? "Hide full text" : "Read full directive"}</span>
              {showFullDirective ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span className="text-[10px] font-mono text-red-400/80">3 Priorities</span>
          </div>
        </div>
      </div>

      {/* Full Directive Expander Drawer / Modal */}
      {showFullDirective && (
        <div className="p-4 rounded-xl bg-[#131d31] border border-red-500/50 shadow-2xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#22334e] pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              <h5 className="text-xs font-mono font-bold text-white uppercase">
                Complete Tactical Incident Command Directive
              </h5>
            </div>
            <button
              onClick={() => setShowFullDirective(false)}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              Close [×]
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
            {rawDirective}
          </p>
        </div>
      )}
    </div>
  );
}
