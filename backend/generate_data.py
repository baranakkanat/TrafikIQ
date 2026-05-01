import pandas as pd
import numpy as np

np.random.seed(42)
rows = []

segments = [
    {"id": "seg_001", "name": "Köşklüçiftlik Kavşağı", "road_type": "urban", "near_junction": 1, "speed_limit": 50},
    {"id": "seg_002", "name": "Gönyeli Kavşağı", "road_type": "urban", "near_junction": 1, "speed_limit": 50},
    {"id": "seg_003", "name": "Mağusa Yolu", "road_type": "highway", "near_junction": 0, "speed_limit": 80},
    {"id": "seg_004", "name": "Girne Çevreyolu", "road_type": "highway", "near_junction": 0, "speed_limit": 80},
    {"id": "seg_005", "name": "Dereboyu", "road_type": "urban", "near_junction": 1, "speed_limit": 50},
    {"id": "seg_006", "name": "Lefkoşa Merkez", "road_type": "urban", "near_junction": 1, "speed_limit": 30},
    {"id": "seg_007", "name": "Gazimağusa Giriş", "road_type": "highway", "near_junction": 1, "speed_limit": 80},
    {"id": "seg_008", "name": "Lefke Yolu", "road_type": "rural", "near_junction": 0, "speed_limit": 80},
]

for seg in segments:
    for day in range(7):
        for hour in range(24):
            is_weekend = day >= 5
            is_rush = (7 <= hour <= 9) or (17 <= hour <= 19)
            is_midday = 12 <= hour <= 14

            base = 1
            if seg["road_type"] == "urban":
                if is_rush: base = 3
                elif is_midday: base = 2
            elif seg["road_type"] == "highway":
                if is_rush: base = 2
                elif is_midday: base = 1
            
            if is_weekend: base = max(1, base - 1)
            if seg["near_junction"]: base = min(3, base + np.random.choice([0, 1], p=[0.7, 0.3]))

            noise = np.random.choice([-1, 0, 0, 0, 1], p=[0.1, 0.3, 0.3, 0.2, 0.1])
            level = int(np.clip(base + noise, 1, 3))

            rows.append({
                "segment_id": seg["id"],
                "road_name": seg["name"],
                "day_of_week": day,
                "hour": hour,
                "is_weekend": int(is_weekend),
                "is_rush_hour": int(is_rush),
                "is_midday": int(is_midday),
                "road_type": seg["road_type"],
                "near_junction": seg["near_junction"],
                "speed_limit": seg["speed_limit"],
                "congestion_level": level,
            })

df = pd.DataFrame(rows)
df.to_csv("data/traffic.csv", index=False)
print(f"✅ {len(df)} satır veri oluşturuldu")
print(df["congestion_level"].value_counts())
