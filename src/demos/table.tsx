import { Checkbox } from "@/registry/miseui/ui/checkbox"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableSortHead,
  useTableSelection,
  useTableSort,
  type TableProps,
  type TableVariant,
} from "@/registry/miseui/ui/table"

const VARIANTS: readonly TableVariant[] = ["plain", "striped", "card", "compact"]

const INVOICES = [
  { id: "4821", customer: "Northwind Studio", due: "Nov 14", total: 1240 },
  { id: "4822", customer: "Harbor Bakery", due: "Nov 18", total: 86.5 },
  { id: "4823", customer: "Lumen Clinic", due: "Nov 21", total: 12400 },
  { id: "4824", customer: "Pine Street Books", due: "Dec 2", total: 430 },
] as const

type Invoice = (typeof INVOICES)[number]

const ACCESSORS = {
  customer: (row: Invoice) => row.customer,
  total: (row: Invoice) => row.total,
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const IDS = INVOICES.map((row) => row.id)

function InvoiceTable(props: TableProps) {
  const { sorted, headProps } = useTableSort(INVOICES, ACCESSORS)
  return (
    <Table label="Invoices" {...props}>
      <TableHeader>
        <TableRow>
          <TableSortHead {...headProps("customer")}>Customer</TableSortHead>
          <TableSortHead numeric {...headProps("total")}>
            Total
          </TableSortHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="max-w-40 truncate">{row.customer}</TableCell>
            <TableCell numeric>{money.format(row.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SelectableTable() {
  const selection = useTableSelection({ ids: IDS, defaultSelected: ["4822"] })
  return (
    <Table variant="card" label="Invoices to send">
      <TableCaption className="pb-3">{selection.count} selected</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 pr-0">
            <Checkbox aria-label="Select all invoices" checked={selection.checked} onCheckedChange={selection.toggleAll} />
          </TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map((row) => (
          <TableRow key={row.id} selected={selection.isSelected(row.id)}>
            <TableCell className="pr-0">
              <Checkbox
                aria-label={`Select ${row.customer}`}
                checked={selection.isSelected(row.id)}
                onCheckedChange={() => selection.toggle(row.id)}
              />
            </TableCell>
            <TableCell className="max-w-32 truncate">{row.customer}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{row.due}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function DemoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <DemoCell key={variant} label={variant}>
          <InvoiceTable variant={variant} />
        </DemoCell>
      ))}
      <DemoCell label="spring effect, move across the rows">
        <InvoiceTable effect="spring" />
      </DemoCell>
      <DemoCell label="sticky header, scrolls inside itself">
        <InvoiceTable variant="compact" stickyHeader className="max-h-24 rounded-lg border bg-background" scrollLabel="Invoices, scrollable" />
      </DemoCell>
      <DemoCell label="selection helper">
        <SelectableTable />
      </DemoCell>
      <DemoCell label="empty row">
        <Table variant="card" label="Invoices">
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead numeric>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty colSpan={2}>No invoices match this filter</TableEmpty>
          </TableBody>
        </Table>
      </DemoCell>
    </div>
  )
}
