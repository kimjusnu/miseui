import { seriesColor, seriesDash } from "@/registry/miseui/ui/chart-marks"
import { cn } from "@/registry/miseui/lib/utils"

const TIP_GAP = 12
const TIP_EDGE = 4
const TIP_MAX_WIDTH = 224

interface ChartKeyProps {
  index: number
  line: boolean
}

/** A line series keys with a stroke, so the dash pattern that tells greys apart shows in the legend too. */
function ChartKey({ index, line }: ChartKeyProps) {
  if (line) {
    return (
      <svg aria-hidden="true" width="16" height="4" className="shrink-0">
        <line x1="1" x2="15" y1="2" y2="2" stroke={seriesColor(index)} strokeWidth="2" strokeLinecap="round" strokeDasharray={seriesDash(index)} />
      </svg>
    )
  }
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: seriesColor(index) }} />
}

interface TooltipRow {
  key: string
  label: string
  value: string
  colorIndex: number
}

interface ChartTooltipProps {
  title: string
  rows: readonly TooltipRow[]
  x: number
  y: number
  /** Tips open away from the nearest side, so they stay inside the chart and off the point itself. */
  width: number
  line: boolean
}

/** Past the edge of a narrow chart by a few pixels is better than a series name cut down to three letters. */
const TIP_MIN_WIDTH = 152

function ChartTooltip({ title, rows, x, y, width, line }: ChartTooltipProps) {
  const opensRight = x < width / 2
  const room = (opensRight ? width - x : x) - TIP_GAP - TIP_EDGE
  return (
    <div
      data-slot="chart-tooltip"
      data-side={opensRight ? "right" : "left"}
      aria-hidden="true"
      className="pointer-events-none absolute z-10 w-max rounded-md border bg-popover px-3 py-2 text-[13px] text-popover-foreground shadow-md"
      style={{ left: x, top: y, maxWidth: Math.min(TIP_MAX_WIDTH, Math.max(TIP_MIN_WIDTH, room)), transform: opensRight ? `translateX(${TIP_GAP}px)` : `translateX(calc(-100% - ${TIP_GAP}px))` }}
    >
      <p className="truncate text-muted-foreground">{title}</p>
      <ul className="mt-1 grid grid-cols-[minmax(0,1fr)] gap-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <ChartKey index={row.colorIndex} line={line} />
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="ms-auto ps-3 font-medium tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChartLegend({ labels, line }: { labels: readonly string[]; line: boolean }) {
  return (
    <ul data-slot="chart-legend" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
      {labels.map((label, index) => (
        <li key={label} className="flex min-w-0 items-center gap-2">
          <ChartKey index={index} line={line} />
          <span className="truncate">{label}</span>
        </li>
      ))}
    </ul>
  )
}

interface DonutLegendRow {
  label: string
  value: string
}

function DonutLegend({ rows, active }: { rows: readonly DonutLegendRow[]; active: number | null }) {
  return (
    <ul data-slot="chart-legend" className="grid grid-cols-[minmax(0,1fr)] gap-1 text-[13px]">
      {rows.map((row, index) => (
        <li key={row.label} className={cn("flex min-w-0 items-center gap-2 text-muted-foreground", active === index && "text-foreground")}>
          <ChartKey index={index} line={false} />
          <span className="min-w-0 truncate">{row.label}</span>
          <span className="ms-auto ps-3 tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}

interface ChartDataTableProps {
  caption: string
  indexLabel: string
  columns: readonly string[]
  rows: readonly { label: string; values: readonly string[] }[]
}

/** The SVG is hidden from assistive tech, so this is the chart for anyone who cannot see it. */
function ChartDataTable({ caption, indexLabel, columns, rows }: ChartDataTableProps) {
  return (
    <table data-slot="chart-table" className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{indexLabel}</th>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <th scope="row">{row.label}</th>
            {row.values.map((value, index) => (
              <td key={index}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { ChartDataTable, ChartLegend, ChartTooltip, DonutLegend, type TooltipRow }
