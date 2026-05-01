from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
import json, joblib
import numpy as np

app = FastAPI(title="TrafikIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RISK_ZONES = [
    {"id": 1, "name": "Koskluçiftlik Junction", "lat": 35.1823, "lng": 33.3614, "risk": "high", "reason": "High traffic volume, limited visibility"},
    {"id": 2, "name": "Gonyeli Junction", "lat": 35.2105, "lng": 33.3387, "risk": "high", "reason": "Multi-lane, high speed"},
    {"id": 3, "name": "Magusa Road Entry", "lat": 35.1654, "lng": 33.4891, "risk": "high", "reason": "Main road junction"},
    {"id": 4, "name": "Girne Ring Road", "lat": 35.3367, "lng": 33.3194, "risk": "medium", "reason": "Steep road, narrow junction"},
    {"id": 5, "name": "Nicosia North Exit", "lat": 35.2201, "lng": 33.3712, "risk": "medium", "reason": "High traffic density"},
    {"id": 6, "name": "Famagusta Center", "lat": 35.1247, "lng": 33.9419, "risk": "medium", "reason": "Narrow streets"},
    {"id": 7, "name": "Lefke Road", "lat": 35.1089, "lng": 32.8456, "risk": "low", "reason": "Remote road, poor maintenance"},
]

roads_cache = None
model = None
label_encoder = None

@app.on_event("startup")
def load_data():
    global roads_cache, model, label_encoder
    with open("data/kktc_roads.geojson") as f:
        roads_cache = json.load(f)
    model = joblib.load("models/traffic_model.pkl")
    label_encoder = joblib.load("models/label_encoder.pkl")
    print(f"✅ {len(roads_cache['features'])} road segments loaded")
    print("✅ ML model loaded")

@app.get("/")
def root():
    return {"status": "TrafikIQ API running ✅"}

@app.get("/api/roads")
def get_roads():
    return ORJSONResponse(content=roads_cache)

@app.get("/api/predict")
def predict(
    hour: int = 8,
    day_of_week: int = 1,
    road_type: str = "urban",
    near_junction: int = 1,
    speed_limit: int = 50,
):
    is_weekend = int(day_of_week >= 5)
    is_rush = int((7 <= hour <= 9) or (17 <= hour <= 19))
    is_midday = int(12 <= hour <= 14)
    road_type_enc = label_encoder.transform([road_type])[0]

    features = [[hour, day_of_week, is_weekend, is_rush, is_midday,
                  road_type_enc, near_junction, speed_limit]]

    level = int(model.predict(features)[0])
    proba = model.predict_proba(features)[0]
    confidence = round(float(np.max(proba)) * 100)

    colors = {1: "green", 2: "yellow", 3: "red"}
    labels = {1: "Free flow", 2: "Moderate", 3: "Congested"}

    return {
        "congestion_level": level,
        "color": colors[level],
        "label": labels[level],
        "confidence": confidence,
    }

@app.get("/api/risk-zones")
def get_risk_zones():
    return {"zones": RISK_ZONES}


@app.get("/api/border-wait")
def border_wait(hour: int = 10, day_of_week: int = 1):
    # Rum tatil gunleri ve ozel gunler
    high_demand_days = [5, 6]  # Cumartesi, Pazar
    is_weekend = day_of_week in high_demand_days

    # Bekleme suresi hesapla (dakika)
    if hour < 8 or hour > 23:
        wait = 0
        status = "closed"
        advice = "Border is closed."
    elif is_weekend and 9 <= hour <= 17:
        wait = 45 + (hour - 9) * 3
        status = "very_busy"
        advice = "Very long wait. Avoid if possible."
    elif is_weekend:
        wait = 20
        status = "busy"
        advice = "Moderate wait. Go early morning."
    elif not is_weekend and 9 <= hour <= 12:
        wait = 25
        status = "busy"
        advice = "Shopping rush. Try after 14:00."
    elif not is_weekend and 14 <= hour <= 17:
        wait = 20
        status = "moderate"
        advice = "Moderate traffic. Manageable."
    else:
        wait = 5
        status = "quiet"
        advice = "Good time to cross!"

    colors = {
        "closed": "#94a3b8",
        "quiet": "#22c55e",
        "moderate": "#f59e0b",
        "busy": "#f97316",
        "very_busy": "#ef4444",
    }

    return {
        "location": "Metehan Border Crossing",
        "hour": hour,
        "day_of_week": day_of_week,
        "estimated_wait_minutes": wait,
        "status": status,
        "color": colors[status],
        "advice": advice,
    }
