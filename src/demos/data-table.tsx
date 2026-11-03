import type * as React from "react"
import { Button } from "@/registry/miseui/ui/button"
import { DataTable, type DataTableColumn, type DataTableVariant } from "@/registry/miseui/ui/data-table"

interface Invoice {
  id: string
  customer: string
  city: string
  due: string
  total: number
}

const INVOICES: readonly Invoice[] = [
  { id: "4821", customer: "Northwind Studio", city: "Seoul", due: "Nov 14", total: 1240 },
  { id: "4822", customer: "Harbor Bakery", city: "Busan", due: "Nov 18", total: 86.5 },
  { id: "4823", customer: "Lumen Clinic", city: "Seoul", due: "Nov 21", total: 12400 },
  { id: "4824", customer: "Pine Street Books", city: "Incheon", due: "Dec 2", total: 430 },
  { id: "4825", customer: "Atlas Cycles", city: "Daegu", due: "Dec 4", total: 915 },
  { id: "4826", customer: "Fern and Co", city: "Seoul", due: "Dec 9", total: 2075 },
  { id: "4827", customer: "Mira Dental", city: "Gwangju", due: "Dec 11", total: 640 },
]

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

const COLUMNS: readonly DataTableColumn<Invoice>[] = [
  { key: "customer", header: "Customer", className: "max-w-40 truncate" },
  { key: "city", header: "City" },
  { key: "total", header: "Total", numeric: true, cell: (row) => money.format(row.total) },
]

const VARIANTS: readonly DataTableVariant[] = ["plain", "card", "compact", "cards"]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

const bulk = (rows: readonly Invoice[], clear: () => void) => (
  <Button size="sm" variant="outline" className="pointer-coarse:h-10" onClick={clear}>
    Archive {rows.length}
  </Button>
)

export function Demo() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          <DataTable label={`Invoices, ${variant}`} rows={INVOICES} columns={COLUMNS} variant={variant} pageSize={4} />
        </Cell>
      ))}
      <Cell label="selection with a bulk action">
        <DataTable label="Invoices, selectable" rows={INVOICES} columns={COLUMNS} selectable defaultSelected={["4822"]} pageSize={4} bulkActions={bulk} />
      </Cell>
      <Cell label="spring effect, one column hidden">
        <DataTable label="Invoices, spring" rows={INVOICES} columns={COLUMNS} variant="card" effect="spring" defaultHiddenColumns={["city"]} pageSize={4} />
      </Cell>
      <Cell label="loading">
        <DataTable label="Invoices, loading" rows={[]} columns={COLUMNS} loading loadingRows={3} />
      </Cell>
      <Cell label="nothing yet">
        <DataTable label="Invoices, empty" rows={[]} columns={COLUMNS} emptyText="No invoices yet. New ones land here." />
      </Cell>
    </div>
  )
}
