import React from "react";

export interface RiskColorConfig {
  bg: string;
  border: string;
  text: string;
  accent: string;
  badge: string;
  fill: string;
  bar: string;
}

export function getRiskColor(level: string): RiskColorConfig {
  const l = (level || "").toUpperCase();
  if (l === "EXTREME" || l.includes("CRITICAL") || l.includes("RED")) {
    return {
      bg: "bg-red-500/10",
      border: "border-red-500/40",
      text: "text-red-400",
      accent: "#ef4444",
      badge: "bg-red-500/15 text-red-400 border-red-500/40 shadow-sm shadow-red-500/10",
      fill: "#ef4444",
      bar: "bg-red-500",
    };
  }
  if (l === "HIGH" || l.includes("ORANGE")) {
    return {
      bg: "bg-orange-500/10",
      border: "border-orange-500/40",
      text: "text-orange-400",
      accent: "#f97316",
      badge: "bg-orange-500/15 text-orange-400 border-orange-500/40 shadow-sm shadow-orange-500/10",
      fill: "#f97316",
      bar: "bg-orange-500",
    };
  }
  if (l === "MODERATE" || l.includes("MEDIUM") || l.includes("YELLOW")) {
    return {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/40",
      text: "text-yellow-400",
      accent: "#eab308",
      badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40 shadow-sm shadow-yellow-500/10",
      fill: "#eab308",
      bar: "bg-yellow-500",
    };
  }
  return {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    accent: "#10b981",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10",
    fill: "#10b981",
    bar: "bg-emerald-500",
  };
}

interface RiskBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function RiskBadge({ level, size = "md", className = "" }: RiskBadgeProps) {
  const colors = getRiskColor(level);
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : size === "lg"
      ? "px-3 py-1 text-xs font-bold"
      : "px-2.5 py-0.5 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-md border ${colors.badge} ${sizeClasses} uppercase font-mono tracking-wider ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse shrink-0"
        style={{ backgroundColor: colors.accent }}
      />
      {level}
    </span>
  );
}
