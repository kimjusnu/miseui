# Table

Real table markup with sortable headers, a sticky head, selection, an empty row and aligned figures, in four densities.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/table.json
```

## Why it looks like this

**Law of continuity.** The eye runs down a straight edge. Right-aligned tabular figures put equal places under each other, so size can be compared without reading a single digit. Hairlines and tints only help the eye stay on its row, so they stay faint.

**Don't.** Do not use it for fewer than three columns or for items people browse rather than compare; a list or cards read better. Do not squeeze a wide table onto a phone: let it scroll, or show fewer columns.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): In the flow of a page or settings column, where hairlines are enough and a frame would be one surface too many.
- `striped` (Law of similarity): For wide tables people read across, where alternate rows keep the eye on one line from end to end.
- `card` (Law of common region): On a dashboard among other panels, where the frame and tinted head say this is one object.
- `compact` (Information density): For logs, finance and admin screens used daily, where seeing more rows matters more than breathing room.

## Effects

Pass one as the `effect` prop.

- `spring` (Common fate): On a table with row actions: one band slides from row to row, so the eye is led and never sees a row of flickers.

## Usage

```tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSortHead, useTableSort,
} from "@/components/ui/table"

const { sorted, headProps } = useTableSort(rows, { name: (r) => r.name, total: (r) => r.total })

<Table variant="card" stickyHeader className="max-h-80">
  <TableHeader>
    <TableRow>
      <TableSortHead {...headProps("name")}>Customer</TableSortHead>
      <TableSortHead numeric {...headProps("total")}>Total</TableSortHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {sorted.map((r) => (
      <TableRow key={r.id}>
        <TableCell>{r.name}</TableCell>
        <TableCell numeric>{r.total}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

Exports: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableCaption`, `TableRow`, `TableHead`, `TableSortHead`, `TableCell`, `TableEmpty`, `useTableSort`, `useTableSelection`, `sortRows`, `nextSort`
