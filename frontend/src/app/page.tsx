"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Radio,
  MapPin,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Languages,
  ArrowRight,
} from "lucide-react";
import { fetchBackendHealth } from "@/lib/api";
import { HealthResponse } from "@/types/health";

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBackendHealth();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to reach FastAPI backend"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black">
            🌀
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CYCLONEX
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                v0.1.0 • E2E
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pre-Landfall Cyclone Risk & Critical-Infrastructure Geospatial Decision Support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                health
                  ? "bg-emerald-400 animate-pulse"
                  : error
                  ? "bg-rose-500"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-slate-300 font-mono">
              Backend: {loading ? "Probing..." : health ? "Connected" : "Offline"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bilingual: English + తెలుగు (Telugu)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        {/* Hero Section */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 text-xs font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>AI-Assisted Geospatial Intelligence for Coastal Cyclone Disasters</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            Deterministic Spatial Physics Meets Grounded Multimodal Generative AI.
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">
            CYCLONEX couples deterministic spatial hazard modeling (GeoPandas, Google Earth Engine)
            with strictly grounded multimodal generative AI (Gemini 3.7 Flash via Vertex AI).
            Built to safeguard coastal communities and protect critical infrastructure before cyclone landfall.
          </p>

          {/* Direct CTA Buttons */}
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/authority"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-950 transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Launch Authority Incident Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/citizen"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950 transition"
            >
              <MapPin className="w-4 h-4" />
              <span>Open Citizen Emergency Portal (English + తెలుగు)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Dual Portal Architecture Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authority Dashboard Card */}
          <Link
            href="/authority"
            className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-4 block group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                    Authority Incident Dashboard
                  </h3>
                  <p className="text-xs text-slate-400">For DDMAs, SDMAs & Incident Commanders</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                LIVE & READY
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              GPU-accelerated MapLibre GL JS vector maps rendering 34/50/64-knot parametric wind cones,
              scenario-based coastal inundation envelopes, critical infrastructure overlays (hospitals,
              bridges, substations), and Gemini-generated tactical operational briefings.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-cyan-300">
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">MapLibre GL JS</span>
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">Recharts</span>
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">GeoPandas sjoin</span>
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">Gemini Grounded</span>
            </div>
          </Link>

          {/* Citizen Safety View Card */}
          <Link
            href="/citizen"
            className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 transition-all space-y-4 block group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-rose-300 transition-colors">
                    Citizen Safety Portal
                  </h3>
                  <p className="text-xs text-slate-400">Low-Bandwidth Bilingual Emergency View</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                LIVE & READY
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ultra-lightweight, high-contrast, offline-first interface tailored for coastal citizens.
              Provides verified plain-language alerts in English and Telugu (తెలుగు) and an algorithmic
              nearest-safe-shelter locator with hazard-avoidance routing.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-rose-300">
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">English + తెలుగు</span>
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">Low-Bandwidth Mode</span>
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">Nearest Shelter Locator</span>
            </div>
          </Link>
        </section>

        {/* Live Backend & Deterministic Stack Probe */}
        <section className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  FastAPI Backend & Deterministic Risk Engine Verification
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Real-time probe to http://localhost:8000/api/v1/health proving monorepo communication.
              </p>
            </div>

            <button
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-probe Health
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Backend Connection Error
              </div>
              <p className="text-slate-400">
                {error}. Ensure the FastAPI server is running with:{" "}
                <code className="text-rose-300 font-mono">
                  uvicorn app.main:app --reload --port 8000
                </code>
              </p>
            </div>
          )}

          {health && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Service</span>
                  <span className="font-semibold text-cyan-300">{health.service}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Environment</span>
                  <span className="font-semibold text-emerald-300 capitalize">{health.environment}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Data Source Mode</span>
                  <span className="font-semibold text-amber-300 uppercase">
                    [{health.data_source_mode}]
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Last Checked</span>
                  <span className="text-slate-300">{lastChecked || "Just now"}</span>
                </div>
              </div>

              {/* Verified Scientific Stack Chips */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Verified Deterministic Stack (Active Python Virtual Environment):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
                  {Object.entries(health.deterministic_stack).map(([lib, version]) => (
                    <div
                      key={lib}
                      className="px-3 py-2 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-400 capitalize">{lib}</span>
                      <span className="text-cyan-400 font-bold">{version}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Locked Engineering Principles & Anti-Hallucination Grounding */}
        <section className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Engineering Guarantees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <span className="font-bold text-white block">1. Zero Hallucinated Numbers</span>
              <p className="text-slate-400 leading-relaxed">
                Gemini 3.7 Flash never calculates or invents numerical risk metrics. All numbers are
                computed deterministically via GeoPandas and injected as immutable ground truth.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <span className="font-bold text-white block">2. Scenario-Based Inundation</span>
              <p className="text-slate-400 leading-relaxed">
                Storm surge is modeled explicitly as a pre-landfall terrain and elevation scenario
                simulation (SRTM/NASADEM + pressure delta), not an unvalidated hydrodynamic PDE solver.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5">
              <span className="font-bold text-white block">3. Transparent Data Isolation</span>
              <p className="text-slate-400 leading-relaxed">
                Clear architectural boundaries separate live meteorological streams from verified
                historical benchmarks (<em>Cyclone Michaung</em> & <em>Cyclone Hudhud</em>).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-6 text-center text-xs text-slate-500">
        <p>
          CYCLONEX • AI-Assisted Geospatial Decision-Support Platform • Architecture Locked &
          Verified
        </p>
      </footer>
    </div>
  );
}
