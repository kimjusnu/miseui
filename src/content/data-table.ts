import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "data-table",
  title: "Data Table",
  category: "display",
  description: "Hand it rows and columns and get sorting, a filter box, selection, column visibility, pages and bulk actions, with rows that become cards when the container is narrow.",
  why: {
    principle: "Recognition over recall",
    explanation:
      "People managing a long list should not have to remember where a row was. Every column head sorts, one box filters across the whole row, and the page count stays in view, so finding something takes a glance instead of a memory. Bulk actions take the place of the filters while rows are chosen, because that is what the person is doing right then.",
    avoid:
      "Do not use this for a handful of rows with no actions; the Table on its own is calmer. For millions of rows, pass one page at a time from the server and do the sorting there, because these helpers only see the rows they are given.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "The main content of a page, where hairlines separate rows without adding another surface.",
    },
    {
      name: "card",
      principle: "Law of common region",
      use: "One table among other things on a dashboard, so toolbar, rows and footer read as one object.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "Tools used all day by people who scan many rows at once. Rows grow back to a safe size on touch.",
    },
    {
      name: "cards",
      principle: "Content reflow",
      use: "A list that lives in a narrow column or on a phone: under 448 px of container each row becomes a labelled card, and sorting moves into a menu.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Object constancy",
      use: "Dense tables where keeping your place matters: one highlight slides between rows, so the eye follows it down the column.",
    },
  ],
  usage: `import { DataTable, type DataTableColumn } from "@/components/ui/data-table"

const columns: DataTableColumn<Invoice>[] = [
  { key: "customer", header: "Customer" },
  { key: "due", header: "Due", value: (row) => row.dueDate },
  { key: "total", header: "Total", numeric: true, cell: (row) => money.format(row.total) },
]

<DataTable
  label="Invoices"
  rows={invoices}
  columns={columns}
  variant="card"
  selectable
  pageSize={10}
  bulkActions={(rows, clear) => (
    <Button size="sm" onClick={() => archive(rows).then(clear)}>Archive</Button>
  )}
/>`,
  exports: ["DataTable", "filterRows"],
}
