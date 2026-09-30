"use client";

import React, { useState } from "react";
import {
  Wind,
  CloudRain,
  Waves,
  Building2,
  Activity,
  Info,
  Gauge,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import RiskBadge from "./RiskBadge";

interface ThreatRadarWidgetProps {
  windSpeed: number;
  pressure: number;
  surgeHeight: number;
  rainfallMm: number;
  infraNodesAtRisk: number;
  district: string;
}

export default function ThreatRadarWidget({
  windSpeed,
  pressure,
  surgeHeight,
  rainfallMm,
  infraNodesAtRisk,
  district,
}: ThreatRadarWidgetProps) {
  const [selectedThreat, setSelectedThreat] = useState<any | null>(null);

  // Derive scores from actual physical measurements
  const windScore = Math.min(Math.round((windSpeed / 200) * 100), 100);
  const surgeScore = Math.min(Math.round((surgeHeight / 5) * 100), 100);
  const rainfallScore = Math.min(Math.round((rainfallMm / 300) * 100), 100);
  const floodScore = Math.min(Math.round(((surgeHeight * 12 + rainfallMm * 0.2) / 100) * 100), 100);
  const infraScore = Math.min(Math.round((infraNodesAtRisk / 15) * 100), 100);

  const threats = [
    {
      id: "wind",
      name: "Wind Forcing",
      score: windScore,
      level: windScore >= 70 ? "EXTREME" : windScore >= 50 ? "HIGH" : "MODERATE",
      icon: Wind,
      color: "#ef4444",
      metric: `${windSpeed} km/h (Peak Gusts: ${Math.round(windSpeed * 1.25)} km/h)`,
      evidence: [
        `Maximum sustained eyewall wind speeds of ${windSpeed} km/h exceed IMD severe cyclone threshold.`,
        `Dynamic pressure forces create structural harmonic drag on transmission towers and bridges.`,
        `Gale wind swath extends outwards over a 150km radial radius from storm eye.`,
      ],
    },
    {
      id: "surge",
      name: "Storm Surge",
      score: surgeScore,
      level: surgeScore >= 60 ? "HIGH" : "MODERATE",
      icon: Waves,
      color: "#06b6d4",
      metric: `Scenario Surge: ${surgeHeight} meters MSL`,
      evidence: [
        `Barometric pressure drop (${pressure} hPa) elevates sea surface by ~1cm per 1 hPa deficit.`,
        `Astronomical wave run-up of ${surgeHeight}m threatens saline bunds and coastal causeways.`,
        `Bay of Bengal shallow continental shelf bathymetry amplifies coastal water piling.`,
      ],
    },
    {
      id: "flood",
      name: "Inland Flood",
      score: floodScore,
      level: floodScore >= 65 ? "HIGH" : "MODERATE",
      icon: Activity,
      color: "#6366f1",
      metric: "Deltaic Drainage Lock",
      evidence: [
        `Low coastal elevation across ${district} delta hampers natural gravitational discharge.`,
        "Coincident high storm surge creates hydraulic backwater lock in rivers and canals.",
        "Saturated soil saturation index produces immediate surface pluvial pooling.",
      ],
    },
    {
      id: "rainfall",
      name: "Precipitation",
      score: rainfallScore,
      level: rainfallScore >= 65 ? "HIGH" : "MODERATE",
      icon: CloudRain,
      color: "#3b82f6",
      metric: `24h: ${rainfallMm} mm`,
      evidence: [
        `Projected 24-hour rainfall accumulation of ${rainfallMm} mm triggers culvert washouts.`,
        "Dense convective spiral rainbands sustain torrential precipitation rates over 8-12 hours.",
        "Low-lying NH-16 highway culverts face imminent inundation chokepoints.",
      ],
    },
    {
      id: "infra",
      name: "Infra Stress",
      score: infraScore,
      level: infraScore >= 60 ? "HIGH" : "MODERATE",
      icon: Building2,
      color: "#f97316",
      metric: `${infraNodesAtRisk} Critical Nodes at Risk`,
      evidence: [
        "Monitored coastal referral hospitals and 33kV substations situated in hazard swaths.",
        "Unprotected auxiliary battery banks susceptible to coastal saline inundation.",
        "Culverts identified with high washout probability requiring mobile pump de-watering.",
      ],
    },
  ];

  const radarData = threats.map((t) => ({
    subject: t.name,
    score: t.score,
    fullMark: 100,
  }));

  return (
    <div className="bg-[#0c1220] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4 relative">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              CIRCULAR THREAT RADAR
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Live Multi-Hazard Sensor Fusion
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
          CLICK ANY THREAT FOR EVIDENCE
        </span>
      </div>

      {/* Radar Chart Display */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#22334e" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 9 }}
              stroke="#1e293b"
            />
            <Radar
              name="Hazard Intensity"
              dataKey="score"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.4}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-lg bg-[#090d16] border border-cyan-500/40 text-xs font-mono shadow-xl">
                      <div className="text-cyan-400 font-bold">{data.subject}</div>
                      <div className="text-white">Threat Index: {data.score}/100</div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Threat Buttons / Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 border-t border-[#1e293b]">
        {threats.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedThreat?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedThreat(isSelected ? null : t)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/50"
                  : "bg-[#131d31] border-[#22334e] hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: `${t.color}20`,
                    color: t.color,
                    border: `1px solid ${t.color}40`,
                  }}
                >
                  {t.score}/100
                </span>
              </div>
              <span className="text-[11px] font-bold text-white block truncate">
                {t.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 block truncate">
                {t.metric}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Threat Evidence Modal/Box */}
      {selectedThreat && (
        <div className="p-4 rounded-xl bg-[#131d31] border border-cyan-500/50 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#22334e] pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white font-mono uppercase">
                {selectedThreat.name} Grounding Evidence
              </span>
              <RiskBadge level={selectedThreat.level} size="sm" />
            </div>
            <button
              onClick={() => setSelectedThreat(null)}
              className="p-1 rounded bg-[#090d16] text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {selectedThreat.evidence.map((ev: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">•</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
