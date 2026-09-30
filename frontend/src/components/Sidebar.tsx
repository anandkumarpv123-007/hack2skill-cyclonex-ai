import React from "react";
import {
  LayoutDashboard,
  Radio,
  Gauge,
  Map,
  Building2,
  Bell,
  BrainCircuit,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  Activity,
} from "lucide-react";

export type NavPageId =
  | "dashboard"
  | "monitor"
  | "intelligence"
  | "map"
  | "infrastructure"
  | "hardening"
  | "parametric"
  | "alerts"
  | "ai-analysis"
  | "reports"
  | "about";

interface NavItem {
  id: NavPageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "monitor",
    label: "Cyclone Monitor",
    icon: Radio,
  },
  {
    id: "intelligence",
    label: "Risk Intelligence",
    icon: Gauge,
  },
  {
    id: "map",
    label: "Risk Map",
    icon: Map,
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: Building2,
  },
  {
    id: "hardening",
    label: "Hardening Protocols",
    icon: ShieldCheck,
  },
  {
    id: "parametric",
    label: "Parametric Liquidity",
    icon: DollarSign,
  },
  {
    id: "alerts",
    label: "Alerts & Dispatches",
    icon: Bell,
  },
  {
    id: "ai-analysis",
    label: "AI Analysis",
    icon: BrainCircuit,
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
  },
  {
    id: "about",
    label: "Methodology",
    icon: BookOpen,
  },
];

interface SidebarProps {
  currentPage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  alertCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  currentPage,
  onNavigate,
  alertCount = 4,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0c1220] border-r border-[#1e293b] flex flex-col transition-all duration-300 select-none shadow-2xl ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1e293b]">
        <div
          onClick={() => onNavigate("dashboard")}
          className="flex items-center space-x-3 cursor-pointer overflow-hidden group"
          title="CYCLONEX AI Disaster Command OS"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-black tracking-wider text-white">CYCLONEX</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1 py-0.5 rounded font-mono font-bold">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
                Disaster Command OS
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          data-testid="sidebar-toggle"
          className="p-1.5 rounded-lg bg-[#151f32] text-slate-400 hover:text-white border border-[#22334e] transition cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const showBadge = item.id === "alerts" && alertCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                isCollapsed
                  ? "justify-center p-3"
                  : "px-3.5 py-2.5 space-x-3"
              } ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#151f32]/70 border border-transparent"
              }`}
            >
              <div className="relative shrink-0">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {isCollapsed && showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#0c1220] animate-pulse" />
                )}
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-xs tracking-wide truncate">{item.label}</span>
                  {showBadge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Telemetry Status (Bottom) */}
      <div className="p-3 border-t border-[#1e293b] bg-[#090d16]/70">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">System Telemetry:</span>
              <span className="flex items-center text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                OPERATIONAL
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Ground Truth:</span>
              <span className="text-cyan-300">IMD / GEE Stack</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="System Status: Operational">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
