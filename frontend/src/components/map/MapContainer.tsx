"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapContainerProps {
  spatialLayers: {
    track_line?: any;
    swath_34kt?: any;
    swath_50kt?: any;
    swath_64kt?: any;
    surge_inundation_zone?: any;
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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors, © CARTO",
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: center,
      zoom: zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      updateLayers(map);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map layers whenever spatialLayers changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    updateLayers(mapRef.current);
  }, [spatialLayers, infrastructureAssets]);

  const updateLayers = (map: maplibregl.Map) => {
    if (!spatialLayers) return;

    // Helper to safely remove layer and source
    const clearLayer = (id: string) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };

    // 1. Swath 34kt (Yellow)
    clearLayer("swath-34-layer");
    if (spatialLayers.swath_34kt) {
      map.addSource("swath-34-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: spatialLayers.swath_34kt, properties: {} },
      });
      map.addLayer({
        id: "swath-34-layer",
        type: "fill",
        source: "swath-34-layer",
        paint: { "fill-color": "#eab308", "fill-opacity": 0.2, "fill-outline-color": "#ca8a04" },
      });
    }

    // 2. Swath 50kt (Orange)
    clearLayer("swath-50-layer");
    if (spatialLayers.swath_50kt) {
      map.addSource("swath-50-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: spatialLayers.swath_50kt, properties: {} },
      });
      map.addLayer({
        id: "swath-50-layer",
        type: "fill",
        source: "swath-50-layer",
        paint: { "fill-color": "#f97316", "fill-opacity": 0.3, "fill-outline-color": "#ea580c" },
      });
    }

    // 3. Swath 64kt (Red / Hurricane)
    clearLayer("swath-64-layer");
    if (spatialLayers.swath_64kt) {
      map.addSource("swath-64-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: spatialLayers.swath_64kt, properties: {} },
      });
      map.addLayer({
        id: "swath-64-layer",
        type: "fill",
        source: "swath-64-layer",
        paint: { "fill-color": "#ef4444", "fill-opacity": 0.45, "fill-outline-color": "#b91c1c" },
      });
    }

    // 4. Surge Inundation Zone (Cyan / Sea water)
    clearLayer("surge-layer");
    if (spatialLayers.surge_inundation_zone) {
      map.addSource("surge-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: spatialLayers.surge_inundation_zone, properties: {} },
      });
      map.addLayer({
        id: "surge-layer",
        type: "fill",
        source: "surge-layer",
        paint: { "fill-color": "#06b6d4", "fill-opacity": 0.55, "fill-outline-color": "#0891b2" },
      });
    }

    // 5. Track Line
    clearLayer("track-line-layer");
    if (spatialLayers.track_line) {
      map.addSource("track-line-layer", {
        type: "geojson",
        data: { type: "Feature", geometry: spatialLayers.track_line, properties: {} },
      });
      map.addLayer({
        id: "track-line-layer",
        type: "line",
        source: "track-line-layer",
        paint: { "line-color": "#38bdf8", "line-width": 3, "line-dasharray": [2, 2] },
      });
    }

    // 6. Infrastructure Markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    infrastructureAssets.forEach((asset) => {
      const coords = asset.geometry?.coordinates;
      if (!coords || asset.geometry.type !== "Point") return;

      const el = document.createElement("div");
      el.className = "flex items-center justify-center cursor-pointer transition-transform hover:scale-125";
      
      const isHospital = asset.type === "hospital";
      const isShelter = asset.type === "shelter";

      const bgColor = isHospital ? "#ef4444" : isShelter ? "#10b981" : "#f59e0b";
      const iconText = isHospital ? "🏥" : isShelter ? "🏠" : "⚡";

      el.innerHTML = `
        <div style="background-color: ${bgColor}; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
          ${iconText}
        </div>
      `;

      const popupContent = `
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="display: block; font-size: 13px; margin-bottom: 2px;">${asset.name}</strong>
          <div>Category: <b>${asset.type?.toUpperCase()}</b></div>
          <div>District: <b>${asset.district}</b></div>
          ${asset.properties?.beds ? `<div>Beds: <b>${asset.properties.beds}</b></div>` : ""}
          ${asset.properties?.capacity ? `<div>Capacity: <b>${asset.properties.capacity} persons</b></div>` : ""}
          ${asset.properties?.elevation_m ? `<div>Elevation: <b>${asset.properties.elevation_m}m MSL</b></div>` : ""}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords[0], coords[1]])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupContent))
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 p-3 rounded-lg bg-slate-950/90 border border-slate-800 backdrop-blur text-xs space-y-1.5 shadow-lg">
        <div className="font-bold text-slate-200 text-[11px] uppercase tracking-wider mb-1">
          Hazard & Spatial Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-red-500/60 border border-red-500" />
          <span className="text-slate-300">64-kt Hurricane Swath (≥119 km/h)</span>
        </div>
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
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
          <span>🏥 Hospital</span>
          <span>🏠 Shelter</span>
          <span>⚡ Substation</span>
        </div>
      </div>
    </div>
  );
}
