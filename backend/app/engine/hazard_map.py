"""
CYCLONEX Scenario Hazard Map Renderer

Renders the deterministic engine's spatial output (wind swaths, scenario surge envelope,
storm track, coastline and evaluated critical assets) into a PNG image.

The same image is (a) sent to Gemini together with the verified JSON metrics, so the briefing
can describe the spatial pattern (multimodal input), and (b) served to the dashboard so viewers
can see exactly what Gemini was shown. The image contains no numbers that are not in the JSON.
"""

from __future__ import annotations

import io
import threading
from typing import Any, Dict, List, Optional, Tuple

from shapely.geometry import shape, box, Polygon, MultiPolygon, LineString, MultiLineString

from app.geospatial.coastline import AP_COASTLINE

_RENDER_LOCK = threading.Lock()  # matplotlib's pyplot state is not thread-safe

COLORS = {
    "swath_34kt": ("#facc15", 0.08),
    "swath_50kt": ("#f97316", 0.12),
    "swath_64kt": ("#ef4444", 0.16),
    "surge": ("#3b82f6", 0.35),
}


def _polygons(geom: Any) -> List[Polygon]:
    if geom is None or geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    if hasattr(geom, "geoms"):
        out: List[Polygon] = []
        for g in geom.geoms:
            out.extend(_polygons(g))
        return out
    return []


def _lines(geom: Any) -> List[LineString]:
    if geom is None or geom.is_empty:
        return []
    if isinstance(geom, LineString):
        return [geom]
    if isinstance(geom, MultiLineString):
        return list(geom.geoms)
    if hasattr(geom, "geoms"):
        out: List[LineString] = []
        for g in geom.geoms:
            out.extend(_lines(g))
        return out
    return []


def _safe_shape(geojson: Optional[Dict[str, Any]]) -> Any:
    if not geojson or not isinstance(geojson, dict):
        return None
    try:
        if geojson.get("type") == "Feature":
            geojson = geojson.get("geometry")
        if geojson and geojson.get("type") == "FeatureCollection":
            feats = [shape(f["geometry"]) for f in geojson.get("features", []) if f.get("geometry")]
            if not feats:
                return None
            from shapely.ops import unary_union
            return unary_union(feats)
        return shape(geojson) if geojson else None
    except Exception:
        return None


def _view_bounds(surge: Any, assets: List[Dict[str, Any]], landfall: Optional[Tuple[float, float]]) -> Tuple[float, float, float, float]:
    if surge is not None and not surge.is_empty:
        minx, miny, maxx, maxy = surge.bounds
    elif landfall:
        lat, lon = landfall
        minx, miny, maxx, maxy = lon - 0.4, lat - 0.4, lon + 0.4, lat + 0.4
    else:
        minx, miny, maxx, maxy = 79.5, 13.5, 84.5, 18.8
    pad = 0.35
    minx, miny, maxx, maxy = minx - pad, miny - pad, maxx + pad, maxy + pad
    # keep a roughly square view so geometry is not distorted
    w, h = maxx - minx, maxy - miny
    if w > h:
        c = (miny + maxy) / 2
        miny, maxy = c - w / 2, c + w / 2
    else:
        c = (minx + maxx) / 2
        minx, maxx = c - h / 2, c + h / 2
    return minx, miny, maxx, maxy


def render_hazard_map_png(ground_truth: Dict[str, Any], width_px: int = 900) -> Optional[bytes]:
    """Returns PNG bytes of the scenario hazard map, or None if rendering is not possible."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from matplotlib.patches import Polygon as MplPolygon, Patch
        from matplotlib.lines import Line2D
    except Exception:
        return None

    layers = (ground_truth or {}).get("spatial_layers") or {}
    meta = (ground_truth or {}).get("cyclone_metadata") or {}
    surge_info = (ground_truth or {}).get("surge_scenario") or {}
    assets = ((ground_truth or {}).get("exposure_summary") or {}).get("all_evaluated_assets") or []

    surge = _safe_shape(layers.get("surge_inundation_zone"))
    swaths = {k: _safe_shape(layers.get(k)) for k in ("swath_34kt", "swath_50kt", "swath_64kt")}
    track = _safe_shape(layers.get("track_line"))

    landfall = None
    if meta.get("landfall_lat") is not None and meta.get("landfall_lon") is not None:
        landfall = (float(meta["landfall_lat"]), float(meta["landfall_lon"]))

    minx, miny, maxx, maxy = _view_bounds(surge, assets, landfall)
    view = box(minx, miny, maxx, maxy)

    with _RENDER_LOCK:
        dpi = 100
        fig, ax = plt.subplots(figsize=(width_px / dpi, width_px / dpi), dpi=dpi)
        try:
            fig.patch.set_facecolor("#0b1220")
            ax.set_facecolor("#0b4a85")  # sea

            # Land: area on the landward (west/north-west) side of the AP coastline
            coords = list(AP_COASTLINE.coords)
            far = 15.0
            # coastline (south→north), then due north of its last point, far west, and back due west of its first point
            land = Polygon(coords + [(coords[-1][0], coords[-1][1] + far),
                                     (coords[0][0] - far, coords[-1][1] + far),
                                     (coords[0][0] - far, coords[0][1])])
            if land.is_valid:
                for p in _polygons(land.intersection(view)):
                    ax.add_patch(MplPolygon(list(p.exterior.coords), closed=True, facecolor="#3a3a2c",
                                            edgecolor="none", alpha=1.0, zorder=0))

            # Swaths (outermost first)
            for key in ("swath_34kt", "swath_50kt", "swath_64kt"):
                color, alpha = COLORS[key]
                g = swaths.get(key)
                if g is not None:
                    for p in _polygons(g.intersection(view)):
                        ax.add_patch(MplPolygon(list(p.exterior.coords), closed=True, facecolor=color,
                                                edgecolor=color, alpha=alpha, linewidth=1.0))

            # Scenario surge envelope
            if surge is not None:
                color, alpha = COLORS["surge"]
                for p in _polygons(surge.intersection(view)):
                    ax.add_patch(MplPolygon(list(p.exterior.coords), closed=True, facecolor=color,
                                            edgecolor="#93c5fd", alpha=alpha, linewidth=1.2, hatch="///"))

            # Coastline
            for ln in _lines(AP_COASTLINE.intersection(view)):
                xs, ys = ln.xy
                ax.plot(xs, ys, color="#e2e8f0", linewidth=2.0)

            # Storm track
            if track is not None:
                for ln in _lines(track.intersection(view)):
                    xs, ys = ln.xy
                    ax.plot(xs, ys, color="#f8fafc", linewidth=1.6, linestyle="--")
            if landfall:
                ax.plot(landfall[1], landfall[0], marker="*", markersize=16, color="#fde047",
                        markeredgecolor="#0b1220", zorder=6)

            # Assets
            markers = {"hospital": "P", "shelter": "s", "substation": "^"}
            labelled = 0
            for a in assets:
                try:
                    lat, lon = float(a["lat"]), float(a["lon"])
                except (KeyError, TypeError, ValueError):
                    continue
                if not (minx <= lon <= maxx and miny <= lat <= maxy):
                    continue
                cat = str(a.get("category") or a.get("type") or "").lower()
                kind = next((k for k in markers if k in cat), None)
                if kind is None:
                    continue
                if a.get("in_surge_zone"):
                    face = "#ef4444"
                elif a.get("in_64kt_wind"):
                    face = "#f97316"
                elif a.get("in_50kt_wind"):
                    face = "#facc15"
                else:
                    face = "#22c55e"
                ax.plot(lon, lat, marker=markers[kind], markersize=11, color=face,
                        markeredgecolor="#0b1220", markeredgewidth=1.2, zorder=7)
                if (a.get("in_surge_zone") or a.get("in_64kt_wind")) and labelled < 10:
                    name = str(a.get("name") or "").split(",")[0].split("(")[0].strip()
                    if len(name) > 30:
                        name = name[:30].rsplit(" ", 1)[0]
                    offsets = [(8, 6), (8, -12), (-8, 8), (-8, -12)]
                    dx, dy = offsets[labelled % len(offsets)]
                    ax.annotate(name, (lon, lat), xytext=(dx, dy), textcoords="offset points", fontsize=7.5,
                                ha="left" if dx > 0 else "right",
                                color="#f8fafc", zorder=8,
                                bbox=dict(boxstyle="round,pad=0.2", fc="#0b1220", ec="none", alpha=0.75))
                    labelled += 1

            ax.set_xlim(minx, maxx)
            ax.set_ylim(miny, maxy)
            ax.set_aspect("equal")
            ax.tick_params(colors="#94a3b8", labelsize=8)
            for s in ax.spines.values():
                s.set_color("#334155")
            ax.set_xlabel("Longitude (°E)", color="#94a3b8", fontsize=8)
            ax.set_ylabel("Latitude (°N)", color="#94a3b8", fontsize=8)

            name = meta.get("name", "Scenario")
            surge_m = surge_info.get("total_scenario_surge_m")
            ax.set_title(
                f"CYCLONEX scenario hazard map — {name} (simulated benchmark)"
                + (f"\nScenario surge envelope: {surge_m} m" if surge_m is not None else ""),
                color="#f8fafc", fontsize=11, loc="left",
            )

            legend = [
                Patch(facecolor=COLORS["swath_34kt"][0], alpha=0.5, label="34-kt wind swath"),
                Patch(facecolor=COLORS["swath_50kt"][0], alpha=0.6, label="50-kt wind swath"),
                Patch(facecolor=COLORS["swath_64kt"][0], alpha=0.7, label="64-kt wind swath"),
                Patch(facecolor=COLORS["surge"][0], alpha=0.7, hatch="///", label="Scenario surge envelope"),
                Line2D([0], [0], color="#e2e8f0", lw=2, label="Coastline"),
                Line2D([0], [0], color="#f8fafc", lw=1.6, ls="--", label="Storm track"),
                Line2D([0], [0], marker="P", ls="", color="#94a3b8", label="Hospital"),
                Line2D([0], [0], marker="s", ls="", color="#94a3b8", label="Shelter"),
                Line2D([0], [0], marker="^", ls="", color="#94a3b8", label="Substation"),
                Line2D([0], [0], marker="o", ls="", color="#ef4444", label="Asset below surge (in envelope)"),
                Line2D([0], [0], marker="o", ls="", color="#f97316", label="Asset in 64-kt swath"),
            ]
            leg = ax.legend(handles=legend, loc="lower left", fontsize=7, framealpha=0.85,
                            facecolor="#0b1220", edgecolor="#334155", labelcolor="#e2e8f0")
            leg.set_zorder(10)

            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=dpi, facecolor=fig.get_facecolor(), bbox_inches="tight")
            return buf.getvalue()
        except Exception:
            return None
        finally:
            plt.close(fig)
