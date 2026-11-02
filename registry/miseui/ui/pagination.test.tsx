import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Pagination, getDotWindow, getPageWindow, type PageSlot } from "./pagination"

window.scrollTo = vi.fn()

describe("getPageWindow", () => {
  const E = "ellipsis-end"
  const S = "ellipsis-start"

  it.each<[number, PageSlot[]]>([
    [1, [1, 2, 3, 4, 5, E, 12]],
    [4, [1, 2, 3, 4, 5, E, 12]],
    [5, [1, S, 4, 5, 6, E, 12]],
    [8, [1, S, 7, 8, 9, E, 12]],
    [9, [1, S, 8, 9, 10, 11, 12]],
    [12, [1, S, 8, 9, 10, 11, 12]],
  ])("page %i of 12", (page, want) => {
    expect(getPageWindow({ page, pageCount: 12 })).toEqual(want)
  })

  it("keeps the slot count constant, so controls never shift", () => {
    const lengths = Array.from({ length: 40 }, (_, index) => getPageWindow({ page: index + 1, pageCount: 40 }).length)
    expect(new Set(lengths)).toEqual(new Set([7]))
  })

  it("never hides a single page behind an ellipsis", () => {
    expect(getPageWindow({ page: 4, pageCount: 8 })).toEqual([1, 2, 3, 4, 5, E, 8])
    expect(getPageWindow({ page: 5, pageCount: 8 })).toEqual([1, S, 4, 5, 6, 7, 8])
  })

  it("draws every page when they fit, and nothing when there are none", () => {
    expect(getPageWindow({ page: 1, pageCount: 7 })).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(getPageWindow({ page: 1, pageCount: 0 })).toEqual([])
    expect(getPageWindow({ page: 1, pageCount: -3 })).toEqual([])
  })

  it("clamps bad input instead of drawing nonsense", () => {
    expect(getPageWindow({ page: 99, pageCount: 12 })).toEqual(getPageWindow({ page: 12, pageCount: 12 }))
    expect(getPageWindow({ page: -2, pageCount: 12 })).toEqual(getPageWindow({ page: 1, pageCount: 12 }))
    expect(getPageWindow({ page: Number.NaN, pageCount: 12 })).toEqual(getPageWindow({ page: 1, pageCount: 12 }))
  })

  it("honours siblings and boundaries", () => {
    expect(getPageWindow({ page: 10, pageCount: 20, siblings: 0 })).toEqual([1, S, 10, E, 20])
    expect(getPageWindow({ page: 10, pageCount: 20, siblings: 2, boundaries: 2 })).toEqual([1, 2, S, 8, 9, 10, 11, 12, E, 19, 20])
  })
})

describe("getDotWindow", () => {
  it("slides around the current page and stays in range", () => {
    expect(getDotWindow(1, 20)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(getDotWindow(10, 20)).toEqual([7, 8, 9, 10, 11, 12, 13])
    expect(getDotWindow(20, 20)).toEqual([14, 15, 16, 17, 18, 19, 20])
    expect(getDotWindow(2, 3)).toEqual([1, 2, 3])
    expect(getDotWindow(1, 0)).toEqual([])
  })
})

describe("Pagination numbers", () => {
  it("is a labelled landmark with aria-current on the active page", () => {
    render(<Pagination pageCount={12} defaultPage={5} />)
    const nav = screen.getByRole("navigation", { name: "Pagination" })
    expect(nav).toHaveAttribute("data-variant", "numbers")
    expect(screen.getByRole("button", { name: "Page 5" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "Page 4" })).not.toHaveAttribute("aria-current")
  })

  it("moves by click and keyboard, and disables the ends", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination pageCount={3} onPageChange={onPageChange} />)
    const previous = screen.getByRole("button", { name: "Previous page" })
    const next = screen.getByRole("button", { name: "Next page" })
    expect(previous).toBeDisabled()
    await user.click(next)
    expect(onPageChange).toHaveBeenLastCalledWith(2)
    await user.tab({ shift: true })
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onPageChange).toHaveBeenLastCalledWith(3)
    expect(next).toBeDisabled()
  })

  it("follows a controlled page, and clamps it to the page count", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Pagination page={2} pageCount={5} />)
    await user.click(screen.getByRole("button", { name: "Page 3" }))
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page")
    rerender(<Pagination page={99} pageCount={5} />)
    expect(screen.getByRole("button", { name: "Page 5" })).toHaveAttribute("aria-current", "page")
  })
})

describe("Pagination variants", () => {
  it("simple shows Page X of Y with no page buttons", async () => {
    const user = userEvent.setup()
    render(<Pagination variant="simple" pageCount={12} defaultPage={3} />)
    expect(screen.getByText(/of 12/)).toHaveTextContent("Page 3 of 12")
    expect(screen.queryByRole("button", { name: "Page 3" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Next page" }))
    expect(screen.getByText(/of 12/)).toHaveTextContent("Page 4 of 12")
  })

  it("dots has no previous or next, and caps the dots", async () => {
    const user = userEvent.setup()
    render(<Pagination variant="dots" pageCount={20} defaultPage={10} />)
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull()
    expect(screen.getAllByRole("button")).toHaveLength(7)
    expect(screen.getByRole("button", { name: "Page 10" })).toHaveAttribute("aria-current", "page")
    await user.click(screen.getByRole("button", { name: "Page 11" }))
    expect(screen.getByRole("button", { name: "Page 11" })).toHaveAttribute("aria-current", "page")
  })

  it("load-more counts items and stops at the end", async () => {
    const user = userEvent.setup()
    render(<Pagination variant="load-more" itemCount={60} pageSize={24} />)
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 24 of 60")
    await user.click(screen.getByRole("button", { name: "Load more" }))
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 48 of 60")
    await user.click(screen.getByRole("button", { name: "Load more" }))
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 60 of 60")
    expect(screen.getByRole("button", { name: "All loaded" })).toBeDisabled()
  })

  it("load-more is busy and not clickable while loading", () => {
    render(<Pagination variant="load-more" itemCount={60} loading />)
    const button = screen.getByRole("button", { name: "Loading" })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
  })
})

describe("Pagination spring effect", () => {
  it("draws one indicator, inside the active page only, per instance", async () => {
    const user = userEvent.setup()
    render(
      <>
        <Pagination aria-label="Invoices" effect="spring" pageCount={5} />
        <Pagination aria-label="Payments" effect="spring" pageCount={5} defaultPage={3} />
      </>,
    )
    const invoices = screen.getByRole("navigation", { name: "Invoices" })
    expect(invoices).toHaveAttribute("data-effect", "spring")
    expect(invoices.querySelectorAll("[data-slot='pagination-indicator']")).toHaveLength(1)
    const pageTwo = invoices.querySelector("button[aria-label='Page 2']") as HTMLButtonElement
    await user.click(pageTwo)
    expect(pageTwo.querySelector("[data-slot='pagination-indicator']")).not.toBeNull()
    const payments = screen.getByRole("navigation", { name: "Payments" })
    expect(payments.querySelector("button[aria-label='Page 3'] [data-slot='pagination-indicator']")).not.toBeNull()
  })

  it("also moves on dots", () => {
    render(<Pagination variant="dots" effect="spring" pageCount={4} defaultPage={2} />)
    expect(screen.getByRole("button", { name: "Page 2" }).querySelector("[data-slot='pagination-indicator']")).not.toBeNull()
  })
})
