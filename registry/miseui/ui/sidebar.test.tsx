import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarNested,
  SidebarProvider,
  SidebarTrigger,
  isToggleShortcut,
  type SidebarProps,
  type SidebarVariant,
} from "./sidebar"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

const originalMatchMedia = window.matchMedia
let phone = false

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query.includes("max-width") ? phone : false
      },
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

afterEach(() => {
  phone = false
})

const Icon = () => <svg data-testid="icon" />

function Nav() {
  return (
    <>
      <SidebarHeader>Harbor</SidebarHeader>
      <SidebarContent>
        <SidebarGroup label="Workspace">
          <SidebarItem icon={<Icon />} href="/inbox" active badge={3}>
            Inbox
          </SidebarItem>
          <SidebarItem icon={<Icon />}>Reports</SidebarItem>
          <SidebarItem icon={<Icon />} disabled>
            Billing
          </SidebarItem>
          <SidebarNested icon={<Icon />} label="Projects">
            <SidebarItem href="/atlas">Atlas</SidebarItem>
            <SidebarItem href="/pine">Pine</SidebarItem>
          </SidebarNested>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarItem icon={<Icon />}>Settings</SidebarItem>
        </SidebarGroup>
      </SidebarFooter>
    </>
  )
}

const renderSidebar = (props: Partial<SidebarProps> = {}) =>
  render(
    <Sidebar {...props}>
      <Nav />
    </Sidebar>,
  )
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement
const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

describe("isToggleShortcut", () => {
  it("takes either modifier with B and nothing else", () => {
    const base = { key: "b", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false }
    expect(isToggleShortcut({ ...base, metaKey: true })).toBe(true)
    expect(isToggleShortcut({ ...base, ctrlKey: true, key: "B" })).toBe(true)
    expect(isToggleShortcut(base)).toBe(false)
    expect(isToggleShortcut({ ...base, ctrlKey: true, shiftKey: true })).toBe(false)
    expect(isToggleShortcut({ ...base, ctrlKey: true, key: "c" })).toBe(false)
  })
})

describe("Sidebar", () => {
  it("left-aligns item labels, because a button centres its text by default", () => {
    renderSidebar()
    const item = document.querySelector("[data-slot='sidebar-item']")
    expect(item).toHaveClass("text-start")
  })

  it.each<SidebarVariant>(["plain", "floating", "inset"])("variant=%s shows words and marks itself", (variant) => {
    renderSidebar({ variant })
    expect(slot("sidebar")).toHaveAttribute("data-variant", variant)
    expect(slot("sidebar")).not.toHaveAttribute("data-collapsed")
    expect(slot("sidebar")).toHaveStyle({ width: "240px" })
  })

  it("variants differ in the surface they draw", () => {
    const surfaces = (["plain", "floating", "inset"] as const).map((variant) => {
      const { unmount } = renderSidebar({ variant })
      const className = slot("sidebar").className
      unmount()
      return className
    })
    expect(new Set(surfaces).size).toBe(3)
  })

  it("rail stays icons only, ignores the toggle and hides its button", () => {
    render(
      <SidebarProvider variant="rail">
        <SidebarTrigger />
        <Sidebar>
          <Nav />
        </Sidebar>
      </SidebarProvider>,
    )
    expect(slot("sidebar")).toHaveAttribute("data-collapsed", "true")
    expect(slot("sidebar")).toHaveStyle({ width: "56px" })
    expect(slot("sidebar-trigger")).toBeNull()
    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    expect(slot("sidebar")).toHaveAttribute("data-collapsed", "true")
  })

  it("the current page has aria-current and the badge sits in its name", () => {
    renderSidebar()
    const link = screen.getByRole("link", { name: /^Inbox,\s*3$/ })
    expect(link).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "Reports" })).not.toHaveAttribute("aria-current")
  })

  it("gives navigation a landmark and groups a name", () => {
    renderSidebar({ label: "Main" })
    expect(screen.getByRole("complementary", { name: "Main" })).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Workspace" })).toContainElement(screen.getByRole("link", { name: /^Inbox,\s*3$/ }))
  })

  it("a disabled item is not a control", () => {
    renderSidebar()
    expect(screen.queryByRole("button", { name: "Billing" })).toBeNull()
    expect(screen.getByText("Billing").closest("[data-slot='sidebar-item']")).toHaveAttribute("aria-disabled", "true")
  })

  it("nested groups open by button with aria-expanded, and start closed", async () => {
    const user = setup()
    renderSidebar()
    const trigger = screen.getByRole("button", { name: "Projects" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("link", { name: "Atlas" })).toBeNull()
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("link", { name: "Atlas" })).toBeInTheDocument()
  })

  it("Mod+B toggles and reports the new state, without any storage", () => {
    const onCollapsedChange = vi.fn()
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    renderSidebar({ onCollapsedChange })
    fireEvent.keyDown(window, { key: "b", metaKey: true })
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true)
    expect(slot("sidebar")).toHaveAttribute("data-collapsed", "true")
    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false)
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it("Mod+B is left alone while someone types", () => {
    const onCollapsedChange = vi.fn()
    render(
      <>
        <input aria-label="Note" />
        <Sidebar onCollapsedChange={onCollapsedChange}>
          <Nav />
        </Sidebar>
      </>,
    )
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Note" }), { key: "b", ctrlKey: true })
    expect(onCollapsedChange).not.toHaveBeenCalled()
  })

  it("shortcut can be turned off, and the controlled prop wins", () => {
    const onCollapsedChange = vi.fn()
    const { unmount } = renderSidebar({ shortcut: false, onCollapsedChange })
    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    expect(onCollapsedChange).not.toHaveBeenCalled()
    unmount()
    renderSidebar({ collapsed: true, onCollapsedChange })
    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    expect(onCollapsedChange).toHaveBeenCalledWith(false)
    expect(slot("sidebar")).toHaveAttribute("data-collapsed", "true")
  })

  it("collapsed keeps every name, marks the badge and opens nested items as a menu", async () => {
    const user = setup()
    renderSidebar({ defaultCollapsed: true })
    expect(screen.getByRole("link", { name: /^Inbox,\s*3$/ })).toBeInTheDocument()
    expect(slot("sidebar-badge-mark")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Projects" }))
    const menu = await screen.findByRole("menu", { name: "Projects" })
    expect(within(menu).getByRole("menuitem", { name: "Atlas" })).toHaveAttribute("href", "/atlas")
  })

  it("collapsed shows a tooltip naming the item", async () => {
    const user = setup()
    renderSidebar({ defaultCollapsed: true })
    await user.hover(screen.getByRole("button", { name: "Reports" }))
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Reports"))
  })

  it("a trigger outside the sidebar toggles through the provider", async () => {
    const user = setup()
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <Nav />
        </Sidebar>
        <SidebarInset>Page</SidebarInset>
      </SidebarProvider>,
    )
    const trigger = screen.getByRole("button", { name: "Toggle sidebar" })
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(trigger).toHaveAttribute("aria-keyshortcuts", "Meta+B Control+B")
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(slot("sidebar")).toHaveAttribute("data-collapsed", "true")
  })

  it("on a phone it becomes a drawer that opens from the trigger and closes on choice", async () => {
    phone = true
    const user = setup()
    render(
      <SidebarProvider variant="rail">
        <SidebarTrigger />
        <Sidebar label="Main">
          <Nav />
        </Sidebar>
      </SidebarProvider>,
    )
    expect(slot("sidebar")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
    const dialog = await screen.findByRole("dialog", { name: "Main" })
    expect(slot("sidebar")).toHaveAttribute("data-drawer", "true")
    expect(within(dialog).getByText("Reports")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Reports" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("spring keeps the state on the same surface and marks the effect", () => {
    renderSidebar({ effect: "spring", collapsed: false })
    expect(slot("sidebar")).toHaveAttribute("data-effect", "spring")
    act(() => undefined)
    expect(slot("sidebar").tagName).toBe("ASIDE")
  })

  it("render hands the router its link props", () => {
    render(
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarItem active render={(props) => <a {...props} href="/routed" data-router="yes" />}>
              Routed
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>,
    )
    const link = screen.getByRole("link", { name: "Routed" })
    expect(link).toHaveAttribute("data-router", "yes")
    expect(link).toHaveAttribute("aria-current", "page")
  })
})
