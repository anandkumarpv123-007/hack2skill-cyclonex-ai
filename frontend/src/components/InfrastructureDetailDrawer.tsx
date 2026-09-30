"use client";

import React from "react";
import {
  X,
  Building2,
  ShieldAlert,
  MapPin,
  Users,
  Wind,
  Waves,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Layers,
} from "lucide-react";
import RiskBadge, { getRiskColor } from "./RiskBadge";

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: string;
  district: string;
  lat: number;
  lon: number;
  elevation_m?: number;
  distance_from_coast_km?: number;
  surge_margin_m?: number;
  risk_level: string;
  vulnerability_score?: number;
  in_surge_zone?: boolean;
  in_extreme_wind?: boolean;
  capacity?: number;
  operational_status?: string;
  recommended_action?: string;
}

interface InfrastructureDetailDrawerProps {
  asset: InfrastructureAsset | null;
  onClose: () => void;
  cycloneName: string;
  surgeHeight?: number;
}

export default function InfrastructureDetailDrawer({
  asset,
  onClose,
  cycloneName,
  surgeHeight = 2.2,
}: InfrastructureDetailDrawerProps) {
  if (!asset) return null;

  const colors = getRiskColor(asset.risk_level);
  const elevation = asset.elevation_m !== undefined ? asset.elevation_m : 4.5;
  const distCoast = asset.distance_from_coast_km !== undefined ? asset.distance_from_coast_km : 3.2;
  const score = asset.vulnerability_score !== undefined ? asset.vulnerability_score : 84;
  const surgeMargin = asset.surge_margin_m !== undefined ? asset.surge_margin_m : Number((elevation - surgeHeight).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border-l border-[#1e293b] h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        <div className="space-y-6">
          {/* Top Title & Close */}
          <div className="flex items-start justify-between border-b border-[#1e293b] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  {asset.type}
                </span>
                <RiskBadge level={asset.risk_level} size="sm" />
              </div>
              <h2 className="text-lg font-black text-white mt-1 leading-snug">
                {asset.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  {asset.district} District • {distCoast} km from coast
                </span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#151f32] text-slate-400 hover:text-white border border-[#22334e] transition cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vulnerability Index Score Banner */}
          <div className="bg-[#131d31] border border-[#22334e] rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
              VULNERABILITY INDEX SCORE
            </span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black font-mono text-white">
                {score}<span className="text-sm text-slate-400 font-normal">/100</span>
              </span>
              <RiskBadge level={asset.risk_level} size="md" />
            </div>
            <div className="w-full h-2 bg-[#090d16] rounded-full overflow-hidden border border-[#22334e]">
              <div
                className={`h-full rounded-full ${colors.bar}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Asset Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">ELEVATION (MSL)</span>
              <span className="text-white font-bold">{elevation} meters</span>
              <span className={`text-[10px] font-bold block ${surgeMargin < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                Surge margin: {surgeMargin >= 0 ? "+" : ""}{surgeMargin}m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">COASTAL DISTANCE</span>
              <span className="text-cyan-300 font-bold">{distCoast} km</span>
              <span className={`text-[10px] block ${distCoast <= 5 ? "text-rose-400" : distCoast <= 15 ? "text-amber-400" : "text-slate-400"}`}>
                {distCoast <= 5 ? "Zone A Proximity (<5km)" : distCoast <= 15 ? "Zone B Proximity (5-15km)" : "Inland (>15km)"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">GEOGRAPHIC COORDS</span>
              <span className="text-white font-bold truncate block">
                {asset.lat.toFixed(3)}°N, {asset.lon.toFixed(3)}°E
              </span>
              <span className="text-[10px] text-slate-400 block">WGS-84 Datum</span>
            </div>

            <div className="p-3 rounded-xl bg-[#131d31] border border-[#22334e] space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">AUXILIARY POWER</span>
              <span className="text-emerald-400 font-bold">100% Operational</span>
              <span className="text-[10px] text-slate-400 block">72h Diesel Genset</span>
            </div>
          </div>

          {/* Threat Exposure Details */}
          <div className="p-4 rounded-xl bg-[#131d31] border border-[#22334e] space-y-3">
            <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Multi-Hazard Exposure Factors</span>
            </h4>

            <ul className="space-y-2 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <Wind className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Located within active <b>50-knot storm wind swath</b> of {cycloneName}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Ground elevation is below estimated scenario surge envelope baseline.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Requires sequential islanding protocol 4 hours prior to landfall.
                </span>
              </li>
            </ul>
          </div>

          {/* Recommended Operational Action */}
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2">
            <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">
              MANDATORY OPERATIONAL DIRECTIVE
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
              {asset.recommended_action ||
                "Execute vertical evacuation of ground floor ICU equipment and pharmaceuticals. Activate auxiliary generator and seal low-level cable conduits against saline intrusion."}
            </p>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            Node ID: {asset.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
