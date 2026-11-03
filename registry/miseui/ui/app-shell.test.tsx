import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AppShell, type AppShellProps, type AppShellVariant } from "./app-shell"
import { Sidebar, SidebarContent, SidebarGroup, SidebarItem } from "./sidebar"

let shellWidth = 1024
const observers: { callback: ResizeObserverCallback }[] = []

class ResizeObserverStub {
  readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    observers.push(this)
  }
  observe = () => this.callback([{ contentRect: { width: shellWidth } } as ResizeObserverEntry], this as unknown as ResizeObserver)
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.scrollIntoView = vi.fn()
})

afterAll(() => vi.unstubAllGlobals())

afterEach(() => {
  shellWidth = 1024
  observers.length = 0
})

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement

const NAV = (
  <Sidebar label="Main">
    <SidebarContent>
      <SidebarGroup>
        <SidebarItem href="/inbox">Inbox</SidebarItem>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
)

const renderShell = (props: Partial<AppShellProps> = {}) =>
  render(
    <AppShell title="Invoices" sidebar={NAV} {...props}>
      <p>Page body</p>
    </AppShell>,
  )

describe("AppShell", () => {
  it.each<AppShellVariant>(["sidebar", "topbar", "split", "centered"])("variant=%s has one main landmark holding the content", (variant) => {
    renderShell({ variant })
    expect(slot("app-shell")).toHaveAttribute("data-variant", variant)
    expect(screen.getAllByRole("main")).toHaveLength(1)
    expect(screen.getByRole("main")).toContainElement(screen.getByText("Page body"))
    expect(screen.getByRole("banner")).toHaveTextContent("Invoices")
  })

  it("the skip link comes first in tab order and moves focus to main", async () => {
    const user = setup()
    renderShell()
    await user.tab()
    const skip = screen.getByRole("link", { name: "Skip to content" })
    expect(skip).toHaveFocus()
    await user.click(skip)
    expect(screen.getByRole("main")).toHaveFocus()
    expect(window.location.hash).toBe("")
  })

  it("sidebar composes the rail beside the page on a wide shell, with a working toggle", async () => {
    const user = setup()
    const onCollapsedChange = vi.fn()
    renderShell({ onCollapsedChange })
    expect(screen.getByRole("complementary", { name: "Main" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
    expect(onCollapsedChange).toHaveBeenCalledWith(true)
    expect(slot("sidebar")).toHaveAttribute("data-collapsed", "true")
  })

  it("a narrow shell turns the sidebar into a drawer, even on a wide viewport", async () => {
    shellWidth = 320
    const user = setup()
    renderShell()
    expect(screen.queryByRole("complementary")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }))
    const dialog = await screen.findByRole("dialog", { name: "Main" })
    expect(within(dialog).getByRole("link", { name: "Inbox" })).toBeInTheDocument()
  })

  it("topbar has a named nav, no sidebar toggle and no sidebar", () => {
    renderShell({ variant: "topbar", nav: <a href="/a">Reports</a>, navLabel: "Sections" })
    expect(screen.getByRole("navigation", { name: "Sections" })).toContainElement(screen.getByRole("link", { name: "Reports" }))
    expect(screen.queryByRole("button", { name: "Toggle sidebar" })).toBeNull()
    expect(screen.queryByRole("complementary")).toBeNull()
  })

  it("split shows both panes, named, and hides one by the state it was given", () => {
    const { rerender } = render(
      <AppShell variant="split" list={<p>Rows</p>} listLabel="Threads" detailLabel="Thread" detailOpen={false}>
        <p>Body</p>
      </AppShell>,
    )
    expect(screen.getByRole("region", { name: "Threads" })).toHaveTextContent("Rows")
    expect(slot("app-shell-detail")).toHaveClass("hidden")
    expect(slot("app-shell-list")).not.toHaveClass("hidden")
    rerender(
      <AppShell variant="split" list={<p>Rows</p>} listLabel="Threads" detailLabel="Thread" detailOpen>
        <p>Body</p>
      </AppShell>,
    )
    expect(slot("app-shell-list")).toHaveClass("hidden")
    expect(slot("app-shell-detail")).not.toHaveClass("hidden")
  })

  it("split on a phone moves focus with the pane and offers the way back", async () => {
    shellWidth = 320
    const user = setup()
    const onBack = vi.fn()
    const { rerender } = render(
      <AppShell variant="split" list={<p>Rows</p>} detailOpen={false} onBack={onBack}>
        <p>Body</p>
      </AppShell>,
    )
    rerender(
      <AppShell variant="split" list={<p>Rows</p>} detailOpen onBack={onBack}>
        <p>Body</p>
      </AppShell>,
    )
    await waitFor(() => expect(slot("app-shell-detail")).toHaveFocus())
    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(onBack).toHaveBeenCalled()
  })

  it("split leaves focus alone on a wide shell, where both panes are in view", async () => {
    const { rerender } = render(
      <AppShell variant="split" list={<button type="button">Row</button>} detailOpen={false}>
        <p>Body</p>
      </AppShell>,
    )
    screen.getByRole("button", { name: "Row" }).focus()
    rerender(
      <AppShell variant="split" list={<button type="button">Row</button>} detailOpen>
        <p>Body</p>
      </AppShell>,
    )
    expect(screen.getByRole("button", { name: "Row" })).toHaveFocus()
  })

  it("centered keeps the content in one reading column", () => {
    renderShell({ variant: "centered" })
    expect(screen.getByText("Page body").parentElement).toHaveClass("max-w-2xl")
  })

  it("fill sizes to the parent, and without it the shell owns the viewport", () => {
    const { unmount } = renderShell({ fill: true })
    expect(slot("app-shell")).toHaveClass("h-full")
    expect(slot("app-shell")).not.toHaveClass("min-h-dvh")
    unmount()
    renderShell()
    expect(slot("app-shell")).toHaveClass("min-h-dvh")
  })

  it("reacts when the shell is resized across the line", () => {
    renderShell()
    expect(screen.getByRole("complementary", { name: "Main" })).toBeInTheDocument()
    act(() => observers.at(-1)?.callback([{ contentRect: { width: 400 } } as ResizeObserverEntry], {} as ResizeObserver))
    expect(screen.queryByRole("complementary")).toBeNull()
  })
})
