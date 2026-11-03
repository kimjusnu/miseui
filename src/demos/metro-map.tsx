import { useState } from "react"
import { MetroMap, type MetroLine, type MetroMapVariant } from "@/registry/miseui/ui/metro-map"

const LINES: readonly MetroLine[] = [
  {
    id: "research",
    label: "Research",
    tone: "muted",
    stops: [
      { id: "kickoff", label: "Kickoff", note: "Week 1", at: 0, lane: 1 },
      { id: "interviews", label: "Interviews", note: "Week 2", at: 1, lane: 1 },
      { id: "brief", label: "Brief", note: "Week 4", at: 3, lane: 1 },
      { id: "launch", label: "Launch", note: "Week 9", at: 6, lane: 0 },
    ],
  },
  {
    id: "build",
    label: "Build",
    stops: [
      { id: "kickoff", label: "Kickoff", note: "Week 1", at: 0, lane: 1 },
      { id: "prototype", label: "Prototype", note: "Week 3", at: 2, lane: 0 },
      { id: "test", label: "User test", note: "Week 5", at: 4, lane: 0 },
      { id: "beta", label: "Beta", note: "Week 7", at: 5, lane: 0 },
      { id: "launch", label: "Launch", note: "Week 9", at: 6, lane: 0 },
    ],
  },
]

const VARIANTS: readonly MetroMapVariant[] = ["transit", "tube", "branch"]

function Interactive() {
  const [current, setCurrent] = useState("test")
  const stop = LINES.flatMap((line) => line.stops).find((entry) => entry.id === current)
  return (
    <div className="grid min-w-0 gap-3">
      <MetroMap label="Project plan, ride" lines={LINES} effect="ride" selected={current} onSelect={setCurrent} />
      <p className="text-[13px] text-muted-foreground">
        Now at <span className="font-medium text-foreground">{stop?.label}</span>, {stop?.note}
      </p>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8">
      {VARIANTS.map((variant) => (
        <div key={variant} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{variant}</p>
          <MetroMap label={`Project plan, ${variant}`} lines={LINES} variant={variant} defaultSelected="prototype" />
        </div>
      ))}
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">ride effect, the line is inked up to the current station</p>
        <Interactive />
      </div>
    </div>
  )
}
