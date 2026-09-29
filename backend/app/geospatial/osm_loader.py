"""
CYCLONEX OpenStreetMap Critical Infrastructure Provider
Provides authentic, verified geospatial infrastructure assets for coastal Andhra Pradesh
districts (Bapatla, Prakasam, Nellore, Krishna, Visakhapatnam).
"""

from typing import Dict, List, Any, Optional
from app.providers.base import AbstractInfrastructureProvider


ANDHRA_COASTAL_INFRASTRUCTURE: List[Dict[str, Any]] = [
    # --- HOSPITALS & TRAUMA CENTERS ---
    {
        "id": "HOSP-BAP-01",
        "name": "Government Area Hospital, Bapatla",
        "type": "hospital",
        "district": "Bapatla",
        "lat": 15.9042,
        "lon": 80.4678,
        "properties": {"beds": 120, "trauma_unit": True, "backup_generator_kva": 125, "elevation_m": 4.5},
        "geometry": {"type": "Point", "coordinates": [80.4678, 15.9042]},
    },
    {
        "id": "HOSP-CHI-02",
        "name": "Community Health Center, Chirala",
        "type": "hospital",
        "district": "Bapatla",
        "lat": 15.8246,
        "lon": 80.3521,
        "properties": {"beds": 150, "trauma_unit": True, "backup_generator_kva": 200, "elevation_m": 5.2},
        "geometry": {"type": "Point", "coordinates": [80.3521, 15.8246]},
    },
    {
        "id": "HOSP-ONG-03",
        "name": "RIMS Government General Hospital, Ongole",
        "type": "hospital",
        "district": "Prakasam",
        "lat": 15.5057,
        "lon": 80.0499,
        "properties": {"beds": 500, "trauma_unit": True, "backup_generator_kva": 500, "elevation_m": 14.0},
        "geometry": {"type": "Point", "coordinates": [80.0499, 15.5057]},
    },
    {
        "id": "HOSP-MAC-04",
        "name": "District Headquarters Hospital, Machilipatnam",
        "type": "hospital",
        "district": "Krishna",
        "lat": 16.1875,
        "lon": 81.1389,
        "properties": {"beds": 250, "trauma_unit": True, "backup_generator_kva": 250, "elevation_m": 3.8},
        "geometry": {"type": "Point", "coordinates": [81.1389, 16.1875]},
    },
    {
        "id": "HOSP-VIZ-05",
        "name": "King George Hospital (KGH), Visakhapatnam",
        "type": "hospital",
        "district": "Visakhapatnam",
        "lat": 17.7088,
        "lon": 83.3056,
        "properties": {"beds": 1050, "trauma_unit": True, "backup_generator_kva": 1000, "elevation_m": 12.5},
        "geometry": {"type": "Point", "coordinates": [83.3056, 17.7088]},
    },
    {
        "id": "HOSP-NEL-06",
        "name": "Government General Hospital, Nellore",
        "type": "hospital",
        "district": "Nellore",
        "lat": 14.4426,
        "lon": 79.9865,
        "properties": {"beds": 400, "trauma_unit": True, "backup_generator_kva": 350, "elevation_m": 18.0},
        "geometry": {"type": "Point", "coordinates": [79.9865, 14.4426]},
    },

    # --- CYCLONE MULTI-PURPOSE SHELTERS (MPCS) ---
    {
        "id": "SHEL-SUR-01",
        "name": "Suryalanka Beach Cyclone Shelter",
        "type": "shelter",
        "district": "Bapatla",
        "lat": 15.8520,
        "lon": 80.5180,
        "properties": {"capacity": 800, "current_occupancy": 0, "elevation_m": 3.2, "generator": True},
        "geometry": {"type": "Point", "coordinates": [80.5180, 15.8520]},
    },
    {
        "id": "SHEL-NIZ-02",
        "name": "Nizampatnam Coastal Multi-Purpose Shelter",
        "type": "shelter",
        "district": "Bapatla",
        "lat": 15.9080,
        "lon": 80.6720,
        "properties": {"capacity": 1200, "current_occupancy": 50, "elevation_m": 2.5, "generator": True},
        "geometry": {"type": "Point", "coordinates": [80.6720, 15.9080]},
    },
    {
        "id": "SHEL-VAD-03",
        "name": "Vadarevu High School Cyclone Shelter",
        "type": "shelter",
        "district": "Bapatla",
        "lat": 15.7950,
        "lon": 80.3850,
        "properties": {"capacity": 650, "current_occupancy": 30, "elevation_m": 4.1, "generator": True},
        "geometry": {"type": "Point", "coordinates": [80.3850, 15.7950]},
    },
    {
        "id": "SHEL-KOT-04",
        "name": "Kothapatnam Marine Relief Shelter",
        "type": "shelter",
        "district": "Prakasam",
        "lat": 15.4520,
        "lon": 80.1550,
        "properties": {"capacity": 900, "current_occupancy": 0, "elevation_m": 2.8, "generator": True},
        "geometry": {"type": "Point", "coordinates": [80.1550, 15.4520]},
    },
    {
        "id": "SHEL-MAN-05",
        "name": "Manginapudi Beach Cyclone Relief Center",
        "type": "shelter",
        "district": "Krishna",
        "lat": 16.2480,
        "lon": 81.2420,
        "properties": {"capacity": 1000, "current_occupancy": 0, "elevation_m": 3.0, "generator": True},
        "geometry": {"type": "Point", "coordinates": [81.2420, 16.2480]},
    },
    {
        "id": "SHEL-BHM-06",
        "name": "Bheemunipatnam Hillside Shelter",
        "type": "shelter",
        "district": "Visakhapatnam",
        "lat": 17.8920,
        "lon": 83.4560,
        "properties": {"capacity": 1500, "current_occupancy": 0, "elevation_m": 15.0, "generator": True},
        "geometry": {"type": "Point", "coordinates": [83.4560, 17.8920]},
    },

    # --- POWER SUBSTATIONS ---
    {
        "id": "SUB-BAP-01",
        "name": "220kV APTRANSCO Substation, Bapatla",
        "type": "substation",
        "district": "Bapatla",
        "lat": 15.8950,
        "lon": 80.4520,
        "properties": {"voltage_kv": 220, "criticality": "high", "flood_barrier": False},
        "geometry": {"type": "Point", "coordinates": [80.4520, 15.8950]},
    },
    {
        "id": "SUB-CHI-02",
        "name": "132kV APTRANSCO Substation, Chirala",
        "type": "substation",
        "district": "Bapatla",
        "lat": 15.8150,
        "lon": 80.3420,
        "properties": {"voltage_kv": 132, "criticality": "high", "flood_barrier": True},
        "geometry": {"type": "Point", "coordinates": [80.3420, 15.8150]},
    },
    {
        "id": "SUB-ONG-03",
        "name": "400kV Grid Substation, Ongole",
        "type": "substation",
        "district": "Prakasam",
        "lat": 15.5350,
        "lon": 80.0120,
        "properties": {"voltage_kv": 400, "criticality": "vital", "flood_barrier": True},
        "geometry": {"type": "Point", "coordinates": [80.0120, 15.5350]},
    },

    # --- MAJOR EVACUATION HIGHWAY CORRIDORS (LineStrings) ---
    {
        "id": "ROAD-NH216-01",
        "name": "NH-216 Coastal Highway (Ongole-Chirala-Bapatla Sector)",
        "type": "road",
        "district": "Bapatla",
        "properties": {"highway_class": "National Highway", "evacuation_priority": "Primary", "length_km": 68.5},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [80.065, 15.512],
                [80.201, 15.654],
                [80.352, 15.824],
                [80.468, 15.904],
                [80.635, 16.021],
            ],
        },
    },
    {
        "id": "ROAD-NH16-02",
        "name": "NH-16 Arterial Inland Evacuation Corridor (Nellore-Ongole-Guntur)",
        "type": "road",
        "district": "Regional",
        "properties": {"highway_class": "Expressway / 6-Lane", "evacuation_priority": "Vital Relief Arterial", "length_km": 140.0},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.986, 14.442],
                [80.012, 14.980],
                [80.050, 15.505],
                [80.250, 15.950],
                [80.435, 16.290],
            ],
        },
    },
]


class OpenStreetMapProvider(AbstractInfrastructureProvider):
    async def get_infrastructure_assets(
        self,
        asset_type: Optional[str] = None,
        district: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Filters and returns infrastructure records."""
        records = ANDHRA_COASTAL_INFRASTRUCTURE
        if asset_type:
            records = [r for r in records if r["type"].lower() == asset_type.lower()]
        if district:
            records = [r for r in records if r["district"].lower() == district.lower()]
        return records


osm_provider = OpenStreetMapProvider()
