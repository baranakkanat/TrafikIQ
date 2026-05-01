import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os

df = pd.read_csv("data/traffic.csv")

le = LabelEncoder()
df["road_type_enc"] = le.fit_transform(df["road_type"])

features = [
    "hour", "day_of_week", "is_weekend", "is_rush_hour",
    "is_midday", "road_type_enc", "near_junction", "speed_limit"
]

X = df[features]
y = df["congestion_level"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, class_weight="balanced")
model.fit(X_train, y_train)

print("✅ Model eğitildi!")
print(classification_report(y_test, model.predict(X_test)))

importances = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
print("\nFeature importances:")
print(importances)

os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/traffic_model.pkl")
joblib.dump(le, "models/label_encoder.pkl")
print("\n✅ models/ klasörüne kaydedildi!")
