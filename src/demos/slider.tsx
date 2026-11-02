import type * as React from "react"
import { Slider } from "@/registry/miseui/ui/slider"

const RATING_MARKS = [
  { value: 1, label: "Low" },
  { value: 2 },
  { value: 3, label: "Mid" },
  { value: 4 },
  { value: 5, label: "High" },
]

const formatPrice = (value: number) => `$${value}`

function Labelled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid w-full max-w-sm min-w-0 gap-6">
      <Labelled title="plain">
        <Slider aria-label="Brightness" defaultValue={[60]} />
      </Labelled>
      <Labelled title="plain, range">
        <Slider aria-label="Price" defaultValue={[20, 70]} />
      </Labelled>
      <Labelled title="filled">
        <Slider aria-label="Volume" variant="filled" defaultValue={[40]} />
      </Labelled>
      <Labelled title="stepped">
        <Slider aria-label="Priority" variant="stepped" min={1} max={5} defaultValue={[3]} marks={RATING_MARKS} />
      </Labelled>
      <Labelled title="label">
        <Slider aria-label="Budget" variant="label" max={500} step={10} defaultValue={[240]} formatValue={formatPrice} />
      </Labelled>
      <Labelled title="label, range">
        <Slider aria-label="Nightly rate" variant="label" max={500} step={10} defaultValue={[80, 360]} formatValue={formatPrice} />
      </Labelled>
      <Labelled title="rubber effect, drag past an end">
        <Slider aria-label="Zoom" effect="rubber" defaultValue={[85]} />
      </Labelled>
      <Labelled title="filled with rubber">
        <Slider aria-label="Speaker volume" variant="filled" effect="rubber" defaultValue={[85]} />
      </Labelled>
    </div>
  )
}
