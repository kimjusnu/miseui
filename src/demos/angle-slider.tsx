import type * as React from "react"
import { useState } from "react"
import { AngleSlider } from "@/registry/miseui/ui/angle-slider"

const HEADINGS = [
  { value: 0, label: "N" },
  { value: 90, label: "E" },
  { value: 180, label: "S" },
  { value: 270, label: "W" },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function ShadowPreview() {
  const [angle, setAngle] = useState(135)
  const radians = (angle * Math.PI) / 180
  const shadow = `${Math.round(Math.sin(radians) * 8)}px ${Math.round(-Math.cos(radians) * 8)}px 16px rgb(0 0 0 / 0.25)`
  return (
    <Cell label="plain, steers a shadow">
      <div className="flex flex-wrap items-center gap-8">
        <AngleSlider aria-label="Shadow direction" value={angle} onValueChange={setAngle} step={5} />
        <div className="size-16 rounded-lg border bg-card" style={{ boxShadow: shadow }} />
      </div>
    </Cell>
  )
}

function InspectorRow() {
  return (
    <Cell label="compact, in an inspector row">
      <div className="grid w-full gap-2">
        {["Rotation", "Skew"].map((name, index) => (
          <label key={name} className="flex items-center justify-between gap-4 text-[13px] text-muted-foreground">
            {name}
            <AngleSlider aria-label={name} variant="compact" defaultValue={index === 0 ? 30 : 355} />
          </label>
        ))}
      </div>
    </Cell>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <ShadowPreview />
      <Cell label="ticks, spring when clicked">
        <AngleSlider aria-label="Heading" variant="ticks" effect="spring" marks={HEADINGS} defaultValue={45} step={5} />
      </Cell>
      <InspectorRow />
      <Cell label="gauge, stops at both ends">
        <AngleSlider aria-label="Volume" variant="gauge" defaultValue={60} format={(value) => `${value}%`} />
      </Cell>
      <Cell label="disabled">
        <AngleSlider aria-label="Locked rotation" defaultValue={200} disabled />
      </Cell>
    </div>
  )
}
