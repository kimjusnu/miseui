import { motion, type Transition } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { arcPath, areaPath, barPath, linePath, type DonutSlice } from "@/registry/miseui/ui/chart-math"
import type { CartesianLayout } from "@/registry/miseui/ui/chart-state"

const BAR_MAX_WIDTH = 32
const BAR_GAP = 2
const BAR_RADIUS = 4
const BAR_GROUP_SHARE = 0.68
const LINE_WIDTH = 2
const POINT_RADIUS = 4
const STAGGER_SECONDS = 0.03
const MAX_DELAY_SECONDS = 0.3
const DRAW_LINE: Transition = { ...SPRING_DEFAULT, duration: 0.9 }
const DRAW_BAR: Transition = { ...SPRING_DEFAULT, duration: 0.6 }
const MIX = (percent: number) => `color-mix(in oklab, var(--muted-foreground) ${percent}%, var(--background))`
const GREYS = [MIX(100), MIX(62), MIX(38)]
const DASHES = [undefined, undefined, "6 4", "2 4"]

/** The accent carries the first series; everything else is grey, so a chart never turns into a rainbow. */
const seriesColor = (index: number) => (index === 0 ? "var(--mise)" : GREYS[(index - 1) % GREYS.length])
/** Greys can look alike, so later lines also differ in dash pattern. */
const seriesDash = (index: number) => DASHES[index % DASHES.length]

interface DrawState {
  drawn: boolean
  animated: boolean
}

interface CartesianMarksProps extends DrawState {
  layout: CartesianLayout
  series: readonly (readonly (number | null)[])[]
  active: number | null
}

function ActiveBand({ layout, active }: Pick<CartesianMarksProps, "layout" | "active">) {
  if (active === null) return null
  return (
    <rect
      data-slot="chart-active"
      x={layout.positions[active] - layout.bandWidth / 2}
      y={layout.top}
      width={layout.bandWidth}
      height={layout.bottom - layout.top}
      rx={BAR_RADIUS}
      className="fill-foreground/6"
    />
  )
}

function BarMarks({ layout, series, active, drawn, animated }: CartesianMarksProps) {
  const groupWidth = Math.min(layout.bandWidth * BAR_GROUP_SHARE, BAR_MAX_WIDTH * series.length)
  const barWidth = Math.max(2, (groupWidth - BAR_GAP * (series.length - 1)) / series.length)
  return (
    <g>
      <ActiveBand layout={layout} active={active} />
      {series.map((values, seriesIndex) =>
        values.map((value, index) => {
          if (value === null) return null
          const left = layout.positions[index] - groupWidth / 2 + seriesIndex * (barWidth + BAR_GAP)
          const d = barPath(left, layout.y(value), barWidth, layout.baseline, BAR_RADIUS)
          if (!d) return null
          const key = `${seriesIndex}-${index}`
          const attrs = { "data-slot": "chart-bar", d, fill: seriesColor(seriesIndex) }
          if (!animated) return <path key={key} {...attrs} />
          return (
            <motion.path
              key={key}
              {...attrs}
              style={{ originY: value < 0 ? 0 : 1 }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: drawn ? 1 : 0 }}
              transition={{ ...DRAW_BAR, delay: Math.min(MAX_DELAY_SECONDS, index * STAGGER_SECONDS) }}
            />
          )
        }),
      )}
    </g>
  )
}

function SeriesLine({ d, index, drawn, animated }: DrawState & { d: string; index: number }) {
  const dash = seriesDash(index)
  const attrs = {
    "data-slot": "chart-line",
    d,
    fill: "none",
    stroke: seriesColor(index),
    strokeWidth: LINE_WIDTH,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  if (!animated) return <path {...attrs} strokeDasharray={dash} />
  // pathLength owns the dash array while it draws, so a dashed line fades in instead.
  if (dash) {
    return <motion.path {...attrs} strokeDasharray={dash} initial={{ opacity: 0 }} animate={{ opacity: drawn ? 1 : 0 }} transition={DRAW_LINE} />
  }
  return (
    <motion.path
      {...attrs}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
      transition={{ pathLength: DRAW_LINE, opacity: { duration: 0 } }}
    />
  )
}

function SeriesArea({ d, index, drawn, animated }: DrawState & { d: string; index: number }) {
  const attrs = { "data-slot": "chart-area", d, fill: seriesColor(index), stroke: "none" }
  const opacity = index === 0 ? 0.2 : 0.14
  if (!animated) return <path {...attrs} fillOpacity={opacity} />
  return (
    <motion.path {...attrs} initial={{ fillOpacity: 0 }} animate={{ fillOpacity: drawn ? opacity : 0 }} transition={{ ...DRAW_LINE, delay: 0.2 }} />
  )
}

function ActivePoints({ layout, series, active }: Pick<CartesianMarksProps, "layout" | "series" | "active">) {
  if (active === null) return null
  const x = layout.positions[active]
  return (
    <g data-slot="chart-active">
      <line x1={x} x2={x} y1={layout.top} y2={layout.bottom} className="stroke-border" />
      {series.map((values, index) => {
        const value = values[active]
        if (value === null) return null
        return <circle key={index} cx={x} cy={layout.y(value)} r={POINT_RADIUS} fill={seriesColor(index)} className="stroke-background" strokeWidth={2} />
      })}
    </g>
  )
}

function LineMarks({ layout, series, active, drawn, animated, filled }: CartesianMarksProps & { filled: boolean }) {
  const pointsOf = (values: readonly (number | null)[]) =>
    values.map((value, index) => (value === null ? null : { x: layout.positions[index], y: layout.y(value) }))
  return (
    <g>
      {filled
        ? series.map((values, index) => {
            const d = areaPath(pointsOf(values), layout.baseline)
            return d ? <SeriesArea key={index} d={d} index={index} drawn={drawn} animated={animated} /> : null
          })
        : null}
      {series.map((values, index) => (
        <SeriesLine key={index} d={linePath(pointsOf(values))} index={index} drawn={drawn} animated={animated} />
      ))}
      <ActivePoints layout={layout} series={series} active={active} />
    </g>
  )
}

interface DonutMarksProps extends DrawState {
  slices: readonly DonutSlice[]
  cx: number
  cy: number
  radius: number
  thickness: number
  active: number | null
}

function DonutMarks({ slices, cx, cy, radius, thickness, active, drawn, animated }: DonutMarksProps) {
  return (
    <g>
      {slices.map((slice, position) => {
        const attrs = {
          "data-slot": "chart-slice",
          "data-active": active === position ? "true" : undefined,
          d: arcPath(cx, cy, radius, slice.start, slice.end),
          fill: "none",
          stroke: seriesColor(position),
          strokeWidth: active === position ? thickness + 4 : thickness,
        }
        if (!animated) return <path key={slice.index} {...attrs} />
        return (
          <motion.path
            key={slice.index}
            {...attrs}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
            transition={{ pathLength: { ...DRAW_LINE, delay: (slice.start / (Math.PI * 2)) * 0.4 }, opacity: { duration: 0 } }}
          />
        )
      })}
    </g>
  )
}

export { BarMarks, DonutMarks, LineMarks, seriesColor, seriesDash }
