import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Radio,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface ScenarioOption {
  id: string;
  name: string;
}

interface TopHeaderProps {
  pageTitle: string;
  activeScenario: string;
  scenarios: ScenarioOption[];
  onSelectScenario: (scenarioId: string) => void;
  alertCount?: number;
  onOpenAlerts: () => void;
  onRefresh: () => void;
  isEmergencyMode: boolean;
  onToggleEmergencyMode: () => void;
}

export default function TopHeader({
  pageTitle,
  activeScenario,
  scenarios,
  onSelectScenario,
  alertCount = 4,
  onOpenAlerts,
  onRefresh,
  isEmergencyMode,
  onToggleEmergencyMode,
}: TopHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(" ")[0]);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`h-16 transition-colors duration-300 ${
        isEmergencyMode
          ? "bg-[#180a0f]/95 border-b-2 border-red-500 shadow-[0_4px_25px_rgba(239,68,68,0.35)]"
          : "bg-[#0c1220]/95 border-b border-[#1e293b] shadow-md"
      } backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30`}
    >
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <h1 className="text-sm sm:text-base font-black text-white tracking-wide uppercase font-sans">
          {pageTitle}
        </h1>
        <span
          className={`hidden sm:inline-block w-1.5 h-1.5 rounded-full ${
            isEmergencyMode ? "bg-red-400 animate-ping" : "bg-cyan-400"
          }`}
        />
        <span
          className={`hidden sm:inline-block text-[11px] font-mono ${
            isEmergencyMode ? "text-red-400 font-bold" : "text-slate-400"
          }`}
        >
          {isEmergencyMode ? "CRITICAL EVACUATION PROTOCOL ACTIVE" : "COMMAND OS"}
        </span>
      </div>

      {/* Top Header Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
        {/* Emergency Mode Toggle */}
        <button
          onClick={onToggleEmergencyMode}
          data-testid="emergency-toggle"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-black tracking-wider transition-all duration-200 cursor-pointer ${
            isEmergencyMode
              ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.7)] animate-pulse border border-white/40 ring-2 ring-red-500/50"
              : "bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/40"
          }`}
          title="Toggle high-priority Emergency Command Mode"
        >
          <Radio className={`w-3.5 h-3.5 ${isEmergencyMode ? "animate-spin" : "text-red-400"}`} />
          <span className="inline">
            {isEmergencyMode ? "EMERGENCY MODE: ACTIVE" : "EMERGENCY MODE"}
          </span>
        </button>

        {/* Scenario Selector Dropdown */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-[#131d31] border border-[#22334e] rounded-lg px-2.5 py-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300 hidden md:inline">
            Scenario:
          </span>
          <select
            value={activeScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0f172a] text-slate-200">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-[#131d31] border border-[#22334e] rounded-lg px-2.5 py-1 text-slate-300 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{timeStr || "14:00:00"} IST</span>
        </div>

        {/* Citizen Portal Link */}
        <Link
          href="/citizen"
          className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-xs font-medium transition"
          title="Switch to Citizen Public Portal"
        >
          <span>Citizen Portal</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        {/* Alerts Bell Button */}
        <button
          onClick={onOpenAlerts}
          className="relative p-1.5 rounded-lg bg-[#151f32] text-slate-300 hover:text-white border border-[#22334e] transition cursor-pointer"
          title="View active alerts"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
              {alertCount}
            </span>
          )}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-[#151f32] text-slate-300 hover:text-white border border-[#22334e] transition cursor-pointer"
          title="Synchronize Live Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
