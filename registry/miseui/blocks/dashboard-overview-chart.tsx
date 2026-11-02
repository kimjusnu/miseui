import type * as React from "react"
import { useId, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

interface ChartPoint {
  label: string
  value: number
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 200
/** Keeps a 2 px line off the top and bottom edge, where the SVG would clip half of it. */
const INSET_Y = 12
const PERCENT = 100
const FILL_TOP_OPACITY = 0.22
const CAPTION_CLASS = "text-[13px] text-muted-foreground"

/** A single reading still draws as a flat line, and a flat series must not divide by zero. */
function buildPaths(values: readonly number[]) {
  const drawn = values.length === 1 ? [values[0], values[0]] : values
  const min = Math.min(...drawn)
  const span = Math.max(...drawn) - min
  const ys = drawn.map((value) =>
    span === 0 ? VIEW_HEIGHT / 2 : INSET_Y + (1 - (value - min) / span) * (VIEW_HEIGHT - 2 * INSET_Y),
  )
  const line = ys
    .map((y, index) => `${index === 0 ? "M" : "L"}${((index / (ys.length - 1)) * VIEW_WIDTH).toFixed(1)} ${y.toFixed(1)}`)
    .join(" ")
  return { line, area: `${line} L${VIEW_WIDTH} ${VIEW_HEIGHT} L0 ${VIEW_HEIGHT} Z`, ys }
}

function shareOf(index: number, count: number) {
  return count <= 1 ? PERCENT : (index / (count - 1)) * PERCENT
}

interface ChartReadoutProps {
  point: ChartPoint
  left: number
  top: number
  format: (value: number) => string
}

/** Flips past the middle so the reading never leaves the chart. Instant on purpose: it follows a hand. */
function ChartReadout({ point, left, top, format }: ChartReadoutProps) {
  const flip = left > PERCENT / 2
  return (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-foreground/30" style={{ left: `${left}%` }} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-2 -translate-1/2 rounded-full bg-mise ring-2 ring-background"
        style={{ left: `${left}%`, top: `${top}%` }}
      />
      <span
        data-testid="chart-readout"
        className="pointer-events-none absolute top-0 z-10 rounded-md border bg-popover px-2 py-1 text-[13px] whitespace-nowrap shadow-xs"
        style={{ left: `${left}%`, transform: flip ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}
      >
        <span className="font-medium text-popover-foreground">{format(point.value)}</span>
        <span className="ml-2 text-muted-foreground">{point.label}</span>
      </span>
    </>
  )
}

interface ChartMarksProps {
  line: string
  area: string
}

function ChartMarks({ line, area }: ChartMarksProps) {
  const reduceMotion = useReducedMotion()
  const fillId = `area-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className="absolute inset-0 size-full overflow-visible"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--mise)", stopOpacity: FILL_TOP_OPACITY }} />
          <stop offset="1" style={{ stopColor: "var(--mise)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {/* Keyed on the data, so a new range arrives as one soft change instead of a jump. */}
      <motion.g
        key={line}
        data-testid="chart-marks"
        data-reduced={reduceMotion ? "true" : "false"}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING_DEFAULT}
      >
        <path data-testid="chart-area" d={area} fill={`url(#${fillId})`} />
        <path
          data-testid="chart-line"
          d={line}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-mise"
        />
      </motion.g>
    </svg>
  )
}

/** The chart's numbers for anyone who cannot see or hover it. */
function ChartTable({ label, points, format }: { label: string; points: readonly ChartPoint[]; format: (value: number) => string }) {
  return (
    <table className="sr-only">
      <caption>{label}</caption>
      <tbody>
        {points.map((point) => (
          <tr key={point.label}>
            <th scope="row">{point.label}</th>
            <td>{format(point.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface AreaChartProps extends Omit<React.ComponentProps<"figure">, "children"> {
  /** Names the chart for assistive tech. */
  label: string
  points: readonly ChartPoint[]
  format?: (value: number) => string
}

const defaultFormat = (value: number) => value.toLocaleString("en-US")

function AreaChart({ label, points, format = defaultFormat, className, ...props }: AreaChartProps) {
  const [active, setActive] = useState<number | null>(null)
  if (points.length === 0) return null

  const values = points.map((point) => point.value)
  const { line, area, ys } = buildPaths(values)
  const first = points[0]
  const last = points[points.length - 1]
  const count = points.length
  // After a switch to a shorter range the old index could point at nothing.
  const current = active !== null && active < count ? active : null

  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return
    const share = (event.clientX - rect.left) / rect.width
    setActive(Math.min(count - 1, Math.max(0, Math.round(share * (count - 1)))))
  }

  return (
    <figure
      data-slot="area-chart"
      aria-label={`${label}, from ${format(first.value)} on ${first.label} to ${format(last.value)} on ${last.label}`}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div data-testid="chart-plot" className="relative h-40 touch-pan-y border-b @2xl:h-56" onPointerMove={track} onPointerLeave={() => setActive(null)}>
        <ChartMarks line={line} area={area} />
        {/* The scale does not start at zero, so the two ends of it are written down. */}
        <span className={cn(CAPTION_CLASS, "pointer-events-none absolute top-0 left-0")}>{format(Math.max(...values))}</span>
        <span className={cn(CAPTION_CLASS, "pointer-events-none absolute right-0 bottom-1")}>{format(Math.min(...values))}</span>
        {current !== null ? (
          <ChartReadout point={points[current]} left={shareOf(current, count)} top={(ys[current] / VIEW_HEIGHT) * PERCENT} format={format} />
        ) : null}
      </div>
      <div aria-hidden="true" className={cn(CAPTION_CLASS, "flex justify-between")}>
        <span>{first.label}</span>
        <span>{last.label}</span>
      </div>
      <ChartTable label={label} points={points} format={format} />
    </figure>
  )
}

export { AreaChart, type AreaChartProps, type ChartPoint }
