"""
Simplified Andhra Pradesh coastline used for coast-distance and surge-envelope geometry.
Vertices are approximate (screening resolution), ordered south to north.
"""

from shapely.geometry import LineString

# Approximate conversion for length in degrees to km in the Bay of Bengal latitudes
KM_PER_DEGREE = 111.0

AP_COASTLINE_VERTICES = [
    (80.05, 13.50),  # Pulicat / TN border
    (80.15, 14.00),  # Dugarajapatnam
    (80.12, 14.45),  # Nellore coast
    (80.05, 15.00),  # Ramayapatnam
    (80.16, 15.45),  # Kothapatnam / Ongole coast
    (80.35, 15.75),  # Chirala coast / Vadarevu
    (80.52, 15.85),  # Suryalanka Beach
    (80.67, 15.91),  # Nizampatnam
    (80.95, 16.02),  # Krishna delta tip
    (81.24, 16.25),  # Machilipatnam / Manginapudi
    (81.75, 16.45),  # Antarvedi / Godavari mouth
    (82.35, 16.95),  # Kakinada coast
    (82.85, 17.35),  # Tuni coast
    (83.32, 17.71),  # Visakhapatnam RK Beach
    (83.46, 17.89),  # Bheemunipatnam
    (83.90, 18.28),  # Kalingapatnam / Srikakulam
    (84.30, 18.60),  # Bhavanapadu / AP-Odisha border
]
AP_COASTLINE = LineString(AP_COASTLINE_VERTICES)
