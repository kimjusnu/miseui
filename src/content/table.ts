import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "table",
  title: "Table",
  category: "display",
  description: "Real table markup with sortable headers, a sticky head, selection, an empty row and aligned figures, in four densities.",
  why: {
    principle: "Law of continuity",
    explanation:
      "The eye runs down a straight edge. Right-aligned tabular figures put equal places under each other, so size can be compared without reading a single digit. Hairlines and tints only help the eye stay on its row, so they stay faint.",
    avoid:
      "Do not use it for fewer than three columns or for items people browse rather than compare; a list or cards read better. Do not squeeze a wide table onto a phone: let it scroll, or show fewer columns.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "In the flow of a page or settings column, where hairlines are enough and a frame would be one surface too many.",
    },
    {
      name: "striped",
      principle: "Law of similarity",
      use: "For wide tables people read across, where alternate rows keep the eye on one line from end to end.",
    },
    {
      name: "card",
      principle: "Law of common region",
      use: "On a dashboard among other panels, where the frame and tinted head say this is one object.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "For logs, finance and admin screens used daily, where seeing more rows matters more than breathing room.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Common fate",
      use: "On a table with row actions: one band slides from row to row, so the eye is led and never sees a row of flickers.",
    },
  ],
  usage: `import {
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
</Table>`,
  exports: [
    "Table",
    "TableHeader",
    "TableBody",
    "TableFooter",
    "TableCaption",
    "TableRow",
    "TableHead",
    "TableSortHead",
    "TableCell",
    "TableEmpty",
    "useTableSort",
    "useTableSelection",
    "sortRows",
    "nextSort",
  ],
}
