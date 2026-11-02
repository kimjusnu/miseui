import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  nextSort,
  sortRows,
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
} from "./table"

let observers: Array<() => void> = []

class ResizeObserverStub {
  callback: () => void
  constructor(callback: () => void) {
    this.callback = callback
    observers = [...observers, callback]
  }
  observe = () => this.callback()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => vi.stubGlobal("ResizeObserver", ResizeObserverStub))
afterAll(() => vi.unstubAllGlobals())
afterEach(() => {
  observers = []
})

const VARIANTS: readonly TableVariant[] = ["plain", "striped", "card", "compact"]

interface Invoice {
  id: string
  customer: string
  amount: number | null
}

const INVOICES: readonly Invoice[] = [
  { id: "INV-9", customer: "Northwind", amount: 120 },
  { id: "INV-10", customer: "Atlas", amount: 80 },
  { id: "INV-2", customer: "Blue Harbour", amount: null },
]

const ACCESSORS = {
  id: (row: Invoice) => row.id,
  customer: (row: Invoice) => row.customer,
  amount: (row: Invoice) => row.amount,
}

function Invoices(props: TableProps) {
  return (
    <Table {...props}>
      <TableCaption>Open invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead numeric>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.customer}</TableCell>
            <TableCell numeric>{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Sortable() {
  const { sorted, headProps } = useTableSort(INVOICES, ACCESSORS)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableSortHead {...headProps("customer")}>Customer</TableSortHead>
          <TableSortHead numeric {...headProps("amount")}>
            Amount
          </TableSortHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.customer}</TableCell>
            <TableCell numeric>{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const firstColumn = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent)

describe("sort helpers", () => {
  it("sortRows returns a new array, in numeric order, and leaves the input alone", () => {
    const sorted = sortRows(INVOICES, ACCESSORS.id, "ascending", "en")
    expect(sorted.map((row) => row.id)).toEqual(["INV-2", "INV-9", "INV-10"])
    expect(sorted).not.toBe(INVOICES)
    expect(INVOICES[0].id).toBe("INV-9")
  })

  it("sortRows keeps blanks at the bottom in both directions", () => {
    const amounts = (direction: "ascending" | "descending") => sortRows(INVOICES, ACCESSORS.amount, direction).map((row) => row.amount)
    expect(amounts("ascending")).toEqual([80, 120, null])
    expect(amounts("descending")).toEqual([120, 80, null])
  })

  it("sortRows orders dates by time", () => {
    const rows = [new Date(2026, 1, 1), new Date(2025, 1, 1)]
    expect(sortRows(rows, (row) => row, "ascending")[0].getFullYear()).toBe(2025)
  })

  it("nextSort cycles ascending, descending, off, and restarts on another column", () => {
    const asc = nextSort(null, "a")
    expect(asc).toEqual({ key: "a", direction: "ascending" })
    const desc = nextSort(asc, "a")
    expect(desc).toEqual({ key: "a", direction: "descending" })
    expect(nextSort(desc, "a")).toBeNull()
    expect(nextSort(desc, "b")).toEqual({ key: "b", direction: "ascending" })
  })
})

describe("useTableSelection", () => {
  const ids = ["a", "b", "c"]

  it("toggles one row at a time and reports indeterminate in between", () => {
    const { result } = renderHook(() => useTableSelection({ ids }))
    expect(result.current.checked).toBe(false)
    act(() => result.current.toggle("a"))
    expect(result.current.isSelected("a")).toBe(true)
    expect(result.current.checked).toBe("indeterminate")
    expect(result.current.count).toBe(1)
    act(() => result.current.toggle("a"))
    expect(result.current.isSelected("a")).toBe(false)
  })

  it("selects all, then clears all, and leaves rows outside the page alone", () => {
    const { result } = renderHook(() => useTableSelection({ ids, defaultSelected: ["z"] }))
    act(() => result.current.toggleAll())
    expect(result.current.checked).toBe(true)
    act(() => result.current.toggleAll())
    expect(result.current.checked).toBe(false)
    expect(result.current.isSelected("z")).toBe(true)
    act(() => result.current.clear())
    expect(result.current.selected.size).toBe(0)
  })

  it("does not call an empty list checked", () => {
    const { result } = renderHook(() => useTableSelection({ ids: [] }))
    expect(result.current.checked).toBe(false)
  })
})

describe("Table", () => {
  it.each(VARIANTS)("keeps real table semantics in variant=%s", (variant) => {
    const { container } = render(<Invoices variant={variant} />)
    expect(container.querySelector("[data-slot='table']")).toHaveAttribute("data-variant", variant)
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getAllByRole("columnheader")).toHaveLength(2)
    expect(screen.getAllByRole("row")).toHaveLength(4)
    expect(screen.getByText("Open invoices").tagName).toBe("CAPTION")
  })

  it("draws the variants differently: frame, row pattern, density", () => {
    const shape = (variant: TableVariant) => {
      const { container, unmount } = render(<Invoices variant={variant} />)
      const root = container.querySelector("[data-slot='table']") as HTMLElement
      const bodyRow = screen.getAllByRole("row")[1]
      const cell = within(bodyRow).getAllByRole("cell")[0]
      const result = {
        framed: root.classList.contains("rounded-lg"),
        striped: bodyRow.className.includes("odd:bg-muted"),
        lined: bodyRow.className.includes(">td]:border-b"),
        height: Array.from(cell.classList).find((name) => name.startsWith("h-")),
      }
      unmount()
      return result
    }
    expect(shape("plain")).toEqual({ framed: false, striped: false, lined: true, height: "h-12" })
    expect(shape("striped")).toEqual({ framed: false, striped: true, lined: false, height: "h-12" })
    expect(shape("card")).toEqual({ framed: true, striped: false, lined: true, height: "h-14" })
    expect(shape("compact")).toEqual({ framed: false, striped: false, lined: false, height: "h-8" })
  })

  it("aligns numeric columns right with tabular figures, head and cell alike", () => {
    render(<Invoices />)
    expect(screen.getByRole("columnheader", { name: "Amount" })).toHaveClass("text-right")
    expect(screen.getByRole("cell", { name: "120" })).toHaveClass("text-right", "tabular-nums")
    expect(screen.getByRole("cell", { name: "Atlas" })).not.toHaveClass("text-right")
  })

  it("sorts through a header button, with aria-sort on the header cell", async () => {
    const user = userEvent.setup()
    render(<Sortable />)
    const head = screen.getByRole("columnheader", { name: "Customer" })
    const button = within(head).getByRole("button", { name: "Customer" })
    expect(head).toHaveAttribute("aria-sort", "none")
    expect(firstColumn()).toEqual(["Northwind", "Atlas", "Blue Harbour"])
    await user.click(button)
    expect(head).toHaveAttribute("aria-sort", "ascending")
    expect(firstColumn()).toEqual(["Atlas", "Blue Harbour", "Northwind"])
    await user.click(button)
    expect(head).toHaveAttribute("aria-sort", "descending")
    expect(firstColumn()).toEqual(["Northwind", "Blue Harbour", "Atlas"])
    await user.click(button)
    expect(head).toHaveAttribute("aria-sort", "none")
    expect(firstColumn()).toEqual(["Northwind", "Atlas", "Blue Harbour"])
  })

  it("sorts by keyboard and moves the other column back to none", async () => {
    const user = userEvent.setup()
    render(<Sortable />)
    await user.tab()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("columnheader", { name: "Customer" })).toHaveAttribute("aria-sort", "ascending")
    await user.tab()
    await user.keyboard(" ")
    expect(screen.getByRole("columnheader", { name: "Amount" })).toHaveAttribute("aria-sort", "ascending")
    expect(screen.getByRole("columnheader", { name: "Customer" })).toHaveAttribute("aria-sort", "none")
  })

  it("puts the sort icon before a numeric label, so the text stays flush right", () => {
    render(<Sortable />)
    const numericButton = within(screen.getByRole("columnheader", { name: "Amount" })).getByRole("button")
    const textButton = within(screen.getByRole("columnheader", { name: "Customer" })).getByRole("button")
    expect(numericButton.firstElementChild?.tagName.toLowerCase()).toBe("svg")
    expect(textButton.lastElementChild?.tagName.toLowerCase()).toBe("svg")
  })

  it("spans the empty row across every column and keeps it out of the highlight", () => {
    const { container } = render(
      <Table effect="spring">
        <TableBody>
          <TableEmpty colSpan={5}>No invoices yet</TableEmpty>
        </TableBody>
      </Table>,
    )
    const cell = screen.getByRole("cell", { name: "No invoices yet" })
    expect(cell).toHaveAttribute("colspan", "5")
    fireEvent.pointerOver(cell)
    expect(container.querySelector("[data-slot='table-highlight']")).not.toHaveAttribute("data-visible")
  })

  it("makes the head sticky only when asked", () => {
    const { rerender } = render(<Invoices stickyHeader />)
    expect(screen.getByRole("columnheader", { name: "Customer" })).toHaveClass("sticky", "top-0")
    rerender(<Invoices />)
    expect(screen.getByRole("columnheader", { name: "Customer" })).not.toHaveClass("sticky")
  })

  it("tints a selected row and marks it", () => {
    render(
      <Table>
        <TableBody>
          <TableRow selected data-testid="row">
            <TableCell>Atlas</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )
    expect(screen.getByTestId("row")).toHaveAttribute("data-selected", "true")
  })

  it("becomes a named tab stop only once it really overflows", () => {
    const { container } = render(<Invoices scrollLabel="Open invoices table" />)
    const root = container.querySelector("[data-slot='table']") as HTMLElement
    expect(root).not.toHaveAttribute("tabindex")
    Object.defineProperty(root, "scrollWidth", { configurable: true, value: 900 })
    Object.defineProperty(root, "clientWidth", { configurable: true, value: 320 })
    act(() => observers.forEach((callback) => callback()))
    expect(root).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("region", { name: "Open invoices table" })).toBe(root)
  })

  describe("spring highlight", () => {
    const highlight = (container: HTMLElement) => container.querySelector("[data-slot='table-highlight']")

    it("exists only with the effect, and replaces the CSS hover", () => {
      const { container, rerender } = render(<Invoices />)
      expect(highlight(container)).toBeNull()
      expect(screen.getAllByRole("row")[1].className).toContain("hover:bg-accent")
      rerender(<Invoices effect="spring" />)
      expect(highlight(container)).not.toBeNull()
      expect(screen.getAllByRole("row")[1].className).not.toContain("hover:bg-accent")
    })

    it("appears over a body row and leaves with the pointer", () => {
      const { container } = render(<Invoices effect="spring" />)
      const root = container.querySelector("[data-slot='table']") as HTMLElement
      fireEvent.pointerOver(screen.getByRole("cell", { name: "Atlas" }))
      expect(highlight(container)).toHaveAttribute("data-visible", "true")
      fireEvent.pointerLeave(root)
      expect(highlight(container)).not.toHaveAttribute("data-visible")
    })

    it("follows keyboard focus inside the rows too", () => {
      const { container } = render(
        <Table effect="spring">
          <TableBody>
            <TableRow>
              <TableCell>
                <button type="button">Open</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      )
      fireEvent.focus(screen.getByRole("button", { name: "Open" }))
      expect(highlight(container)).toHaveAttribute("data-visible", "true")
    })

    it("ignores the header row", () => {
      const { container } = render(<Invoices effect="spring" />)
      fireEvent.pointerOver(screen.getByRole("columnheader", { name: "Customer" }))
      expect(highlight(container)).not.toHaveAttribute("data-visible")
    })
  })
})
