import { useState } from "react"
import {
  StationDialog,
  StationDialogContent,
  StationDialogTrigger,
  type StationDialogEffect,
  type StationDialogVariant,
} from "@/registry/miseui/ui/station-dialog"

const STATIONS = [
  { id: "harbor", name: "Harbor Street", line: "Line 2, opens 05:30", summary: "Lifts at both ends and a staffed desk until midnight. Change here for the ferry." },
  { id: "market", name: "Market Square", line: "Line 2, opens 05:45", summary: "The north exit closes on Sundays. Use the south exit for the covered market." },
  { id: "garden", name: "Garden Road", line: "Line 3, opens 06:00", summary: "Step-free from the street to the platform. Bicycles travel free outside rush hour." },
] as const

const SHOWN: ReadonlyArray<{ title: string; variant: StationDialogVariant; effect?: StationDialogEffect }> = [
  { title: "card", variant: "card" },
  { title: "side", variant: "side" },
  { title: "pin", variant: "pin" },
  { title: "morph effect, grows out of the one you press", variant: "card", effect: "morph" },
]

function StationList({ variant, effect }: { variant: StationDialogVariant; effect?: StationDialogEffect }) {
  const [open, setOpen] = useState<string | null>(null)
  const station = STATIONS.find((entry) => entry.id === open)
  return (
    <StationDialog value={open} onValueChange={setOpen} variant={variant} effect={effect}>
      <ul className="grid min-w-0 divide-y rounded-lg border">
        {STATIONS.map((entry) => (
          <li key={entry.id} className="min-w-0">
            <StationDialogTrigger
              value={entry.id}
              className="flex min-h-12 w-full min-w-0 items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <span className="min-w-0">{entry.name}</span>
              <span className="shrink-0 text-[13px] text-muted-foreground">Details</span>
            </StationDialogTrigger>
          </li>
        ))}
      </ul>
      <StationDialogContent title={station?.name} meta={station?.line}>
        <p className="text-muted-foreground">{station?.summary}</p>
      </StationDialogContent>
    </StationDialog>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {SHOWN.map(({ title, variant, effect }) => (
        <div key={title} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          <StationList variant={variant} effect={effect} />
        </div>
      ))}
    </div>
  )
}
