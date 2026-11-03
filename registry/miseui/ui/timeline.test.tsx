import { act } from "react"
import { render, screen, within } from "@testing-library/react"
import { Timeline, type TimelineEvent, type TimelineVariant } from "./timeline"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []
const observed: { callback: IntersectionObserverCallback; elements: Element[] }[] = []

class IntersectionObserverStub {
  elements: Element[] = []
  constructor(callback: IntersectionObserverCallback) {
    observed.push({ callback, elements: this.elements })
  }
  observe = (element: Element) => {
    this.elements.push(element)
  }
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub)
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
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

afterEach(() => {
  observed.length = 0
  setReducedMotion(false)
})

const EVENTS: readonly TimelineEvent[] = [
  { time: "2 Nov, 14:02", dateTime: "2026-11-02T14:02", title: "Order placed", body: "Three items", status: "success" },
  { time: "2 Nov, 18:40", title: "Payment held", status: "warning" },
  { time: "3 Nov, 09:12", title: "Delivery failed", status: "error" },
  { time: "3 Nov, 11:00", title: "Courier on the way", status: "current" },
  { time: "Tomorrow", title: "Expected delivery" },
]

const VARIANTS: readonly TimelineVariant[] = ["vertical", "alternate", "compact", "horizontal"]

function marker(title: string) {
  return screen.getByText(title).closest("li")?.querySelector("[data-slot='timeline-marker']")
}

describe("Timeline semantics", () => {
  it.each(VARIANTS)("%s is an ordered list in the given order", (variant) => {
    render(<Timeline events={EVENTS} variant={variant} aria-label="Order history" />)
    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items).toHaveLength(EVENTS.length)
    expect(screen.getByRole("list").tagName).toBe("OL")
    expect(items[0]).toHaveTextContent("Order placed")
    expect(items[4]).toHaveTextContent("Expected delivery")
  })

  it("puts a machine-readable moment on the time element", () => {
    render(<Timeline events={EVENTS} />)
    expect(screen.getByText("2 Nov, 14:02").tagName).toBe("TIME")
    expect(screen.getByText("2 Nov, 14:02")).toHaveAttribute("datetime", "2026-11-02T14:02")
  })

  it("speaks the status, and lets the words be replaced", () => {
    render(<Timeline events={EVENTS} labels={{ error: "Not delivered" }} />)
    expect(screen.getByText("Done:")).toHaveClass("sr-only")
    expect(screen.getByText("Not delivered:")).toHaveClass("sr-only")
    expect(screen.queryByText("Failed:")).toBeNull()
  })
})

describe("Timeline status colours", () => {
  it("uses fixed hues for meaning and the accent only for now", () => {
    render(<Timeline events={EVENTS} />)
    expect(marker("Order placed")?.className).toContain("emerald")
    expect(marker("Payment held")?.className).toContain("amber")
    expect(marker("Delivery failed")).toHaveClass("bg-destructive", "dark:text-background")
    expect(marker("Courier on the way")).toHaveClass("bg-mise")
    for (const title of ["Order placed", "Payment held", "Delivery failed"]) {
      expect(marker(title)?.className).not.toContain("mise")
    }
  })

  it("marks a neutral event with a ring, not a colour", () => {
    render(<Timeline events={EVENTS} />)
    expect(marker("Expected delivery")).toHaveClass("border-2")
    expect(marker("Expected delivery")).toHaveAttribute("data-status", "neutral")
  })

  it("writes the status out on compact, where a dot alone would rely on colour", () => {
    render(<Timeline events={EVENTS} variant="compact" />)
    expect(screen.getByText("Failed")).not.toHaveClass("sr-only")
    expect(screen.getByText("Failed")).toHaveClass("text-destructive")
  })

  it("lets a custom icon replace the status mark", () => {
    render(<Timeline events={[{ time: "Now", title: "Moved", status: "success", icon: <svg data-testid="truck" /> }]} />)
    expect(screen.getByTestId("truck")).toBeInTheDocument()
    expect(screen.getByText("Done:")).toBeInTheDocument()
  })
})

describe("Timeline variants", () => {
  it("draws a connector between events and none after the last", () => {
    const { container } = render(<Timeline events={EVENTS} />)
    expect(container.querySelectorAll("[data-slot='timeline-connector']")).toHaveLength(EVENTS.length - 1)
    const items = screen.getAllByRole("listitem")
    expect(items[4].querySelector("[data-slot='timeline-connector']")).toBeNull()
  })

  it("alternate switches sides by container query and starts in one column", () => {
    const { container } = render(<Timeline events={EVENTS} variant="alternate" />)
    expect(container.firstElementChild).toHaveClass("@container")
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveClass("grid-cols-[1.5rem_minmax(0,1fr)]", "@lg:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]")
    expect(items[0]).toHaveAttribute("data-side", "right")
    expect(items[1]).toHaveAttribute("data-side", "left")
  })

  it("compact keeps to one line and leaves the body out", () => {
    render(<Timeline events={EVENTS} variant="compact" />)
    expect(screen.queryByText("Three items")).toBeNull()
    expect(screen.getAllByRole("listitem")[0]).toHaveClass("grid-cols-[1rem_minmax(0,1fr)_auto]")
  })

  it("horizontal scrolls inside itself, can be reached by keyboard and is not rounded", () => {
    const { container } = render(<Timeline events={EVENTS} variant="horizontal" aria-label="Order history" />)
    const scroller = screen.getByRole("region", { name: "Order history" })
    expect(scroller).toHaveAttribute("tabindex", "0")
    expect(scroller).toHaveClass("overflow-x-auto")
    expect(scroller.className).not.toContain("rounded")
    expect(container.firstElementChild).toHaveClass("grid-cols-[minmax(0,1fr)]")
  })
})

describe("Timeline draw effect", () => {
  it("draws a stretch once it enters the view, and only then", () => {
    const { container } = render(<Timeline events={EVENTS.slice(0, 2)} effect="draw" />)
    expect(container.firstElementChild).toHaveAttribute("data-effect", "draw")
    const connector = container.querySelector("[data-slot='timeline-connector']")
    expect(connector).toHaveAttribute("data-drawn", "false")
    const observer = observed.find((entry) => entry.elements.includes(connector as Element))
    act(() => {
      observer?.callback([{ target: connector, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    expect(connector).toHaveAttribute("data-drawn", "true")
  })

  it("shows the finished line at once when motion is reduced", () => {
    setReducedMotion(true)
    const { container } = render(<Timeline events={EVENTS} effect="draw" />)
    const connector = container.querySelector("[data-slot='timeline-connector']")
    expect(connector).not.toHaveAttribute("data-drawn")
    expect(connector).toHaveClass("bg-border")
    expect(observed).toHaveLength(0)
  })

  it("watches nothing without the effect", () => {
    render(<Timeline events={EVENTS} />)
    expect(observed).toHaveLength(0)
  })
})
