import { act, render, screen, waitFor } from "@testing-library/react"
import { Stat, type StatVariant } from "./stat"
import { changeDirection, changeTone, decimalsOf, formatChange, sparklineArea, sparklinePath, sparklinePoints } from "./stat-math"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
let observerCallback: IntersectionObserverCallback | null = null
const changeListeners: Array<() => void> = []

class IntersectionObserverStub {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
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

const seen = () =>
  act(() => observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))

describe("stat maths", () => {
  it("reads direction and only colours it when told which way is good", () => {
    expect(changeDirection(4)).toBe("up")
    expect(changeDirection(-4)).toBe("down")
    expect(changeDirection(0)).toBe("flat")
    expect(changeDirection(Number.NaN)).toBe("flat")
    expect(changeTone("up", "up-is-good")).toBe("good")
    expect(changeTone("up", "down-is-good")).toBe("bad")
    expect(changeTone("down", "down-is-good")).toBe("good")
    expect(changeTone("up", "neutral")).toBe("neutral")
    expect(changeTone("flat", "up-is-good")).toBe("neutral")
  })

  it("formats a change with a real sign", () => {
    expect(formatChange(12.4, "%", "en-US")).toBe("+12.4%")
    expect(formatChange(-3, "%", "en-US")).toBe("−3%")
    expect(formatChange(0, " pts", "en-US")).toBe("0 pts")
  })

  it("counts decimals of the final figure", () => {
    expect(decimalsOf(1200)).toBe(0)
    expect(decimalsOf(3.4)).toBe(1)
    expect(decimalsOf(0.125)).toBe(3)
  })

  it("draws lines from the data and survives flat, single and bad samples", () => {
    expect(sparklinePoints([0, 10], 100, 32)).toEqual([
      { x: 0, y: 30 },
      { x: 100, y: 2 },
    ])
    expect(sparklinePoints([5, 5, 5], 100, 32).every((point) => point.y === 16)).toBe(true)
    expect(sparklinePoints([1, Number.NaN, 3], 100, 32)).toHaveLength(2)
    expect(sparklinePath([], 100, 32)).toBe("")
    expect(sparklinePath([7], 100, 32)).toBe("M0 16 L100 16")
    expect(sparklineArea([1, 2], 100, 32)).toMatch(/L100 32 L0 32 Z$/)
    expect(sparklineArea([], 100, 32)).toBe("")
  })
})

describe("Stat", () => {
  it("names the group by its label and formats the number", () => {
    render(<Stat label="Revenue" value={48200} locale="en-US" />)
    const group = screen.getByRole("group", { name: "Revenue" })
    expect(group).toHaveTextContent("48,200")
    expect(group.querySelector("[data-slot='stat-value']")?.className).toContain("tabular-nums")
  })

  it("shows a string value untouched", () => {
    render(<Stat label="Median reply" value="4m 12s" effect="count-up" />)
    expect(screen.getByRole("group", { name: "Median reply" })).toHaveTextContent("4m 12s")
  })

  it("keeps the change grey unless polarity says which way is good", () => {
    const tone = (props: Partial<React.ComponentProps<typeof Stat>>) => {
      const { unmount, container } = render(<Stat label="Tickets" value={12} change={8} {...props} />)
      const value = container.querySelector("[data-slot='stat-change']")?.getAttribute("data-tone")
      unmount()
      return value
    }
    expect(tone({})).toBe("neutral")
    expect(tone({ polarity: "up-is-good" })).toBe("good")
    expect(tone({ polarity: "down-is-good" })).toBe("bad")
  })

  it("says the direction in words as well as colour", () => {
    render(<Stat label="Churn" value={2} change={-1.5} polarity="down-is-good" locale="en-US" />)
    expect(screen.getByText("Down 1.5%")).toHaveClass("sr-only")
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: StatVariant) => {
      const { container, unmount } = render(<Stat label="Revenue" value={100} change={1} trend={[1, 2, 3]} variant={variant} />)
      const root = container.firstElementChild as HTMLElement
      const spark = root.querySelector("[data-slot='stat-sparkline']") as SVGElement
      const result = {
        surface: root.className.includes("border bg-card"),
        tag: root.className.includes("inline-flex"),
        tableRow: root.className.includes("grid-cols-"),
        filled: spark.querySelectorAll("path").length === 2,
      }
      unmount()
      return result
    }
    expect(shape("plain")).toEqual({ surface: false, tag: false, tableRow: false, filled: false })
    expect(shape("card")).toEqual({ surface: true, tag: false, tableRow: false, filled: true })
    expect(shape("compact")).toEqual({ surface: false, tag: false, tableRow: true, filled: false })
    expect(shape("inline")).toEqual({ surface: false, tag: true, tableRow: false, filled: false })
  })

  it("describes the trend only through trendLabel and hides the drawing", () => {
    const { container } = render(<Stat label="Visits" value={10} trend={[1, 3]} trendLabel="Rising over 7 days" />)
    expect(screen.getByText("Rising over 7 days")).toHaveClass("sr-only")
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("counts up once on view, with the final figure holding the width", async () => {
    const { container, rerender } = render(<Stat label="Orders" value={2400} effect="count-up" locale="en-US" />)
    const shown = () => container.querySelector("[data-slot='stat-count-value']")?.textContent
    expect(shown()).toBe("0")
    expect(container.querySelector("[data-slot='stat-count'] .invisible")).toHaveTextContent("2,400")
    expect(screen.getByText("2,400", { selector: ".sr-only" })).toBeInTheDocument()
    seen()
    await waitFor(() => expect(shown()).toBe("2,400"), { timeout: 3000 })
    rerender(<Stat label="Orders" value={2500} effect="count-up" locale="en-US" />)
    await waitFor(() => expect(shown()).toBe("2,500"))
  })

  it("skips the count under reduced motion", () => {
    setReducedMotion(true)
    const { container } = render(<Stat label="Orders" value={2400} effect="count-up" locale="en-US" />)
    expect(container.querySelector("[data-slot='stat-count-value']")?.textContent).toBe("2,400")
  })
})
