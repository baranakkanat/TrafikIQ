"use client"
import { useEffect, useState } from "react"

interface BorderData {
  location: string
  estimated_wait_minutes: number
  status: string
  color: string
  advice: string
}

interface Props {
  hour: number
  dayOfWeek: number
}

export default function BorderWidget({ hour, dayOfWeek }: Props) {
  const [data, setData] = useState<BorderData | null>(null)

  useEffect(() => {
    fetch(`http://localhost:8000/api/border-wait?hour=${hour}&day_of_week=${dayOfWeek}`)
      .then(r => r.json())
      .then(setData)
  }, [hour, dayOfWeek])

  if (!data) return null
  if (data.status === "closed") return (
    <div style={{
      position: "absolute", bottom: 24, left: 16, zIndex: 1000,
      background: "white", borderRadius: 12, padding: "14px 18px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.12)", minWidth: 260,
      borderLeft: "4px solid #94a3b8",
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>
        🛂 Metehan Border
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>CLOSED</div>
    </div>
  )

  return (
    <div style={{
      position: "absolute", bottom: 24, left: 16, zIndex: 1000,
      background: "white", borderRadius: 12, padding: "14px 18px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.12)", minWidth: 260,
      borderLeft: `4px solid ${data.color}`,
      fontFamily: "sans-serif",
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 8 }}>
        🛂 Metehan Border Crossing
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{
          background: data.color, color: "white",
          borderRadius: 8, padding: "6px 12px", textAlign: "center", minWidth: 70,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
            {data.estimated_wait_minutes}
          </div>
          <div style={{ fontSize: 10, opacity: 0.9 }}>min wait</div>
        </div>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: data.color,
            textTransform: "uppercase", marginBottom: 3,
          }}>
            {data.status.replace("_", " ")}
          </div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>
            {data.advice}
          </div>
        </div>
      </div>

      <div style={{
        background: "#f8fafc", borderRadius: 6, padding: "6px 10px",
        fontSize: 11, color: "#64748b",
      }}>
        💡 Busiest on weekends between 10:00–16:00
      </div>
    </div>
  )
}
