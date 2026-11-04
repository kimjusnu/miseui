import { useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { TabsList, TabsTrigger } from "@/registry/miseui/ui/tabs"
import type { DashboardRange } from "./dashboard-overview-parts"

const RANGE_LABELS: Readonly<Record<DashboardRange, string>> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" }
const RANGES = Object.keys(RANGE_LABELS) as DashboardRange[]

interface RangeHeaderProps {
  title: string
  range: DashboardRange
  pending: boolean
  /** Grows the range tabs to 40 px under a finger. */
  touch?: boolean
}

function RangeHeader({ title, range, pending, touch = false }: RangeHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-title text-xl">
        {title} <span className="text-muted-foreground">Last {RANGE_LABELS[range]}.</span>
      </h2>
      <TabsList aria-label="Date range" className={cn(touch && "pointer-coarse:h-12")}>
        {RANGES.map((value) => (
          <TabsTrigger key={value} value={value} disabled={pending} className="px-3">
            {RANGE_LABELS[value]}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}

function useRange(range: DashboardRange | undefined, defaultRange: DashboardRange, onChange?: (range: DashboardRange) => void) {
  const [internal, setInternal] = useState(defaultRange)
  const select = (next: string) => {
    setInternal(next as DashboardRange)
    onChange?.(next as DashboardRange)
  }
  return [range ?? internal, select] as const
}

export { RangeHeader, useRange }
