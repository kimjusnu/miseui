import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SiteHeader, type SiteHeaderVariant } from "./site-header"

class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {
    this.callback([], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}

beforeAll(() => vi.stubGlobal("ResizeObserver", ResizeObserverStub))
afterAll(() => vi.unstubAllGlobals())

const root = (container: HTMLElement) => container.querySelector('[data-slot="site-header"]')

describe("SiteHeader variants", () => {
  it("renders bar without the prop and for an unknown value, including constructor", () => {
    const { container, rerender } = render(<SiteHeader />)
    expect(root(container)).toHaveAttribute("data-variant", "bar")
    rerender(<SiteHeader variant={"constructor" as SiteHeaderVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "bar")
    rerender(<SiteHeader variant={"nonsense" as SiteHeaderVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "bar")
  })

  it("differs in structure, not only in colour", () => {
    const { container, rerender } = render(<SiteHeader />)
    expect(container.querySelector('[data-slot="site-header-bar"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="navigation-menu"]')).toBeNull()
    expect(container.querySelector('[data-slot="floating-nav"]')).toBeNull()
    rerender(<SiteHeader variant="mega" />)
    expect(container.querySelector('[data-slot="navigation-menu"]')).not.toBeNull()
    expect(screen.getByRole("button", { name: "Product" })).toBeInTheDocument()
    rerender(<SiteHeader variant="floating" />)
    expect(container.querySelector('[data-slot="navigation-menu"]')).toBeNull()
    expect(container.querySelector('[data-slot="floating-nav"]')).not.toBeNull()
  })

  it("stays inside its own root by default, and attaches to the window only when asked", () => {
    const { container, rerender } = render(<SiteHeader />)
    const header = () => container.querySelector("header")
    expect(root(container)).toHaveClass("relative")
    expect(header()).toHaveClass("sticky")
    expect(header()).not.toHaveClass("fixed")
    rerender(<SiteHeader position="fixed" />)
    expect(header()).toHaveClass("fixed")
    rerender(<SiteHeader variant="floating" />)
    expect(header()).toHaveClass("sticky")
    expect(header()).toHaveClass("h-0")
  })

  it("does not put its props on the DOM node", () => {
    const { container } = render(<SiteHeader brandName="Example" primaryAction={null} />)
    expect(root(container)).not.toHaveAttribute("brandName")
    expect(root(container)).not.toHaveAttribute("primaryAction")
  })
})

describe("skip link", () => {
  it("comes first in the tab order and moves focus to the page", async () => {
    render(
      <SiteHeader>
        <p>The page</p>
      </SiteHeader>,
    )
    await userEvent.tab()
    const skip = screen.getByRole("link", { name: "Skip to content" })
    expect(skip).toHaveFocus()
    await userEvent.click(skip)
    expect(screen.getByRole("main")).toHaveFocus()
    expect(screen.getByRole("main")).toHaveTextContent("The page")
  })

  it("points at the owner's main when the page is elsewhere", async () => {
    render(
      <>
        <SiteHeader mainId="my-page" />
        <main id="my-page">Elsewhere</main>
      </>,
    )
    await userEvent.click(screen.getByRole("link", { name: "Skip to content" }))
    expect(screen.getByRole("main")).toHaveFocus()
  })

  it("is left out when there is nothing to skip to", () => {
    render(<SiteHeader />)
    expect(screen.queryByRole("link", { name: "Skip to content" })).not.toBeInTheDocument()
  })
})

describe("phone drawer", () => {
  it("opens from the menu button, holds the links and actions, and returns focus on Escape", async () => {
    render(<SiteHeader />)
    const trigger = screen.getByRole("button", { name: "Open menu" })
    await userEvent.click(trigger)
    const drawer = await screen.findByRole("dialog")
    expect(within(drawer).getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing")
    expect(within(drawer).getByRole("link", { name: "Get started" })).toBeInTheDocument()
    expect(within(drawer).getByRole("link", { name: "Log in" })).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it("closes on a choice, reports it, and marks the page", async () => {
    const onNavigate = vi.fn()
    render(<SiteHeader onNavigate={onNavigate} />)
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("link", { name: "Docs" }))
    expect(onNavigate).toHaveBeenCalledWith("#docs")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page")
  })

  it("lays the mega menus out flat with their group names", async () => {
    render(<SiteHeader variant="mega" />)
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))
    const drawer = await screen.findByRole("dialog")
    expect(within(drawer).getByText("Getting paid")).toBeInTheDocument()
    expect(within(drawer).getByRole("link", { name: "Payment links" })).toBeInTheDocument()
    expect(within(drawer).getByRole("link", { name: "Pricing" })).toBeInTheDocument()
  })

  it("leaves out an action the owner removed", async () => {
    render(<SiteHeader primaryAction={null} secondaryAction={null} />)
    expect(screen.queryByRole("link", { name: "Get started" })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(within(await screen.findByRole("dialog")).queryByRole("link", { name: "Log in" })).not.toBeInTheDocument()
  })
})

describe("bar", () => {
  it("marks the page the owner says is current", () => {
    render(<SiteHeader currentHref="#pricing" />)
    const nav = screen.getByRole("navigation", { name: "Main" })
    expect(within(nav).getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "Docs" })).not.toHaveAttribute("aria-current")
  })
})

describe("mega", () => {
  it("opens a panel of grouped links that say where they go", async () => {
    render(<SiteHeader variant="mega" />)
    const product = screen.getByRole("button", { name: "Product" })
    expect(product).toHaveAttribute("aria-expanded", "false")
    await userEvent.click(product)
    expect(product).toHaveAttribute("aria-expanded", "true")
    const group = await screen.findByRole("group", { name: "Getting paid" })
    expect(within(group).getByRole("link", { name: /Payment links.*A page anyone can pay on/ })).toBeInTheDocument()
  })

  it("closes the panel on Escape and keeps focus on its trigger", async () => {
    render(<SiteHeader variant="mega" />)
    const product = screen.getByRole("button", { name: "Product" })
    await userEvent.click(product)
    await screen.findByRole("group", { name: "Getting paid" })
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(product).toHaveAttribute("aria-expanded", "false"))
    expect(product).toHaveFocus()
  })
})

describe("floating", () => {
  it("marks the pressed link with the nav's own current state", async () => {
    const onNavigate = vi.fn()
    render(<SiteHeader variant="floating" onNavigate={onNavigate} />)
    const nav = screen.getByRole("navigation", { name: "Main" })
    await userEvent.click(within(nav).getByRole("link", { name: "Pricing" }))
    expect(onNavigate).toHaveBeenCalledWith("#pricing")
    expect(within(nav).getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page")
  })

  it("keeps the page clear of the row that has no height", () => {
    render(
      <SiteHeader variant="floating">
        <p>The page</p>
      </SiteHeader>,
    )
    expect(screen.getByRole("main")).toHaveClass("pt-16")
  })
})
