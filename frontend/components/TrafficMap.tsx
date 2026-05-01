"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import BorderWidget from "./BorderWidget"

const congestionColors: Record<number, string> = {
  1: "#22c55e",
  2: "#f59e0b",
  3: "#ef4444",
}

const riskColors: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
}

const riskRadius: Record<string, number> = {
  high: 18,
  medium: 13,
  low: 9,
}

const ROAD_TYPE_MAP: Record<string, string> = {
  motorway: "highway", trunk: "highway", primary: "urban",
  secondary: "urban", tertiary: "urban", residential: "urban",
}

function getCongestionFromML(highway: string, hour: number, dayOfWeek: number): Promise<number> {
  const roadType = ROAD_TYPE_MAP[highway] || "urban"
  const nearJunction = ["primary", "secondary", "trunk"].includes(highway) ? 1 : 0
  const speedLimit = highway === "motorway" || highway === "trunk" ? 80 : 50
  return fetch(
    `http://localhost:8000/api/predict?hour=${hour}&day_of_week=${dayOfWeek}&road_type=${roadType}&near_junction=${nearJunction}&speed_limit=${speedLimit}`
  ).then(r => r.json()).then(d => d.congestion_level)
}

export default function TrafficMap() {
  const [roads, setRoads] = useState<any>(null)
  const [riskZones, setRiskZones] = useState<any[]>([])
  const [hour, setHour] = useState(new Date().getHours())
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay())
  const [showRisk, setShowRisk] = useState(true)
  const [showTraffic, setShowTraffic] = useState(true)
  const [mlCache, setMlCache] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch("http://localhost:8000/api/roads").then(r => r.json()).then(setRoads)
    fetch("http://localhost:8000/api/risk-zones").then(r => r.json()).then(d => setRiskZones(d.zones))
  }, [])

  useEffect(() => {
    const roadTypes = ["motorway", "trunk", "primary", "secondary", "tertiary"]
    Promise.all(
      roadTypes.map(async rt => {
        const level = await getCongestionFromML(rt, hour, dayOfWeek)
        return [rt, level] as [string, number]
      })
    ).then(results => {
      const cache: Record<string, number> = {}
      results.forEach(([rt, level]) => { cache[rt] = level })
      setMlCache(cache)
    })
  }, [hour, dayOfWeek])

  const style = (feature: any) => {
    const highway = Array.isArray(feature?.properties?.highway)
      ? feature.properties.highway[0]
      : feature?.properties?.highway || "residential"
    const level = mlCache[highway] || mlCache["secondary"] || 1
    return {
      color: congestionColors[level],
      weight: level === 3 ? 5 : level === 2 ? 3 : 2,
      opacity: 0.85,
    }
  }

  const getTimeLabel = (h: number) => {
    if (h >= 7 && h <= 9) return "Morning rush hour"
    if (h >= 12 && h <= 14) return "Midday traffic"
    if (h >= 17 && h <= 19) return "Evening rush hour"
    if (h >= 23 || h <= 5) return "Night — roads clear"
    return "Normal traffic"
  }

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <div style={{ position: "relative", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 1000,
        background: "white", padding: "16px", borderRadius: 12,
        boxShadow: "0 2px 16px rgba(0,0,0,0.15)", minWidth: 240,
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: "#0f172a" }}>
          TrafikIQ — ML Powered
        <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>

        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>TIME<BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600 }}>{getTimeLabel(hour)}</span>
          <span style={{ fontWeight: 700 }}>{String(hour).padStart(2, "0")}:00</span>
        <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
        <input type="range" min={0} max={23} value={hour}
          onChange={e => setHour(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#3b82f6", marginBottom: 12 }}
        />

        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>DAY<BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
        <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}
          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", marginBottom: 12, fontSize: 13 }}>
          {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>

        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>LAYERS<BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
        {[
          { label: "Traffic density", value: showTraffic, setter: setShowTraffic, color: "#3b82f6" },
          { label: "Risk zones", value: showRisk, setter: setShowRisk, color: "#ef4444" },
        ].map(({ label, value, setter, color }) => (
          <label key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 13, color: "#334155" }}>{label}</span>
            <div onClick={() => setter(!value)} style={{
              width: 36, height: 20, borderRadius: 10,
              background: value ? color : "#e2e8f0",
              position: "relative", cursor: "pointer", transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 2, left: value ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%",
                background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
          </label>
        ))}

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, marginTop: 4 }}>
          {[
            { color: "#22c55e", label: "Free flow" },
            { color: "#f59e0b", label: "Moderate" },
            { color: "#ef4444", label: "Congested" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 24, height: 4, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
            <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
          ))}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 8, marginTop: 4 }}>
            {[
              { color: "#ef4444", label: "High risk junction" },
              { color: "#f59e0b", label: "Medium risk junction" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: color, opacity: 0.7 }} />
                <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
              <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
            ))}
          <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
        <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
      <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>

      <MapContainer center={[35.1856, 33.3823]} zoom={11} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap © CartoDB"
        />
        {showTraffic && roads && <GeoJSON key={`${hour}-${dayOfWeek}`} data={roads} style={style} />}
        {showRisk && riskZones.map(zone => (
          <CircleMarker key={zone.id} center={[zone.lat, zone.lng]}
            radius={riskRadius[zone.risk]}
            pathOptions={{ color: riskColors[zone.risk], fillColor: riskColors[zone.risk], fillOpacity: 0.5, weight: 2 }}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>{zone.name}</strong><br />
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 4,
                  background: riskColors[zone.risk], color: "white",
                  fontSize: 11, fontWeight: 600, margin: "4px 0",
                }}>
                  {zone.risk === "high" ? "HIGH RISK" : zone.risk === "medium" ? "MEDIUM RISK" : "LOW RISK"}
                </span><br />
                <small style={{ color: "#64748b" }}>{zone.reason}</small>
              <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    <BorderWidget hour={hour} dayOfWeek={dayOfWeek} />
</div>
  )
}
