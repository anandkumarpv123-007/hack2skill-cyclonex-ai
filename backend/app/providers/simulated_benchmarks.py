"""
CYCLONEX Verified Historical Benchmark Datasets
Contains authentic historical Bay of Bengal cyclone track data (IMD / IBTrACS archive)
for Cyclone Michaung (2023) and Cyclone Hudhud (2014).

All data is strictly tagged as [SIMULATED SCENARIO BENCHMARK].
"""

from typing import Any, Dict, List, Optional
from app.providers.base import CycloneTrack, Waypoint


MICHAUNG_BENCHMARK = CycloneTrack(
    id="cyclone_michaung_2023",
    name="Cyclone Michaung",
    year=2023,
    category="Severe Cyclonic Storm (SCS)",
    is_simulated=True,
    data_source="IMD Historical Archive & IBTrACS [SIMULATED SCENARIO BENCHMARK]",
    landfall_target="Bapatla / Chirala Coast, Andhra Pradesh",
    landfall_lat=15.82,
    landfall_lon=80.48,
    peak_wind_kmh=110.0,
    min_pressure_hpa=980.0,
    waypoints=[
        Waypoint(
            time="2023-12-03T12:00:00Z",
            lat=12.2,
            lon=82.0,
            max_wind_kmh=75.0,
            central_pressure_hpa=998.0,
            r34_km=130.0,
            r50_km=0.0,
            r64_km=0.0,
            stage="Cyclonic Storm",
        ),
        Waypoint(
            time="2023-12-04T00:00:00Z",
            lat=13.3,
            lon=81.2,
            max_wind_kmh=90.0,
            central_pressure_hpa=992.0,
            r34_km=150.0,
            r50_km=70.0,
            r64_km=0.0,
            stage="Severe Cyclonic Storm",
        ),
        Waypoint(
            time="2023-12-04T12:00:00Z",
            lat=14.2,
            lon=80.6,
            max_wind_kmh=100.0,
            central_pressure_hpa=988.0,
            r34_km=160.0,
            r50_km=90.0,
            r64_km=0.0,
            stage="Severe Cyclonic Storm",
        ),
        Waypoint(
            time="2023-12-05T00:00:00Z",
            lat=15.1,
            lon=80.3,
            max_wind_kmh=110.0,
            central_pressure_hpa=980.0,
            r34_km=170.0,
            r50_km=100.0,
            r64_km=0.0,
            stage="Severe Cyclonic Storm (Peak)",
        ),
        Waypoint(
            time="2023-12-05T07:30:00Z",
            lat=15.82,
            lon=80.48,
            max_wind_kmh=100.0,
            central_pressure_hpa=984.0,
            r34_km=150.0,
            r50_km=85.0,
            r64_km=0.0,
            stage="Landfall (Bapatla Coast)",
        ),
        Waypoint(
            time="2023-12-05T18:00:00Z",
            lat=16.6,
            lon=80.9,
            max_wind_kmh=65.0,
            central_pressure_hpa=994.0,
            r34_km=90.0,
            r50_km=0.0,
            r64_km=0.0,
            stage="Deep Depression (Inland)",
        ),
    ],
)


HUDHUD_BENCHMARK = CycloneTrack(
    id="cyclone_hudhud_2014",
    name="Cyclone Hudhud",
    year=2014,
    category="Extremely Severe Cyclonic Storm (ESCS)",
    is_simulated=True,
    data_source="IMD Historical Archive & IBTrACS [SIMULATED SCENARIO BENCHMARK]",
    landfall_target="Visakhapatnam, Andhra Pradesh",
    landfall_lat=17.70,
    landfall_lon=83.31,
    peak_wind_kmh=185.0,
    min_pressure_hpa=950.0,
    waypoints=[
        Waypoint(
            time="2014-10-10T12:00:00Z",
            lat=14.5,
            lon=87.0,
            max_wind_kmh=120.0,
            central_pressure_hpa=982.0,
            r34_km=180.0,
            r50_km=110.0,
            r64_km=60.0,
            stage="Very Severe Cyclonic Storm",
        ),
        Waypoint(
            time="2014-10-11T00:00:00Z",
            lat=15.6,
            lon=85.8,
            max_wind_kmh=150.0,
            central_pressure_hpa=968.0,
            r34_km=210.0,
            r50_km=130.0,
            r64_km=80.0,
            stage="Very Severe Cyclonic Storm",
        ),
        Waypoint(
            time="2014-10-11T18:00:00Z",
            lat=16.8,
            lon=84.4,
            max_wind_kmh=180.0,
            central_pressure_hpa=954.0,
            r34_km=240.0,
            r50_km=150.0,
            r64_km=90.0,
            stage="Extremely Severe Cyclonic Storm (Peak)",
        ),
        Waypoint(
            time="2014-10-12T06:00:00Z",
            lat=17.70,
            lon=83.31,
            max_wind_kmh=185.0,
            central_pressure_hpa=950.0,
            r34_km=250.0,
            r50_km=160.0,
            r64_km=100.0,
            stage="Catastrophic Landfall (Visakhapatnam)",
        ),
        Waypoint(
            time="2014-10-12T18:00:00Z",
            lat=18.5,
            lon=82.2,
            max_wind_kmh=90.0,
            central_pressure_hpa=978.0,
            r34_km=140.0,
            r50_km=70.0,
            r64_km=0.0,
            stage="Weakening over Eastern Ghats",
        ),
    ],
)


LIVE_SIMULATION_BENCHMARK = CycloneTrack(
    id="cyclone_live_simulation",
    name="Live Bay of Bengal Simulation",
    year=2026,
    category="Super Cyclonic Storm (SuCS)",
    is_simulated=True,
    data_source="IMD / GEE Marine Simulation [LIVE SCENARIO BENCHMARK]",
    landfall_target="Machilipatnam / Krishna Delta, Andhra Pradesh",
    landfall_lat=16.18,
    landfall_lon=81.13,
    peak_wind_kmh=235.0,
    min_pressure_hpa=915.0,
    waypoints=[
        Waypoint(
            time="2026-09-30T00:00:00Z",
            lat=13.0,
            lon=86.0,
            max_wind_kmh=140.0,
            central_pressure_hpa=970.0,
            r34_km=220.0,
            r50_km=140.0,
            r64_km=80.0,
            stage="Very Severe Cyclonic Storm",
        ),
        Waypoint(
            time="2026-09-30T12:00:00Z",
            lat=14.2,
            lon=84.5,
            max_wind_kmh=180.0,
            central_pressure_hpa=948.0,
            r34_km=250.0,
            r50_km=170.0,
            r64_km=110.0,
            stage="Extremely Severe Cyclonic Storm",
        ),
        Waypoint(
            time="2026-10-01T00:00:00Z",
            lat=15.2,
            lon=83.0,
            max_wind_kmh=225.0,
            central_pressure_hpa=925.0,
            r34_km=280.0,
            r50_km=200.0,
            r64_km=130.0,
            stage="Super Cyclonic Storm",
        ),
        Waypoint(
            time="2026-10-01T12:00:00Z",
            lat=16.18,
            lon=81.13,
            max_wind_kmh=235.0,
            central_pressure_hpa=915.0,
            r34_km=300.0,
            r50_km=210.0,
            r64_km=140.0,
            stage="Catastrophic Landfall (Machilipatnam Coast)",
        ),
        Waypoint(
            time="2026-10-02T00:00:00Z",
            lat=16.9,
            lon=80.5,
            max_wind_kmh=110.0,
            central_pressure_hpa=965.0,
            r34_km=160.0,
            r50_km=90.0,
            r64_km=0.0,
            stage="Severe Cyclonic Storm (Inland Decay)",
        ),
    ],
)


BENCHMARKS_REGISTRY: Dict[str, CycloneTrack] = {
    MICHAUNG_BENCHMARK.id: MICHAUNG_BENCHMARK,
    HUDHUD_BENCHMARK.id: HUDHUD_BENCHMARK,
    LIVE_SIMULATION_BENCHMARK.id: LIVE_SIMULATION_BENCHMARK,
}


def get_benchmark(benchmark_id: str) -> Optional[CycloneTrack]:
    return BENCHMARKS_REGISTRY.get(benchmark_id)


def list_benchmarks() -> List[Dict[str, Any]]:
    return [
        {
            "id": b.id,
            "name": b.name,
            "year": b.year,
            "category": b.category,
            "landfall_target": b.landfall_target,
            "peak_wind_kmh": b.peak_wind_kmh,
            "min_pressure_hpa": b.min_pressure_hpa,
            "data_source": b.data_source,
            "is_simulated": b.is_simulated,
        }
        for b in BENCHMARKS_REGISTRY.values()
    ]
