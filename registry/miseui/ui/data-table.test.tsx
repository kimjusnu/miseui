import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataTable, type DataTableColumn, type DataTableProps, type DataTableVariant } from "./data-table"
import { filterRows, pageChecked, pageCountOf, pageRange, pageSlice, sortFromOption, sortToOption, toggleColumn, toggleId, togglePage } from "./data-table-math"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.scrollIntoView = vi.fn()
})

afterAll(() => vi.unstubAllGlobals())

interface Invoice {
  id: string
  customer: string
  city: string
  total: number
}

const ROWS: readonly Invoice[] = [
  { id: "a", customer: "Northwind Studio", city: "Seoul", total: 1240 },
  { id: "b", customer: "Harbor Bakery", city: "Busan", total: 86 },
  { id: "c", customer: "Lumen Clinic", city: "Seoul", total: 12400 },
  { id: "d", customer: "Pine Street Books", city: "Incheon", total: 430 },
  { id: "e", customer: "Atlas Cycles", city: "Daegu", total: 910 },
]

const COLUMNS: readonly DataTableColumn<Invoice>[] = [
  { key: "customer", header: "Customer" },
  { key: "city", header: "City" },
  { key: "total", header: "Total", numeric: true, cell: (row) => `$${row.total}` },
]

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const renderTable = (props: Partial<DataTableProps<Invoice>> = {}) => render(<DataTable label="Invoices" rows={ROWS} columns={COLUMNS} {...props} />)
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement
const bodyRows = () => within(screen.getByRole("table", { name: "Invoices" })).getAllByRole("row").slice(1)
const firstCells = () => bodyRows().map((row) => row.querySelector("td")?.textContent)

describe("data table helpers", () => {
  it("filterRows needs every word, across columns, ignoring case", () => {
    expect(filterRows(ROWS, COLUMNS, "seoul lumen").map((row) => row.id)).toEqual(["c"])
    expect(filterRows(ROWS, COLUMNS, "  ")).toBe(ROWS)
    expect(filterRows(ROWS, COLUMNS, "NORTHWIND").map((row) => row.id)).toEqual(["a"])
  })

  it("filterRows skips columns marked unfilterable", () => {
    const columns: readonly DataTableColumn<Invoice>[] = [{ key: "customer", header: "Customer", filterable: false }, { key: "city", header: "City" }]
    expect(filterRows(ROWS, columns, "lumen")).toEqual([])
  })

  it("page helpers cover the ends and an empty list", () => {
    expect(pageCountOf(0, 10)).toBe(1)
    expect(pageCountOf(21, 10)).toBe(3)
    expect(pageSlice([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4])
    expect(pageRange(3, 2, 5)).toEqual({ from: 5, to: 5 })
    expect(pageRange(1, 10, 0)).toEqual({ from: 0, to: 0 })
  })

  it("togglePage fills or empties this page and leaves other pages alone", () => {
    expect(togglePage(["z"], ["a", "b"])).toEqual(["z", "a", "b"])
    expect(togglePage(["z", "a"], ["a", "b"])).toEqual(["z", "a", "b"])
    expect(togglePage(["z", "a", "b"], ["a", "b"])).toEqual(["z"])
    expect(toggleId(["a"], "a")).toEqual([])
    expect(pageChecked(["a"], ["a", "b"])).toBe("indeterminate")
    expect(pageChecked(["a", "b"], ["a", "b"])).toBe(true)
    expect(pageChecked([], ["a"])).toBe(false)
  })

  it("toggleColumn refuses to hide the last visible column", () => {
    expect(toggleColumn([], "a", ["a", "b"])).toEqual(["a"])
    expect(toggleColumn(["a"], "b", ["a", "b"])).toEqual(["a"])
    expect(toggleColumn(["a"], "a", ["a", "b"])).toEqual([])
  })

  it("sort options round-trip and reject junk", () => {
    expect(sortFromOption(sortToOption({ key: "city", direction: "descending" }))).toEqual({ key: "city", direction: "descending" })
    expect(sortFromOption("")).toBeNull()
    expect(sortFromOption("city:sideways")).toBeNull()
  })
})

describe("DataTable", () => {
  it.each<DataTableVariant>(["plain", "card", "compact"])("variant=%s marks itself and draws a table", (variant) => {
    renderTable({ variant })
    expect(slot("data-table")).toHaveAttribute("data-variant", variant)
    expect(slot("table")).toHaveAttribute("data-variant", variant)
    expect(slot("data-table-cards")).toBeNull()
  })

  it("cards renders rows as cards as well, with its own way to sort", async () => {
    const user = setup()
    renderTable({ variant: "cards" })
    const cards = within(slot("data-table-cards")).getAllByRole("listitem")
    expect(cards).toHaveLength(5)
    expect(within(cards[0]).getByText("Northwind Studio")).toBeInTheDocument()
    expect(within(cards[0]).getByText("$1240")).toBeInTheDocument()
    await user.selectOptions(slot("data-table-sort"), "total:descending")
    expect(within(slot("data-table-cards")).getAllByRole("listitem")[0]).toHaveTextContent("Lumen Clinic")
  })

  it("only the cards variant offers the extra sort", () => {
    renderTable()
    expect(slot("data-table-sort")).toBeNull()
  })

  it("headers cycle through ascending, descending and none, with aria-sort", async () => {
    const user = setup()
    renderTable()
    const head = screen.getByRole("columnheader", { name: "Customer" })
    await user.click(within(head).getByRole("button"))
    expect(head).toHaveAttribute("aria-sort", "ascending")
    expect(firstCells()[0]).toBe("Atlas Cycles")
    await user.click(within(head).getByRole("button"))
    expect(head).toHaveAttribute("aria-sort", "descending")
    expect(firstCells()[0]).toBe("Pine Street Books")
    await user.click(within(head).getByRole("button"))
    expect(head).toHaveAttribute("aria-sort", "none")
    expect(firstCells()[0]).toBe("Northwind Studio")
  })

  it("the filter narrows rows, resets the page, and an empty result offers a way out", async () => {
    const user = setup()
    renderTable({ pageSize: 2 })
    await user.click(screen.getByRole("button", { name: /next/i }))
    expect(slot("data-table-footer")).toHaveTextContent("3 to 4 of 5")
    await user.type(screen.getByRole("searchbox", { name: "Filter rows" }), "seoul")
    expect(slot("data-table-footer")).toHaveTextContent("1 to 2 of 2")
    await user.type(screen.getByRole("searchbox"), "xyz")
    expect(screen.getByText('No rows match "seoulxyz".')).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear filter" }))
    expect(screen.getByRole("searchbox")).toHaveValue("")
    expect(bodyRows()).toHaveLength(2)
  })

  it("no data at all shows the owner's message, with no filter button", () => {
    renderTable({ rows: [], emptyText: "No invoices yet." })
    expect(screen.getByText("No invoices yet.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear filter" })).toBeNull()
  })

  it("pagination pages through and clamps when rows shrink", async () => {
    const user = setup()
    const { rerender } = renderTable({ pageSize: 2 })
    expect(bodyRows()).toHaveLength(2)
    await user.click(screen.getByRole("button", { name: /next/i }))
    await user.click(screen.getByRole("button", { name: /next/i }))
    expect(firstCells()).toEqual(["Atlas Cycles"])
    rerender(<DataTable label="Invoices" rows={ROWS.slice(0, 2)} columns={COLUMNS} pageSize={2} />)
    expect(firstCells()[0]).toBe("Northwind Studio")
  })

  it("row checkboxes select, the head checkbox goes indeterminate, then fills the page", async () => {
    const user = setup()
    const onSelectedChange = vi.fn()
    renderTable({ selectable: true, onSelectedChange })
    await user.click(screen.getByRole("checkbox", { name: "Select Harbor Bakery" }))
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b"])
    expect(screen.getByRole("checkbox", { name: "Select all on this page" })).toHaveAttribute("aria-checked", "mixed")
    expect(bodyRows()[1]).toHaveAttribute("data-selected", "true")
    await user.click(screen.getByRole("checkbox", { name: "Select all on this page" }))
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b", "a", "c", "d", "e"])
  })

  it("bulk actions replace the filter row while selected, with every selected row, and clear brings it back", async () => {
    const user = setup()
    const onArchive = vi.fn()
    renderTable({
      selectable: true,
      pageSize: 2,
      defaultSelected: ["e"],
      bulkActions: (rows, clear) => (
        <button
          type="button"
          onClick={() => {
            onArchive(rows.map((row) => row.id))
            clear()
          }}
        >
          Archive
        </button>
      ),
    })
    expect(slot("data-table-bulk")).toHaveTextContent("1 selected")
    expect(screen.queryByRole("searchbox")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Archive" }))
    expect(onArchive).toHaveBeenCalledWith(["e"])
    expect(screen.getByRole("searchbox")).toBeInTheDocument()
  })

  it("the column menu hides a column, and will not hide the last one", async () => {
    const user = setup()
    const onHiddenColumnsChange = vi.fn()
    renderTable({ defaultHiddenColumns: ["total"], onHiddenColumnsChange })
    expect(screen.queryByRole("columnheader", { name: "Total" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Show or hide columns" }))
    const menu = await waitFor(() => slot("data-table-columns"))
    await user.click(within(menu).getByRole("checkbox", { name: "City" }))
    expect(onHiddenColumnsChange).toHaveBeenLastCalledWith(["total", "city"])
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull()
    expect(within(menu).getByRole("checkbox", { name: "Customer" })).toBeDisabled()
  })

  it("says nothing about row counts while loading or empty, because the body already answers", () => {
    const { unmount } = renderTable({ loading: true, loadingRows: 3 })
    expect(screen.queryByText("No rows")).not.toBeInTheDocument()
    unmount()
    renderTable({ rows: [] })
    expect(screen.queryByText("No rows")).not.toBeInTheDocument()
  })

  it("loading draws skeleton rows, marks the region busy and announces once", () => {
    renderTable({ loading: true, loadingRows: 3 })
    expect(slot("data-table")).toHaveAttribute("aria-busy", "true")
    expect(document.querySelectorAll("[data-slot='data-table-skeleton']")).toHaveLength(3)
    expect(screen.getByRole("status")).toHaveTextContent("Loading rows")
    expect(screen.queryByText("Northwind Studio")).toBeNull()
  })

  it("loading in cards draws card shapes too", () => {
    renderTable({ loading: true, loadingRows: 2, variant: "cards" })
    expect(screen.getAllByTestId("data-table-card-skeleton")).toHaveLength(2)
  })

  it("spring passes through to the table and draws its highlight", () => {
    renderTable({ effect: "spring" })
    expect(slot("data-table")).toHaveAttribute("data-effect", "spring")
    expect(slot("table")).toHaveAttribute("data-effect", "spring")
    fireEvent.pointerOver(bodyRows()[1])
    expect(bodyRows()).toHaveLength(5)
  })

  it("columns may turn sorting off, leaving a plain head", () => {
    render(<DataTable label="Invoices" rows={ROWS} columns={[{ key: "customer", header: "Customer", sortable: false }]} />)
    const head = screen.getByRole("columnheader", { name: "Customer" })
    expect(within(head).queryByRole("button")).toBeNull()
  })
})
