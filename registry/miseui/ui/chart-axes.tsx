import type { CartesianLayout } from "@/registry/miseui/ui/chart-state"

function CartesianAxes({ layout, labels, format }: { layout: CartesianLayout; labels: readonly string[]; format: (value: number) => string }) {
  const anchorOf = (index: number) => {
    if (layout.band) return "middle"
    if (index === 0) return "start"
    return index === labels.length - 1 ? "end" : "middle"
  }
  return (
    <g className="fill-muted-foreground text-xs tabular-nums">
      {layout.ticks.map((tick) => (
        <g key={tick}>
          <line x1={layout.left} x2={layout.right} y1={layout.y(tick)} y2={layout.y(tick)} className="stroke-border" strokeDasharray={tick === 0 ? undefined : "2 4"} />
          <text x={layout.left - 8} y={layout.y(tick)} dy="0.32em" textAnchor="end">
            {format(tick)}
          </text>
        </g>
      ))}
      {labels.map((label, index) =>
        index % layout.stride === 0 ? (
          <text key={index} data-slot="chart-tick" x={layout.positions[index]} y={layout.bottom + 18} textAnchor={anchorOf(index)}>
            {label}
          </text>
        ) : null,
      )}
    </g>
  )
}

export { CartesianAxes }
