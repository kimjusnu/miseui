import type * as React from "react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { progressAlong, type MetroLineTone, type MetroPlan, type PlacedStation } from "@/registry/miseui/ui/metro-map-layout"
import { cn } from "@/registry/miseui/lib/utils"

export type MetroMapVariant = "transit" | "tube" | "branch"

const TONE_CLASS: Record<MetroLineTone, string> = {
  mise: "text-mise",
  muted: "text-muted-foreground",
  ink: "text-foreground",
}

const STROKE: Record<MetroMapVariant, number> = { transit: 6, tube: 8, branch: 2 }
const DASH_FOR_INK = "1 10"

interface LinesProps {
  plan: MetroPlan
  variant: MetroMapVariant
  selected: PlacedStation | undefined
  ride: boolean
  reduceMotion: boolean
}

export function MetroLines({ plan, variant, selected, ride, reduceMotion }: LinesProps) {
  const width = STROKE[variant]
  const ridden = ride && selected ? plan.lines.find((line) => line.points.some((point) => point.x === selected.x && point.y === selected.y)) : undefined
  const progress = ridden && selected ? progressAlong(ridden.points, selected) : 0
  return (
    <svg aria-hidden="true" data-slot="metro-map-lines" className="pointer-events-none absolute inset-0" width={plan.width} height={plan.height} fill="none">
      {plan.lines.map((line) => (
        <path
          key={line.id}
          data-line={line.id}
          d={line.d}
          className={cn(TONE_CLASS[line.tone], ride && "opacity-30")}
          stroke="currentColor"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={line.tone === "ink" ? DASH_FOR_INK : undefined}
        />
      ))}
      {ridden ? (
        <motion.path
          key={ridden.id}
          data-slot="metro-map-ride"
          data-progress={progress.toFixed(3)}
          d={ridden.d}
          className={TONE_CLASS[ridden.tone]}
          stroke="currentColor"
          strokeWidth={width}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: progress }}
          transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
        />
      ) : null}
    </svg>
  )
}

function StationMarker({ station, variant, selected }: { station: PlacedStation; variant: MetroMapVariant; selected: boolean }) {
  const interchange = station.lineLabels.length > 1
  if (variant === "branch") {
    return (
      <span
        data-slot="metro-map-marker"
        className={cn("block size-2.5 rounded-full bg-foreground", selected && "size-3 bg-mise ring-2 ring-foreground", interchange && !selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
      />
    )
  }
  // The Underground's convention: a tick for a stop, a ring only where something is worth noticing.
  if (variant === "tube" && !selected && !interchange) {
    return <span data-slot="metro-map-marker" data-shape="tick" className={cn("block h-3 w-1.5 -translate-y-2.5 bg-current", TONE_CLASS[station.tone])} />
  }
  return (
    <span
      data-slot="metro-map-marker"
      data-shape="ring"
      className={cn("block size-4 rounded-full border-[3px] border-foreground bg-background", interchange && "size-5", selected && "size-5 bg-mise")}
    />
  )
}

interface StationProps {
  station: PlacedStation
  variant: MetroMapVariant
  selected: boolean
  focusable: boolean
  gap: number
  gutter: number
  labelAbove: boolean
  onPick: (station: PlacedStation, element: HTMLElement) => void
  onFocusStation: (id: string) => void
}

const STATION_FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

function stationStyle(station: PlacedStation, variant: MetroMapVariant): React.CSSProperties {
  if (variant === "branch") return { top: station.y - 24 }
  return { left: station.x - 20, top: station.y - 20 }
}

export function MetroStation({ station, variant, selected, focusable, gap, gutter, labelAbove, onPick, onFocusStation }: StationProps) {
  const branch = variant === "branch"
  const shared = {
    "data-station": station.id,
    "aria-current": selected ? ("location" as const) : undefined,
    tabIndex: focusable ? 0 : -1,
    style: stationStyle(station, variant),
    onFocus: () => onFocusStation(station.id),
    onClick: (event: React.MouseEvent<HTMLElement>) => onPick(station, event.currentTarget),
    className: cn(
      "group absolute rounded-md",
      STATION_FOCUS,
      branch ? "inset-x-0 flex h-12 flex-col justify-center text-start focus-visible:ring-inset" : "size-10",
      station.disabled && "pointer-events-none opacity-50",
    ),
  }
  const content = (
    <>
      <span className={cn("absolute grid size-5 place-items-center", !branch && "inset-0 m-auto")} style={branch ? { left: station.x - 10, top: 14 } : undefined}>
        <StationMarker station={station} variant={variant} selected={selected} />
      </span>
      <span
        data-slot="metro-map-label"
        className={cn(
          "text-[13px] leading-tight text-muted-foreground group-hover:text-foreground",
          selected && "font-semibold text-foreground",
          branch ? "block" : "absolute left-1/2 grid -translate-x-1/2 text-center",
          !branch && (labelAbove ? "bottom-full mb-1" : "top-full mt-1"),
        )}
        style={branch ? { paddingLeft: gutter } : { width: gap - 8 }}
      >
        <span className="block">{station.label}</span>
        {station.note ? <span className="block font-normal text-muted-foreground">{station.note}</span> : null}
        {station.lineLabels.length > 1 ? <span className="sr-only">Interchange: {station.lineLabels.join(", ")}</span> : null}
      </span>
    </>
  )
  if (station.href) return <a href={station.href} {...shared}>{content}</a>
  return <button type="button" disabled={station.disabled} {...shared}>{content}</button>
}

export function MetroLegend({ plan }: { plan: MetroPlan }) {
  if (plan.lines.length < 2) return null
  return (
    <ul data-slot="metro-map-legend" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
      {plan.lines.map((line) => (
        <li key={line.id} className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className={cn("w-4 border-t-2 border-current", TONE_CLASS[line.tone], line.tone === "ink" && "border-dotted")} />
          {line.label}
        </li>
      ))}
    </ul>
  )
}
