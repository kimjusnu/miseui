import { useState } from "react"
import { AlignCenter, AlignLeft, AlignRight, LayoutGrid, List } from "lucide-react"
import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps } from "@/registry/miseui/ui/segmented-control"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Range(props: SegmentedControlProps) {
  return (
    <SegmentedControl aria-label="Range" defaultValue="week" {...props}>
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="month">Month</SegmentedControlItem>
    </SegmentedControl>
  )
}

function Alignment(props: SegmentedControlProps) {
  return (
    <SegmentedControl variant="icon" aria-label="Text alignment" defaultValue="left" {...props}>
      <SegmentedControlItem value="left" aria-label="Align left">
        <AlignLeft aria-hidden="true" />
      </SegmentedControlItem>
      <SegmentedControlItem value="center" aria-label="Align center">
        <AlignCenter aria-hidden="true" />
      </SegmentedControlItem>
      <SegmentedControlItem value="right" aria-label="Align right">
        <AlignRight aria-hidden="true" />
      </SegmentedControlItem>
    </SegmentedControl>
  )
}

const ORDERS = ["Lisbon", "Seoul", "Oslo", "Lima"] as const

function ListOrGrid() {
  const [view, setView] = useState("list")
  return (
    <div className="grid w-full min-w-0 gap-2">
      <SegmentedControl variant="icon" effect="spring" aria-label="Layout" value={view} onValueChange={setView} className="justify-self-start">
        <SegmentedControlItem value="list" aria-label="List">
          <List aria-hidden="true" />
        </SegmentedControlItem>
        <SegmentedControlItem value="grid" aria-label="Grid">
          <LayoutGrid aria-hidden="true" />
        </SegmentedControlItem>
      </SegmentedControl>
      <ul className={view === "grid" ? "grid grid-cols-2 gap-2 text-sm" : "grid gap-2 text-sm"}>
        {ORDERS.map((city) => (
          <li key={city} className="rounded-md border px-3 py-2">
            {city}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <Range />
      </Cell>
      <Cell label="pill">
        <Range variant="pill" />
      </Cell>
      <Cell label="underline">
        <Range variant="underline" />
      </Cell>
      <Cell label="icon">
        <Alignment />
      </Cell>
      <Cell label="spring effect">
        <Range effect="spring" />
      </Cell>
      <Cell label="spring effect, pill">
        <Range variant="pill" effect="spring" />
      </Cell>
      <Cell label="spring effect, underline">
        <Range variant="underline" effect="spring" />
      </Cell>
      <Cell label="spring effect, icon, changing a list">
        <ListOrGrid />
      </Cell>
    </div>
  )
}
