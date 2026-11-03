import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Flow, type FlowProps, type FlowStep, type FlowVariant } from "./flow"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

class ViewStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", ViewStub)
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const STEPS: readonly FlowStep[] = [
  { title: "Draft", detail: "The author writes it.", tag: "Author", arrow: "when ready" },
  { title: "Review", detail: "A teammate reads it.", arrow: "if approved" },
  { title: "Publish", detail: "It goes live." },
]

const LISTED: readonly FlowVariant[] = ["chain", "rail", "inline"]

function Sample(props: Partial<FlowProps>) {
  return <Flow label="Publishing" steps={STEPS} {...props} />
}

describe("Flow", () => {
  it.each(["walkthrough", ...LISTED] as const)("variant=%s marks the root and shows every step title", (variant) => {
    const { container } = render(<Sample variant={variant} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-slot", "flow")
    expect(root).toHaveAttribute("data-variant", variant)
    STEPS.forEach((step) => expect(screen.getByText(step.title)).toBeInTheDocument())
  })

  it.each(LISTED)("variant=%s keeps the order in a real list, and draws one connector fewer than steps", (variant) => {
    const { container } = render(<Sample variant={variant} />)
    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Draft"),
      expect.stringContaining("Review"),
      expect.stringContaining("Publish"),
    ])
    expect(container.querySelectorAll("[data-slot='flow-arrow']")).toHaveLength(2)
  })

  it.each(LISTED)("variant=%s puts the words on the arrow, and none after the last step", (variant) => {
    const { container } = render(<Sample variant={variant} />)
    const labels = [...container.querySelectorAll("[data-slot='flow-arrow-label']")].map((label) => label.textContent)
    expect(labels).toEqual(["when ready", "if approved"])
  })

  it("builds each variant differently", () => {
    const shape = (variant: FlowVariant) => {
      const { container, unmount } = render(<Sample variant={variant} />)
      const found = {
        tabs: screen.queryAllByRole("tab").length,
        list: container.querySelector("[data-slot='flow-list']")?.tagName ?? null,
        visibleDetail: !screen.getByText("A teammate reads it.").classList.contains("sr-only"),
        wraps: container.querySelector("[data-slot='flow-list']")?.classList.contains("flex-wrap") ?? false,
      }
      unmount()
      return found
    }
    expect(shape("walkthrough")).toEqual({ tabs: 3, list: null, visibleDetail: true, wraps: false })
    expect(shape("chain")).toEqual({ tabs: 0, list: "OL", visibleDetail: true, wraps: false })
    expect(shape("rail")).toEqual({ tabs: 0, list: "OL", visibleDetail: true, wraps: false })
    expect(shape("inline")).toEqual({ tabs: 0, list: "OL", visibleDetail: false, wraps: true })
  })

  it("stacks the chain with arrows pointing down until there is room for one row, so no arrow points at empty space", () => {
    const { container } = render(<Sample variant="chain" />)
    expect(container.firstElementChild?.classList.contains("@container")).toBe(true)
    const list = container.querySelector("[data-slot='flow-list']") as HTMLElement
    expect(list.className).toContain("@3xl:flex-row")
    expect(list.className).not.toContain("flex-wrap")
    const connector = container.querySelector("[data-slot='flow-arrow']") as HTMLElement
    expect(connector.querySelector(".lucide-arrow-down")?.getAttribute("class")).toContain("@3xl:hidden")
    expect(connector.querySelector(".lucide-arrow-right")?.getAttribute("class")).toContain("@3xl:block")
  })

  it("reads the inline flow as step, condition, chevron, next step", () => {
    const { container } = render(<Sample variant="inline" />)
    const first = container.querySelector("[data-slot='flow-step']") as HTMLElement
    const label = first.querySelector("[data-slot='flow-arrow-label']") as HTMLElement
    const chevron = first.querySelector("[data-slot='flow-arrow']") as Element
    expect(label.compareDocumentPosition(chevron) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText("Draft").className).toContain("text-foreground")
  })

  it("drops the walkthrough connectors on a narrow container, where they would dangle at the end of a wrapped row", () => {
    const { container } = render(<Sample />)
    expect(container.querySelector("[data-slot='flow-arrow']")?.getAttribute("class")).toContain("@max-sm:hidden")
  })

  it("walks through with a click and with the arrow keys, showing only the chosen panel", async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()
    render(<Sample onActiveChange={onActiveChange} />)
    expect(screen.getByRole("tablist", { name: "Publishing" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Draft" })).toHaveAttribute("aria-selected", "true")
    await user.click(screen.getByRole("tab", { name: "Review" }))
    expect(onActiveChange).toHaveBeenLastCalledWith(1)
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Publish" })).toHaveFocus()
    expect(onActiveChange).toHaveBeenLastCalledWith(2)
    const panels = screen.getAllByRole("tabpanel", { hidden: true })
    expect(panels.map((panel) => panel.getAttribute("data-state"))).toEqual(["inactive", "inactive", "active"])
    expect(panels[2]).toHaveAttribute("tabindex", "0")
    expect(panels[0]).toHaveAttribute("tabindex", "-1")
  })

  it("follows a controlled step and keeps it in range", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Sample active={9} />)
    expect(screen.getByRole("tab", { name: "Publish" })).toHaveAttribute("aria-selected", "true")
    rerender(<Sample active={0} />)
    await user.click(screen.getByRole("tab", { name: "Review" }))
    expect(screen.getByRole("tab", { name: "Draft" })).toHaveAttribute("aria-selected", "true")
  })

  it("has one sliding marker with the spring effect, and a plain one without motion", async () => {
    const user = userEvent.setup()
    const { container, unmount } = render(<Sample effect="spring" />)
    expect(container.querySelectorAll("[data-slot='flow-marker']")).toHaveLength(1)
    await user.click(screen.getByRole("tab", { name: "Publish" }))
    expect(screen.getByRole("tab", { name: "Publish" }).querySelector("[data-slot='flow-marker']")).not.toBeNull()
    unmount()
    setReducedMotion(true)
    const reduced = render(<Sample effect="spring" />)
    expect(reduced.container.querySelector("[data-slot='flow-marker']")).toBeNull()
    expect(screen.getByRole("tab", { name: "Draft" }).className).toContain("data-[state=active]:bg-muted")
  })

  it("starts hidden with the sequence effect, and shows at once under reduced motion", () => {
    const { container, unmount } = render(<Sample variant="rail" effect="sequence" />)
    expect((container.querySelector("[data-slot='flow-step']") as HTMLElement).style.opacity).toBe("0")
    unmount()
    setReducedMotion(true)
    const reduced = render(<Sample variant="rail" effect="sequence" />)
    expect((reduced.container.querySelector("[data-slot='flow-step']") as HTMLElement).style.opacity).toBe("")
  })

  it("shows a caption and survives having no steps", () => {
    const { unmount } = render(<Sample caption="Most posts take a day" />)
    expect(screen.getByText("Most posts take a day").tagName).toBe("FIGCAPTION")
    unmount()
    expect(() => render(<Flow label="Empty" steps={[]} />)).not.toThrow()
  })
})
