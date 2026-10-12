"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Renders the Gemini briefing (a small subset of Markdown) as readable React nodes.
 * No HTML injection: text is only ever rendered as React children.
 * Supported: #/##/### headings, **bold**, "* " / "- " bullets (nested by indent), "1. " lists, "---" rules.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-t${i}`}>{part.replace(/\*/g, "")}</React.Fragment>
    )
  );
}

function BriefingMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    const key = `l${idx}`;
    if (!trimmed) return;

    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      nodes.push(<hr key={key} className="border-[#22334e] my-2" />);
      return;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      nodes.push(
        <h4 key={key} className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 pt-2">
          {renderInline(heading[2], key)}
        </h4>
      );
      return;
    }
    const bullet = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (bullet) {
      const nested = bullet[1].length >= 2;
      nodes.push(
        <div key={key} className={`flex gap-2 ${nested ? "pl-5" : ""}`}>
          <span className={nested ? "text-slate-500" : "text-cyan-400"}>{nested ? "–" : "•"}</span>
          <span>{renderInline(bullet[2], key)}</span>
        </div>
      );
      return;
    }
    const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      nodes.push(
        <div key={key} className="flex gap-2">
          <span className="text-cyan-400 font-mono">{numbered[1]}.</span>
          <span>{renderInline(numbered[2], key)}</span>
        </div>
      );
      return;
    }
    nodes.push(
      <p key={key} className="leading-relaxed">
        {renderInline(trimmed, key)}
      </p>
    );
  });

  return <div className="space-y-1 text-xs text-slate-200 font-sans">{nodes}</div>;
}

const METRIC_LABELS: Record<string, string> = {
  cyclone_name: "Cyclone",
  peak_wind_kmh: "Peak wind (km/h)",
  central_pressure_hpa: "Central pressure (hPa)",
  surge_height_m: "Scenario surge (m)",
  hospitals_at_risk: "Hospitals in 64-kt swath",
  roads_inundated_km: "Roads in surge zone (km)",
  highest_risk_district: "Highest-risk district",
  highest_cvi_score: "Highest CVI",
  district_risk_level: "Risk level",
  district_action_code: "Engine action code",
};

export default function GeminiBriefing({
  text,
  metrics,
  maxHeightClass = "max-h-80",
  mapImageUrl,
  multimodal = false,
}: {
  text: string;
  metrics?: Record<string, unknown>;
  maxHeightClass?: string;
  mapImageUrl?: string;
  multimodal?: boolean;
}) {
  const [showInput, setShowInput] = useState(false);
  const rows = metrics
    ? Object.entries(metrics).filter(([k]) => k in METRIC_LABELS)
    : [];

  return (
    <div className="space-y-2">
      <div className={`${maxHeightClass} overflow-y-auto pr-2`}>
        <BriefingMarkdown text={text} />
      </div>
      {rows.length > 0 && (
        <div className="border-t border-[#22334e] pt-2">
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 hover:text-cyan-200"
          >
            {showInput ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            WHAT GEMINI RECEIVED (DETERMINISTIC ENGINE OUTPUT{multimodal ? " + HAZARD MAP IMAGE" : ""})
          </button>
          {showInput && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono bg-[#090d16] border border-[#22334e] rounded-lg p-2.5">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-slate-500">{METRIC_LABELS[k]}</span>
                  <span className="text-slate-200 text-right">{String(v)}</span>
                </div>
              ))}
              {multimodal && mapImageUrl && (
                <div className="sm:col-span-2 pt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Image input — engine-rendered hazard map (the exact image sent to Gemini):</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mapImageUrl} alt="Engine-rendered scenario hazard map sent to Gemini" className="w-full max-w-xl rounded-lg border border-[#22334e]" loading="lazy" />
                </div>
              )}
              <p className="sm:col-span-2 text-[10px] text-slate-500 pt-1">
                Gemini only explains these values; actions come from the deterministic engine.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
