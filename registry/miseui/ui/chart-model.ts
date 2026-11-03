import { angleAt, donutSlices, nearestIndex, polar, sliceAtAngle } from "@/registry/miseui/ui/chart-math"
import { cartesianLayout } from "@/registry/miseui/ui/chart-state"

type ChartVariant = "bar" | "line" | "area" | "donut"
type ChartDatum = Record<string, string | number | null | undefined>

interface ChartSeries {
  /** The field of each datum that holds this series. */
  key: string
  label: string
}

interface ChartModelInput {
  data: readonly ChartDatum[]
  index: string
  series: readonly ChartSeries[]
  variant: ChartVariant
  width: number
  height: number
  format: (value: number) => string
}

const DONUT_PADDING = 8
const DONUT_THICKNESS_SHARE = 0.13
const MIN_DONUT_THICKNESS = 12
const percent = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 })

const readNumber = (datum: ChartDatum, key: string) => {
  const value = datum[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function donutGeometry(width: number, height: number) {
  const size = Math.min(width, height)
  const thickness = Math.max(MIN_DONUT_THICKNESS, Math.round(size * DONUT_THICKNESS_SHARE))
  return { cx: width / 2, cy: height / 2, radius: Math.max(1, size / 2 - thickness / 2 - DONUT_PADDING), thickness }
}

function tableRowsOf(labels: readonly string[], values: readonly (readonly (number | null)[])[], format: (value: number) => string) {
  return labels.map((label, rowIndex) => ({
    label,
    values: values.map((column) => {
      const value = column[rowIndex]
      return value === null ? "No data" : format(value)
    }),
  }))
}

/** Every position below is a place in keyboard order: on a donut, zero values have no slice to stop on. */
function chartModel({ data, index, series, variant, width, height, format }: ChartModelInput) {
  const donut = variant === "donut"
  const labels = data.map((datum) => String(datum[index] ?? ""))
  const values = series.map((entry) => data.map((datum) => readNumber(datum, entry.key)))
  const flat = values.flat().filter((value): value is number => value !== null)
  const slices = donut ? donutSlices(values[0] ?? []) : []
  const geometry = donutGeometry(width, height)
  const layout = cartesianLayout({ width, height, labels, values: flat, band: variant === "bar", includeZero: variant !== "line", format })

  const hit = (x: number, y: number) => {
    if (!donut) return nearestIndex(layout.positions, x)
    const distance = Math.hypot(x - geometry.cx, y - geometry.cy)
    if (slices.length === 0 || Math.abs(distance - geometry.radius) > geometry.thickness / 2 + 4) return null
    const dataIndex = sliceAtAngle(slices, angleAt(x, y, geometry.cx, geometry.cy))
    return slices.findIndex((slice) => slice.index === dataIndex)
  }
  const titleAt = (position: number) => labels[donut ? slices[position].index : position]
  const rowsAt = (position: number) => {
    if (donut) {
      const slice = slices[position]
      return [{ key: "value", label: percent.format(slice.share), value: format(slice.value), colorIndex: position }]
    }
    return series.map((entry, seriesIndex) => {
      const value = values[seriesIndex][position]
      return { key: entry.key, label: entry.label, value: value === null ? "No data" : format(value), colorIndex: seriesIndex }
    })
  }
  const tipAt = (position: number) => {
    if (!donut) return { x: layout.positions[position], y: layout.top }
    const slice = slices[position]
    return polar(geometry.cx, geometry.cy, geometry.radius, (slice.start + slice.end) / 2)
  }
  return {
    donut,
    labels,
    values,
    slices,
    geometry,
    layout,
    total: flat.reduce((sum, value) => sum + value, 0),
    count: donut ? slices.length : labels.length,
    hit,
    titleAt,
    rowsAt,
    tipAt,
    tableRows: tableRowsOf(labels, values, format),
  }
}

export { chartModel, type ChartDatum, type ChartSeries, type ChartVariant }
