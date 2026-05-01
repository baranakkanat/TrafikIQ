"use client"
import dynamic from "next/dynamic"

const TrafficMap = dynamic(() => import("@/components/TrafficMap"), { ssr: false })

export default function Home() {
  return (
    <main style={{ height: "100vh", width: "100%" }}>
      <TrafficMap />
    </main>
  )
}
