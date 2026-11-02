import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Breadcrumb, collapseItems, type BreadcrumbEntry } from "./breadcrumb"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const entries = (...names: string[]): BreadcrumbEntry[] =>
  names.map((name) => ({ label: name, href: `/${name.toLowerCase()}` }))

const SHORT = entries("Home", "Billing", "Invoices")
const LONG = entries("Home", "Northwind", "Projects", "Atlas", "Settings", "Billing", "Invoices")

describe("collapseItems", () => {
  it("keeps everything when the trail fits", () => {
    expect(collapseItems(SHORT, 4)).toEqual({ before: SHORT, hidden: [], after: [] })
  })

  it("keeps the root and the nearest pages", () => {
    const { before, hidden, after } = collapseItems(LONG, 4)
    expect(before.map((item) => item.label)).toEqual(["Home"])
    expect(hidden.map((item) => item.label)).toEqual(["Northwind", "Projects", "Atlas"])
    expect(after.map((item) => item.label)).toEqual(["Settings", "Billing", "Invoices"])
  })

  it("does not build a menu for one page, which would save nothing", () => {
    const five = entries("Home", "Northwind", "Projects", "Atlas", "Settings")
    expect(collapseItems(five, 4).hidden).toHaveLength(0)
  })

  it("always keeps the current page, even with a tiny limit", () => {
    const { after } = collapseItems(LONG, 1)
    expect(after.map((item) => item.label)).toEqual(["Invoices"])
  })
})

describe("Breadcrumb semantics", () => {
  it("is a named nav landmark with an ordered list", () => {
    render(<Breadcrumb items={SHORT} />)
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3)
    expect(nav).toHaveAttribute("data-slot", "breadcrumb")
  })

  it("marks the last page as current and never makes it a link", () => {
    render(<Breadcrumb items={SHORT} />)
    expect(screen.queryByRole("link", { name: "Invoices" })).not.toBeInTheDocument()
    expect(screen.getByText("Invoices")).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Billing" })).toHaveAttribute("href", "/billing")
  })

  it("hides separators from assistive tech", () => {
    const { container } = render(<Breadcrumb items={SHORT} />)
    const separators = container.querySelectorAll("[data-slot='breadcrumb-separator']")
    expect(separators).toHaveLength(2)
    separators.forEach((separator) => expect(separator).toHaveAttribute("aria-hidden", "true"))
  })

  it("renders an entry with only onClick as a button", async () => {
    const onClick = vi.fn()
    render(<Breadcrumb items={[{ label: "Home", onClick }, { label: "Here" }]} />)
    await userEvent.click(screen.getByRole("button", { name: "Home" }))
    expect(onClick).toHaveBeenCalled()
  })

  it("hands links to a router through renderLink", () => {
    render(
      <Breadcrumb
        items={SHORT}
        renderLink={(entry, props) => <a {...props} data-router="true" data-to={entry.href} />}
      />,
    )
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("data-to", "/home")
  })

  it("renders nothing for an empty trail", () => {
    const { container } = render(<Breadcrumb items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("Breadcrumb collapse", () => {
  it("moves the middle into a keyboard menu with working links", async () => {
    const user = userEvent.setup()
    render(<Breadcrumb items={LONG} />)
    expect(screen.queryByRole("link", { name: "Projects" })).not.toBeInTheDocument()
    await user.tab()
    await user.tab()
    const more = screen.getByRole("button", { name: "Show hidden pages" })
    expect(more).toHaveFocus()
    await user.keyboard("{Enter}")
    const menu = await screen.findByRole("menu")
    const links = within(menu).getAllByRole("menuitem")
    expect(links.map((link) => link.textContent)).toEqual(["Northwind", "Projects", "Atlas"])
    expect(links[1]).toHaveAttribute("href", "/projects")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
    expect(more).toHaveFocus()
  })

  it("respects maxItems", () => {
    render(<Breadcrumb items={LONG} maxItems={10} />)
    expect(screen.queryByRole("button", { name: "Show hidden pages" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument()
  })
})

describe("Breadcrumb designs", () => {
  it("chevron draws an icon between crumbs and slash a character", () => {
    const { container, rerender } = render(<Breadcrumb items={SHORT} />)
    const separator = () => container.querySelector("[data-slot='breadcrumb-separator']")
    expect(separator()?.querySelector("svg")).not.toBeNull()
    rerender(<Breadcrumb items={SHORT} variant="slash" />)
    expect(separator()).toHaveTextContent("/")
    expect(separator()?.querySelector("svg")).toBeNull()
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("font-mono")
  })

  it("pill has no separators and turns each crumb into a chip", () => {
    const { container } = render(<Breadcrumb items={SHORT} variant="pill" />)
    expect(container.querySelector("[data-slot='breadcrumb-separator']")).toBeNull()
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("rounded-full", "bg-muted")
    expect(screen.getByText("Invoices")).toHaveClass("bg-foreground", "text-background")
  })

  it("back shows only the parent, with no list", () => {
    render(<Breadcrumb items={SHORT} variant="back" />)
    const nav = screen.getByRole("navigation")
    expect(within(nav).queryByRole("list")).not.toBeInTheDocument()
    const back = screen.getByRole("link", { name: "Back to Billing" })
    expect(back).toHaveAttribute("href", "/billing")
    expect(screen.queryByText("Home")).not.toBeInTheDocument()
    expect(screen.queryByText("Invoices")).not.toBeInTheDocument()
  })

  it("back renders nothing when there is no parent to go to", () => {
    const { container } = render(<Breadcrumb items={[{ label: "Home" }]} variant="back" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("Breadcrumb spring effect", () => {
  const highlight = (container: HTMLElement) => container.querySelector("[data-slot='breadcrumb-highlight']")

  it("moves one highlight between crumbs and clears it when the pointer leaves", async () => {
    const user = userEvent.setup()
    const { container } = render(<Breadcrumb items={SHORT} effect="spring" />)
    expect(highlight(container)).toBeNull()
    const home = screen.getByRole("link", { name: "Home" })
    await user.hover(home)
    expect(home.parentElement).toContainElement(highlight(container) as HTMLElement)
    const billing = screen.getByRole("link", { name: "Billing" })
    await user.hover(billing)
    expect(container.querySelectorAll("[data-slot='breadcrumb-highlight']")).toHaveLength(1)
    expect(billing.parentElement).toContainElement(highlight(container) as HTMLElement)
    await user.unhover(billing)
    await waitFor(() => expect(highlight(container)).toBeNull())
  })

  it("follows keyboard focus too", async () => {
    const user = userEvent.setup()
    const { container } = render(<Breadcrumb items={SHORT} effect="spring" />)
    await user.tab()
    expect(screen.getByRole("link", { name: "Home" }).parentElement).toContainElement(highlight(container) as HTMLElement)
    expect(screen.getByRole("navigation")).toHaveAttribute("data-effect", "spring")
  })

  it("adds no highlight without the effect", async () => {
    const user = userEvent.setup()
    const { container } = render(<Breadcrumb items={SHORT} />)
    await user.hover(screen.getByRole("link", { name: "Home" }))
    expect(highlight(container)).toBeNull()
  })
})
