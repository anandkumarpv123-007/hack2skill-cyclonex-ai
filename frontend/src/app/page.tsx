"use client";

import Link from "next/link";
import {
  ShieldAlert,
  Radio,
  MapPin,
  Languages,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {

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
