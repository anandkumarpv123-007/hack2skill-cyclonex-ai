"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { ExposureSummary, DistrictCVI, Waypoint } from "@/types/cyclone";

interface ExposureChartsProps {
  exposure: ExposureSummary;
  cviRankings: DistrictCVI[];
  waypoints?: Waypoint[];
}

export default function ExposureCharts({
  exposure,
  cviRankings,
  waypoints = [],
}: ExposureChartsProps) {
  // 1. Exposure by Asset Type & Hazard Level
  const exposureData = [
    {
      category: "Hospitals",
      "64-kt Swath": exposure.hospitals_at_risk.in_64kt,
      "50-kt Swath": exposure.hospitals_at_risk.in_50kt,
      "Surge Zone": exposure.hospitals_at_risk.in_surge,
    },
    {
      category: "Shelters",
      "64-kt Swath": exposure.shelters_at_risk.in_64kt,
      "50-kt Swath": exposure.shelters_at_risk.in_50kt,
      "Surge Zone": exposure.shelters_at_risk.in_surge,
    },
    {
      category: "Substations",
      "64-kt Swath": exposure.substations_at_risk.in_64kt,
      "50-kt Swath": exposure.substations_at_risk.in_50kt,
      "Surge Zone": exposure.substations_at_risk.in_surge,
    },
  ];

  // 2. District CVI Ranking
  const cviData = cviRankings.map((d) => ({
    name: d.district,
    CVI: d.cvi_score,
    fill: d.risk_color,
  }));

  // 3. Track Progression Time-series
  const trackData = waypoints.map((wp, idx) => ({
    time: `T-${waypoints.length - idx}h`,
    wind_kmh: wp.max_wind_kmh,
    pressure_hpa: wp.central_pressure_hpa,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Exposure Breakdown Bar Chart */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200">
            Critical Infrastructure Exposure Matrix
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Deterministic Counts
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Point assets intersected with 64-kt hurricane, 50-kt storm, and scenario surge inundation envelopes.
        </p>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={exposureData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="64-kt Swath" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="50-kt Swath" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Surge Zone" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District CVI Ranking Chart */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200">
            District Composite Vulnerability Index (CVI)
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Scale: 0.0 – 1.0
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Calculated from wind speed, inundation fraction, elevation deficit, and shelter capacity.
        </p>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cviData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" domain={[0, 1]} stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
              />
              <Bar dataKey="CVI" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trajectory Time-series Curve */}
      {trackData.length > 0 && (
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">
              Storm Intensity Progression (Winds & Central Pressure)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
              Trajectory Dynamics
            </span>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trackData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#38bdf8" fontSize={11} domain={["auto", "auto"]} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f43f5e"
                  fontSize={11}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="wind_kmh"
                  name="Max Wind (km/h)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pressure_hpa"
                  name="Central Pressure (hPa)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
