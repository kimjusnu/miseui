import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Globe, type GlobeArc, type GlobeMarker, type GlobeProps } from "@/registry/miseui/ui/globe"

const SEOUL: GlobeMarker = { lat: 37.6, lng: 127, label: "Seoul" }
const LISBON: GlobeMarker = { lat: 38.7, lng: -9.1, label: "Lisbon" }
const NAIROBI: GlobeMarker = { lat: -1.3, lng: 36.8, label: "Nairobi" }
const SAO_PAULO: GlobeMarker = { lat: -23.5, lng: -46.6, label: "Sao Paulo" }
const TORONTO: GlobeMarker = { lat: 43.7, lng: -79.4, label: "Toronto" }

const ROUTES: readonly GlobeArc[] = [
  { from: TORONTO, to: LISBON, label: "Toronto to Lisbon" },
  { from: SAO_PAULO, to: LISBON, label: "Sao Paulo to Lisbon" },
  { from: LISBON, to: NAIROBI, label: "Lisbon to Nairobi" },
]

const CELLS: readonly { title: string; props: GlobeProps }[] = [
  { title: "dots", props: { variant: "dots", label: "Offices in Lisbon and Nairobi", markers: [LISBON, NAIROBI] } },
  { title: "wire", props: { variant: "wire", label: "Offices in Toronto and Sao Paulo", center: { lat: 12, lng: -70 }, markers: [TORONTO, SAO_PAULO] } },
  { title: "solid", props: { variant: "solid", label: "An office in Seoul", center: { lat: 22, lng: 112 }, markers: [SEOUL] } },
  { title: "arcs", props: { variant: "arcs", label: "Routes into Lisbon and on to Nairobi", center: { lat: 22, lng: -28 }, arcs: ROUTES, markers: [TORONTO, SAO_PAULO, LISBON, NAIROBI] } },
]

export function Demo() {
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-8">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        {CELLS.map(({ title, props }) => (
          <div key={title} className="grid min-w-0 content-start gap-2">
            <p className="text-xs text-muted-foreground">{title}</p>
            <Globe {...props} paused={paused} />
          </div>
        ))}
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">dots, drag effect: flick it, or focus it and press Left and Right</p>
        <Globe effect="drag" label="Offices in Seoul and Lisbon" center={{ lat: 28, lng: 60 }} markers={[SEOUL, LISBON]} paused={paused} className="mx-auto max-w-120" />
      </div>
    </div>
  )
}
