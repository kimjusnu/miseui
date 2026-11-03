import type * as React from "react"
import { useId, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { CartesianAxes } from "@/registry/miseui/ui/chart-axes"
import { BarMarks, DonutMarks, LineMarks } from "@/registry/miseui/ui/chart-marks"
import { chartModel, type ChartDatum, type ChartSeries, type ChartVariant } from "@/registry/miseui/ui/chart-model"
import { ChartDataTable, ChartLegend, ChartTooltip, DonutLegend } from "@/registry/miseui/ui/chart-parts"
import { useActivePoint, useElementWidth, useSeenOnce } from "@/registry/miseui/ui/chart-state"
import { cn } from "@/registry/miseui/lib/utils"

type ChartEffect = "draw"

const DEFAULT_HEIGHT = 200
const FALLBACK_WIDTH = 480
const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 })
const defaultFormat = (value: number) => compact.format(value)

interface ChartProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Names the chart for assistive tech and captions its data table. */
  label: string
  data: readonly ChartDatum[]
  /** The field of each datum that names it, such as "month". */
  index: string
  /** Every variant reads the same shape. `donut` uses the first series and gives each datum a slice. */
  series: readonly ChartSeries[]
  /** `bar` compares amounts, `line` shows a trend, `area` a trend of a total, `donut` shares of a whole. */
  variant?: ChartVariant
  /** `draw` builds the marks once, the first time the chart scrolls into view. */
  effect?: ChartEffect
  height?: number
  formatValue?: (value: number) => string
  /** Shown instead of the plot when there is nothing to draw. */
  emptyText?: string
  /** Read to assistive tech when the plot takes focus. */
  hint?: string
}

type Model = ReturnType<typeof chartModel>

interface ChartMarksProps {
  model: Model
  variant: ChartVariant
  active: number | null
  draw: { drawn: boolean; animated: boolean }
  format: (value: number) => string
}

function ChartMarks({ model, variant, active, draw, format }: ChartMarksProps) {
  if (model.donut) return <DonutMarks slices={model.slices} {...model.geometry} active={active} {...draw} />
  const shared = { layout: model.layout, series: model.values, active, ...draw }
  return (
    <>
      <CartesianAxes layout={model.layout} labels={model.labels} format={format} />
      {variant === "bar" ? <BarMarks {...shared} /> : <LineMarks {...shared} filled={variant === "area"} />}
    </>
  )
}

function DonutCentre({ total, label }: { total: string; label?: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-content-center text-center">
      <p data-slot="chart-total" className="text-xl font-semibold tabular-nums">
        {total}
      </p>
      <p className="text-[13px] text-muted-foreground">{label}</p>
    </div>
  )
}

function useDraw(plot: React.RefObject<HTMLElement | null>, effect: ChartEffect | undefined) {
  const reduceMotion = useReducedMotion() ?? false
  const animated = effect === "draw" && !reduceMotion
  const seen = useSeenOnce(plot, animated)
  return { drawn: !animated || seen, animated }
}

interface ChartBodyProps {
  plot: React.RefObject<HTMLDivElement | null>
  model: Model
  variant: ChartVariant
  series: readonly ChartSeries[]
  width: number
  height: number
  draw: ChartMarksProps["draw"]
  format: (value: number) => string
  active: number | null
  surface: ReturnType<typeof useActivePoint>["surface"]
  label: string
  hintId: string
  emptyText: string
}

function ChartPlot({ plot, model, variant, series, width, height, draw, format, active, surface, label, hintId, emptyText }: ChartBodyProps) {
  const empty = model.count === 0
  const tip = active === null ? null : model.tipAt(active)
  return (
    <div
      ref={plot}
      data-slot="chart-plot"
      role="group"
      aria-roledescription="chart"
      aria-label={label}
      aria-describedby={hintId}
      tabIndex={empty ? undefined : 0}
      className="relative w-full min-w-0 touch-pan-y rounded-md outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      style={{ height }}
      {...(empty ? {} : surface)}
    >
      {empty ? (
        <p className="grid h-full place-items-center text-[13px] text-muted-foreground">{emptyText}</p>
      ) : (
        <svg aria-hidden="true" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
          <ChartMarks model={model} variant={variant} active={active} draw={draw} format={format} />
        </svg>
      )}
      {model.donut && !empty ? <DonutCentre total={format(model.total)} label={series[0]?.label} /> : null}
      {tip && active !== null ? (
        <ChartTooltip title={model.titleAt(active)} rows={model.rowsAt(active)} x={tip.x} y={tip.y} width={width} line={variant === "line" || variant === "area"} />
      ) : null}
    </div>
  )
}

function Chart({
  label,
  data,
  index,
  series,
  variant = "bar",
  effect,
  height = DEFAULT_HEIGHT,
  formatValue = defaultFormat,
  emptyText = "No data yet",
  hint = "Use the arrow keys to move between points.",
  className,
  ...props
}: ChartProps) {
  const plot = useRef<HTMLDivElement>(null)
  const hintId = useId()
  const width = useElementWidth(plot, FALLBACK_WIDTH)
  const draw = useDraw(plot, effect)
  const model = chartModel({ data, index, series, variant, width, height, format: formatValue })
  const { active, viaKeyboard, surface } = useActivePoint(model.count, model.hit)
  const empty = model.count === 0
  const spoken = viaKeyboard && active !== null ? `${model.titleAt(active)}: ${model.rowsAt(active).map((row) => `${row.label} ${row.value}`).join(", ")}` : ""
  const body = { plot, model, variant, series, width, height, draw, format: formatValue, active, surface, label, hintId, emptyText }
  return (
    <div data-slot="chart" data-variant={variant} data-effect={effect} className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)} {...props}>
      {!model.donut && series.length > 1 && !empty ? <ChartLegend labels={series.map((entry) => entry.label)} line={variant !== "bar"} /> : null}
      <ChartPlot {...body} />
      {model.donut && !empty ? (
        <DonutLegend rows={model.slices.map((slice) => ({ label: model.labels[slice.index], value: formatValue(slice.value) }))} active={active} />
      ) : null}
      <span id={hintId} className="sr-only">
        {hint}
      </span>
      <span data-slot="chart-live" aria-live="polite" className="sr-only">
        {spoken}
      </span>
      <ChartDataTable caption={label} indexLabel={index} columns={series.map((entry) => entry.label)} rows={model.tableRows} />
    </div>
  )
}

export { Chart, type ChartProps, type ChartVariant, type ChartEffect, type ChartDatum, type ChartSeries }
