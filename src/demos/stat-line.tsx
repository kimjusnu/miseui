import { StatLine, type StatLineItem } from "@/registry/miseui/ui/stat-line"

const RESULTS: readonly StatLineItem[] = [
  { label: "Page load", value: 1.4, from: 3.2, unit: "s" },
  { label: "Monthly visits", value: 12800 },
  { label: "Support tickets", value: 48, from: 96 },
]

const SHIFT: readonly StatLineItem[] = [
  { label: "orders", value: 214 },
  { label: "returned", value: 6 },
  { label: "late", value: 0 },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="divided">
        <StatLine items={RESULTS} />
      </Cell>
      <Cell label="run">
        <StatLine items={SHIFT} variant="run" />
      </Cell>
      <Cell label="lead">
        <StatLine items={RESULTS} variant="lead" />
      </Cell>
      <Cell label="count-up effect, from the old value">
        <StatLine items={RESULTS} effect="count-up" />
      </Cell>
    </div>
  )
}
