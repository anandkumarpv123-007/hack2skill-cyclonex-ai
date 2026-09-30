import React from "react";
import { AlertTriangle, ShieldAlert, ArrowRight, Wind, Waves } from "lucide-react";
import RiskBadge from "./RiskBadge";

interface EmergencyBannerProps {
  cycloneName: string;
  category: string;
  windSpeed: number;
  surgeHeight: number;
  landfallTarget: string;
  highestRiskDistrict: string;
  onViewMap: () => void;
}

export default function EmergencyBanner({
  cycloneName,
  category,
  windSpeed,
  surgeHeight,
  landfallTarget,
  highestRiskDistrict,
  onViewMap,
}: EmergencyBannerProps) {
  return (
    <div className="bg-gradient-to-r from-red-950/90 via-red-900/60 to-red-950/90 border-b border-red-500/40 px-4 sm:px-6 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: Critical Strobe & Storm Details */}
        <div className="flex items-start sm:items-center space-x-3 min-w-0">
          <div className="p-2 rounded-xl bg-red-600/30 border border-red-500/60 text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse text-red-400" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-mono text-[11px] font-black tracking-widest text-red-400 uppercase">
                ⚠ CYCLONE IMPACT THREAT ALERT
              </span>
              <RiskBadge level="EXTREME" size="sm" />
              <span className="text-white font-bold tracking-wide">
                • {cycloneName.toUpperCase()} ({category})
              </span>
            </div>

            <p className="text-slate-300 text-xs truncate max-w-3xl">
              Severe conditions threatening <b>{highestRiskDistrict}</b> &amp; {landfallTarget}.
              Eyewall winds reaching <b className="text-red-300">{windSpeed} km/h</b> with coastal surge up to{" "}
              <b className="text-cyan-300">{surgeHeight} meters</b>.
            </p>

            <div className="hidden lg:flex items-center space-x-4 text-[11px] text-slate-300 font-mono pt-0.5">
              <span><b>P1 Directive:</b> Mandatory evacuation 0-5km coastal strip</span>
              <span>•</span>
              <span><b>Grid:</b> Island 33kV coastal feeders</span>
              <span>•</span>
              <span><b>Transit:</b> Stage de-watering pumps on NH-16 culverts</span>
            </div>
          </div>
        </div>

        {/* Right Action CTA */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
          <button
            onClick={onViewMap}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-lg shadow-red-950 transition cursor-pointer"
          >
            <span>VIEW GEOSPATIAL RISK MAP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
