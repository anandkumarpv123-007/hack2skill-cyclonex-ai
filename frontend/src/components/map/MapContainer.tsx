"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Configure MapLibre Web Worker to load from static public directory
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

interface MapContainerProps {
  spatialLayers: {
    track_line?: any;
    swath_34kt?: any;
    swath_50kt?: any;
    swath_64kt?: any;
    surge_inundation_zone?: any;
    drainage_corridors?: any;
  } | null;
  infrastructureAssets?: any[];
  center?: [number, number]; // [lon, lat]
  zoom?: number;
}

export default function MapContainer({
  spatialLayers,
  infrastructureAssets = [],
  center = [80.5, 15.8],
  zoom = 7.5,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Keep latest props in refs to eliminate stale closure bugs during map load/idle events
  const spatialLayersRef = useRef(spatialLayers);
  const infrastructureAssetsRef = useRef(infrastructureAssets);
  spatialLayersRef.current = spatialLayers;
  infrastructureAssetsRef.current = infrastructureAssets;

  // Fully idempotent layer and marker rendering procedure
  const updateLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Helper to safely remove layer and source
    const clearLayer = (id: string) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };

    // Close any open popups and remove previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Pre-emptively clear all vector hazard layers to guarantee idempotency across scenario switches
    clearLayer("drainage-corridors-layer");
    clearLayer("track-line-layer");
    clearLayer("surge-layer");
    clearLayer("swath-64-layer");
    clearLayer("swath-50-layer");
    clearLayer("swath-34-layer");

    const currentLayers = spatialLayersRef.current;
    const currentAssets = infrastructureAssetsRef.current;

    if (!currentLayers) return;

    // 1. Swath 34kt (Yellow Gale Swath)
    if (
      currentLayers.swath_34kt &&
      currentLayers.swath_34kt.coordinates &&
      currentLayers.swath_34kt.coordinates.length > 0
    ) {
      map.addSource("swath-34-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: currentLayers.swath_34kt, properties: {} },
      });
      map.addLayer({
        id: "swath-34-layer",
        type: "fill",
        source: "swath-34-layer",
        paint: {
          "fill-color": "#eab308",
          "fill-opacity": 0.22,
          "fill-outline-color": "#ca8a04",
        },
      });
    }

    // 2. Swath 50kt (Orange Storm Swath)
    if (
      currentLayers.swath_50kt &&
      currentLayers.swath_50kt.coordinates &&
      currentLayers.swath_50kt.coordinates.length > 0
    ) {
      map.addSource("swath-50-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: currentLayers.swath_50kt, properties: {} },
      });
      map.addLayer({
        id: "swath-50-layer",
        type: "fill",
        source: "swath-50-layer",
        paint: {
          "fill-color": "#f97316",
          "fill-opacity": 0.35,
          "fill-outline-color": "#ea580c",
        },
      });
    }

    // 3. Swath 64kt (Red Hurricane Swath - Only for >= 118.5 km/h)
    if (
      currentLayers.swath_64kt &&
      currentLayers.swath_64kt.coordinates &&
      currentLayers.swath_64kt.coordinates.length > 0
    ) {
      map.addSource("swath-64-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: currentLayers.swath_64kt, properties: {} },
      });
      map.addLayer({
        id: "swath-64-layer",
        type: "fill",
        source: "swath-64-layer",
        paint: {
          "fill-color": "#ef4444",
          "fill-opacity": 0.48,
          "fill-outline-color": "#b91c1c",
        },
      });
    }

    // 4. Surge Inundation Zone (Cyan / Sea water)
    if (
      currentLayers.surge_inundation_zone &&
      currentLayers.surge_inundation_zone.coordinates &&
      currentLayers.surge_inundation_zone.coordinates.length > 0
    ) {
      map.addSource("surge-layer", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: currentLayers.surge_inundation_zone,
          properties: {},
        },
      });
      map.addLayer({
        id: "surge-layer",
        type: "fill",
        source: "surge-layer",
        paint: {
          "fill-color": "#06b6d4",
          "fill-opacity": 0.55,
          "fill-outline-color": "#0891b2",
        },
      });
    }

    // 5. Track Line
    if (
      currentLayers.track_line &&
      currentLayers.track_line.coordinates &&
      currentLayers.track_line.coordinates.length > 0
    ) {
      map.addSource("track-line-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: currentLayers.track_line, properties: {} },
      });
      map.addLayer({
        id: "track-line-layer",
        type: "line",
        source: "track-line-layer",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });
    }

    // 6. Pluvial Rainfall Drainage Corridors & Arterial Road Washout Pathways
    if (
      currentLayers.drainage_corridors &&
      currentLayers.drainage_corridors.features &&
      currentLayers.drainage_corridors.features.length > 0
    ) {
      map.addSource("drainage-corridors-layer", {
        type: "geojson",
        data: currentLayers.drainage_corridors,
      });
      map.addLayer({
        id: "drainage-corridors-layer",
        type: "line",
        source: "drainage-corridors-layer",
        paint: {
          "line-color": "#c084fc",
          "line-width": 3.5,
          "line-dasharray": [3, 2],
        },
      });
    }

    // 7. Infrastructure Markers
    currentAssets.forEach((rawAsset) => {
      // Support both GeoJSON Feature and direct object formats
      const props = rawAsset.properties || rawAsset;
      const geom = rawAsset.geometry || rawAsset;
      const coords = geom.coordinates;
      if (!coords || geom.type !== "Point") return;

      const el = document.createElement("div");
      el.className =
        "flex items-center justify-center cursor-pointer transition-transform hover:scale-125 select-none";

      const assetType = (props.type || rawAsset.type || "asset").toLowerCase();
      const isHospital = assetType.includes("hospital");
      const isShelter = assetType.includes("shelter");
      const isSubstation =
        assetType.includes("substation") || assetType.includes("power");

      const bgColor = isHospital
        ? "#ef4444"
        : isShelter
        ? "#10b981"
        : isSubstation
        ? "#f59e0b"
        : "#38bdf8";

      const iconText = isHospital
        ? "🏥"
        : isShelter
        ? "🏠"
        : isSubstation
        ? "⚡"
        : "📍";

      const categoryLabel = isHospital
        ? "Hospital / Medical Center"
        : isShelter
        ? "Cyclone Shelter (MPCS)"
        : isSubstation
        ? "Power Grid Substation"
        : "Critical Facility";

      el.innerHTML = `
        <div style="background-color: ${bgColor}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 10px rgba(0,0,0,0.6);">
          ${iconText}
        </div>
      `;

      const assetName =
        props.name || rawAsset.name || "Critical Infrastructure Facility";
      const district =
        props.district || rawAsset.district || "Coastal District";
      const beds = props.beds;
      const capacity = props.capacity;
      const elevation = props.elevation_m;
      const voltage = props.voltage_kv;
      const hazardLevel = props.hazard_level || rawAsset.hazard_level;

      const popupContent = `
        <div style="color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; padding: 6px; min-width: 190px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px;">
            ${iconText} ${assetName}
          </div>
          <div style="margin-bottom: 2px;">Category: <b style="color: #1e293b;">${categoryLabel}</b></div>
          <div style="margin-bottom: 2px;">District: <b style="color: #1e293b;">${district}</b></div>
          ${beds ? `<div style="margin-bottom: 2px;">Bed Capacity: <b style="color: #1e293b;">${beds} beds</b></div>` : ""}
          ${capacity ? `<div style="margin-bottom: 2px;">Shelter Capacity: <b style="color: #1e293b;">${capacity} persons</b></div>` : ""}
          ${elevation !== undefined ? `<div style="margin-bottom: 2px;">Elevation: <b style="color: #1e293b;">${elevation}m MSL</b></div>` : ""}
          ${voltage ? `<div style="margin-bottom: 2px;">Grid Voltage: <b style="color: #1e293b;">${voltage} kV</b></div>` : ""}
          ${hazardLevel ? `<div style="margin-top: 4px; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; text-transform: uppercase; display: inline-block; background-color: ${hazardLevel === "extreme" ? "#fee2e2; color: #991b1b;" : hazardLevel === "high" ? "#ffedd5; color: #9a3412;" : "#fef9c3; color: #854d0e;"}">Hazard: ${hazardLevel}</div>` : ""}
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 15,
        closeButton: true,
        closeOnClick: false,
      }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords[0], coords[1]])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, []);

  // Initialize MapLibre instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use ESRI World Dark Gray Canvas: High-reliability, keyless, dark tactical cartography
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          esriDark: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "© Esri, HERE, Garmin, © OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "esri-dark-layer",
            type: "raster",
            source: "esriDark",
            minzoom: 0,
            maxzoom: 18,
          },
        ],
      },
      center: center,
      zoom: zoom,
    });

    mapRef.current = map;
    if (typeof window !== "undefined") {
      (window as any).__map = map;
    }
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setIsMapReady(true);
      updateLayers();
    });

    return () => {
      if (typeof window !== "undefined" && (window as any).__map === map) {
        delete (window as any).__map;
      }
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update view center when scenario changes
  useEffect(() => {
    if (mapRef.current && isMapReady) {
      mapRef.current.flyTo({
        center: center,
        zoom: zoom,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    }
  }, [center[0], center[1], zoom, isMapReady]);

  // Robust reactive rendering effect:
  // Guarantees layers are drawn on initial load (once map is ready) and upon any data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isMapReady && map.isStyleLoaded()) {
      updateLayers();
    } else {
      // Attach one-time listeners to handle async map loading / idle readiness
      const onReady = () => {
        updateLayers();
      };
      map.once("load", onReady);
      map.once("idle", onReady);
      return () => {
        map.off("load", onReady);
        map.off("idle", onReady);
      };
    }
  }, [spatialLayers, infrastructureAssets, isMapReady, updateLayers]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* GEE Satellite Feeds Status Badge */}
      <div className="absolute top-4 left-4 z-10 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-cyan-300 backdrop-blur shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>GEE Feeds: USGS/SRTMGL1_003 (30m) • COPERNICUS/S1_GRD SAR</span>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 p-3 rounded-lg bg-slate-950/90 border border-slate-800 backdrop-blur text-xs space-y-1.5 shadow-lg max-w-xs">
        <div className="font-bold text-slate-200 text-[11px] uppercase tracking-wider mb-1">
          Hazard & Spatial Legend
        </div>
        {spatialLayers?.swath_64kt?.coordinates && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-500/60 border border-red-500" />
            <span className="text-slate-300">64-kt Hurricane Swath (≥119 km/h)</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-orange-500/50 border border-orange-500" />
          <span className="text-slate-300">50-kt Storm Swath (≥93 km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-yellow-500/40 border border-yellow-500" />
          <span className="text-slate-300">34-kt Gale Swath (≥63 km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-cyan-500/70 border border-cyan-400" />
          <span className="text-slate-300">Scenario Surge Inundation Envelope</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 rounded bg-purple-400 border border-purple-300" />
          <span className="text-slate-300">Pluvial Drainage & Washout Corridor</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
          <span>🏥 Hospital</span>
          <span>🏠 Shelter</span>
          <span>⚡ Substation</span>
        </div>
      </div>
    </div>
  );
}
