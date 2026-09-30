"use client";

import React, { useState } from "react";
import { Clock, Wind, Gauge, MapPin, AlertTriangle, CheckCircle2, ChevronRight, Waves } from "lucide-react";
import RiskBadge from "./RiskBadge";

interface TimelineStep {
  time: string;
  label: string;
  wind: number;
  pressure: number;
  distCoast: number;
  stage: string;
  milestone: string;
  severity: string;
}

interface PredictiveTimelineWidgetProps {
  cycloneName: string;
  peakWindKmh: number;
  minPressureHpa: number;
  landfallTarget: string;
}

export default function PredictiveTimelineWidget({
  cycloneName,
  peakWindKmh,
  minPressureHpa,
  landfallTarget,
}: PredictiveTimelineWidgetProps) {
  const steps: TimelineStep[] = [
    {
      time: "NOW (0h)",
      label: "Offshore Eyewall Surge",
      wind: peakWindKmh,
      pressure: minPressureHpa,
      distCoast: 65,
      stage: "Deep Ocean Circulation",
      milestone: `Gale squalls reaching shoreline. High storm surge run-up building in estuaries near ${landfallTarget}.`,
      severity: "EXTREME",
    },
    {
      time: "+6 HOURS",
      label: "Immediate Shoreline Proximity",
      wind: Math.min(peakWindKmh + 5, 250),
      pressure: minPressureHpa - 4,
      distCoast: 38,
      stage: "Pre-Landfall Eyewall Gale",
      milestone: "Destructive winds exceed 100 km/h across ports. Mandatory zero-casualty evacuation finalized.",
      severity: "EXTREME",
    },
    {
      time: "+12 HOURS",
      label: "PROJECTED LANDFALL",
      wind: peakWindKmh,
      pressure: minPressureHpa + 2,
      distCoast: 0,
      stage: "Direct Coastal Inundation",
      milestone: `Eye crosses coastline near ${landfallTarget}. Peak tidal wave run-up and zero-visibility torrential squalls.`,
      severity: "EXTREME",
    },
    {
      time: "+24 HOURS",
      label: "Inland Propagation",
      wind: Math.max(peakWindKmh - 45, 65),
      pressure: minPressureHpa + 18,
      distCoast: 85,
      stage: "Severe Cyclonic Storm (Inland)",
      milestone: "Widespread tree uprooting and feeder trip-outs. River catchments enter peak flood stages.",
      severity: "HIGH",
    },
    {
      time: "+36 HOURS",
      label: "Delta Drainage Flood Peak",
      wind: Math.max(peakWindKmh - 75, 45),
      pressure: minPressureHpa + 28,
      distCoast: 140,
      stage: "Cyclonic Depression",
      milestone: "Gale winds recede. Secondary riverine and pluvial backwater flooding peaks across delta cities.",
      severity: "MODERATE",
    },
    {
      time: "+48 HOURS",
      label: "System Dissipation",
      wind: Math.max(peakWindKmh - 95, 30),
      pressure: minPressureHpa + 35,
      distCoast: 210,
      stage: "Well-Marked Low",
      milestone: "Remnants dissipate inland. Municipal damage assessment teams and road clearing convoys commence.",
      severity: "LOW",
    },
  ];

  const [activeStep, setActiveStep] = useState<TimelineStep>(steps[2]); // Default: +12h Landfall

  return (
    <div className="bg-[#0c1220] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              WHAT HAPPENS NEXT? — PREDICTIVE TIMELINE
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Deterministic Trajectory &amp; Forward Decay Model
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
          CLICK ANY TIMELINE STEP
        </span>
      </div>

      {/* 6 Step Horizontal Timeline Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((st, idx) => {
          const isActive = activeStep.time === st.time;
          return (
            <button
              key={idx}
              onClick={() => setActiveStep(st)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                isActive
                  ? "bg-gradient-to-b from-cyan-950/60 to-[#0f172a] border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50"
                  : "bg-[#131d31] border-[#22334e] hover:border-slate-600 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400">
                  {st.time}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    st.severity === "EXTREME"
                      ? "bg-red-500"
                      : st.severity === "HIGH"
                      ? "bg-orange-500"
                      : "bg-yellow-500"
                  }`}
                />
              </div>

              <div>
                <span className="text-xs font-bold text-white block leading-tight">
                  {st.label}
                </span>
              </div>

              <div className="pt-1 border-t border-[#22334e] flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-cyan-300 font-semibold">{st.wind} km/h</span>
                <span>{st.distCoast}km coast</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Deep-Dive Card */}
      <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
              Phase {activeStep.time}: {activeStep.stage}
            </span>
            <RiskBadge level={activeStep.severity} size="sm" />
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans max-w-2xl">
            {activeStep.milestone}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#22334e] text-center">
            <span className="text-[9px] text-slate-500 block uppercase">WIND SPEED</span>
            <span className="text-cyan-400 font-black text-sm">{activeStep.wind} km/h</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#22334e] text-center">
            <span className="text-[9px] text-slate-500 block uppercase">PRESSURE</span>
            <span className="text-white font-black text-sm">{activeStep.pressure} hPa</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#22334e] text-center">
            <span className="text-[9px] text-slate-500 block uppercase">DISTANCE</span>
            <span className="text-amber-400 font-black text-sm">{activeStep.distCoast} km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
