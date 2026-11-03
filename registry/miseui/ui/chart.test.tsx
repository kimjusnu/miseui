import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Chart, type ChartDatum, type ChartProps, type ChartVariant } from "./chart"
import { angleAt, arcPath, areaPath, axisLabelWidth, barPath, donutSlices, labelStride, linePath, nearestIndex, niceStep, niceTicks, sliceAtAngle } from "./chart-math"
import { chartKeyStep } from "./chart-state"

const resizeCallbacks: ResizeObserverCallback[] = []
const seenCallbacks: IntersectionObserverCallback[] = []

class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeCallbacks.push(callback)
  }
  observe = () => this.fire(400)
  unobserve = vi.fn()
  disconnect = vi.fn()
  fire(width: number) {
    this.callback([{ contentRect: { width } } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}

class IntersectionObserverStub {
  constructor(callback: IntersectionObserverCallback) {
    seenCallbacks.push(callback)
  }
  observe = vi.fn()
  disconnect = vi.fn()
}

/** motion reads matchMedia once per module and afterwards only listens for "change". */
let reducedMotion = false
const changeListeners: Array<() => void> = []
const originalMatchMedia = window.matchMedia
const setReducedMotion = (value: boolean) => {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
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
    })),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

const DATA: readonly ChartDatum[] = [
  { month: "Jan", visits: 120, signups: 12 },
  { month: "Feb", visits: 180, signups: 20 },
  { month: "Mar", visits: 90, signups: 8 },
]
const SERIES = [{ key: "visits", label: "Visits" }]
const TWO = [...SERIES, { key: "signups", label: "Signups" }]

const renderChart = (props: Partial<ChartProps> = {}) => render(<Chart label="Traffic" data={DATA} index="month" series={SERIES} {...props} />)
const plot = () => screen.getByRole("group", { name: "Traffic" })
const slots = (name: string) => document.querySelectorAll(`[data-slot='${name}']`)

describe("chart maths", () => {
  it("axisLabelWidth counts a wide character for what it takes, so a compact Korean tick is not clipped", () => {
    expect(axisLabelWidth("2K")).toBe(16)
    expect(axisLabelWidth("1.5천")).toBe(37)
    expect(axisLabelWidth("")).toBe(0)
  })

  it("niceStep lands on 1, 2, 2.5, 5 or 10 times a power of ten", () => {
    expect(niceStep(100, 4)).toBe(25)
    expect(niceStep(90, 4)).toBe(25)
    expect(niceStep(7, 4)).toBe(2)
    expect(niceStep(0.3, 3)).toBeCloseTo(0.1)
    expect(niceStep(1200, 3)).toBe(500)
  })

  it("niceTicks covers the data, includes zero when asked and has no float dust", () => {
    expect(niceTicks([180, 90], 4)).toEqual({ ticks: [0, 50, 100, 150, 200], min: 0, max: 200, step: 50 })
    expect(niceTicks([980, 1010], 3, false).ticks).toEqual([980, 990, 1000, 1010])
    expect(niceTicks([0.1, 0.3], 3).ticks).toEqual([0, 0.1, 0.2, 0.3])
    expect(niceTicks([-40, 60], 4).ticks[0]).toBe(-50)
  })

  it("niceTicks survives flat, empty and broken input", () => {
    expect(niceTicks([], 4).ticks).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(niceTicks([Number.NaN, Number.POSITIVE_INFINITY], 4).max).toBe(1)
    const flat = niceTicks([50, 50], 4, false)
    expect(flat.min).toBeLessThan(50)
    expect(flat.max).toBeGreaterThan(50)
  })

  it("linePath breaks at a missing value and draws a lone point as a dot", () => {
    const a = { x: 0, y: 0 }
    const b = { x: 10, y: 5 }
    expect(linePath([a, b])).toBe("M0 0L10 5")
    expect(linePath([a, null, b])).toBe("M0 0h0M10 5h0")
  })

  it("areaPath closes each run on the baseline and skips lone points", () => {
    expect(areaPath([{ x: 0, y: 2 }, { x: 4, y: 3 }], 10)).toBe("M0 10L0 2L4 3L4 10Z")
    expect(areaPath([{ x: 0, y: 2 }, null], 10)).toBe("")
  })

  it("barPath rounds the far end only and returns nothing for a zero bar", () => {
    expect(barPath(0, 10, 10, 10, 4)).toBe("")
    const up = barPath(0, 0, 10, 20, 4)
    expect(up.startsWith("M0 20")).toBe(true)
    expect(up).toContain("Q0 0 4 0")
    const down = barPath(0, 20, 10, 0, 4)
    expect(down.startsWith("M0 0")).toBe(true)
    expect(down).toContain("Q0 20 4 20")
  })

  it("donutSlices drops empty parts, keeps data indexes and adds up to a whole", () => {
    const slices = donutSlices([30, 0, null, 70], 0)
    expect(slices.map((slice) => slice.index)).toEqual([0, 3])
    expect(slices[0].share).toBeCloseTo(0.3)
    expect(slices[1].end).toBeCloseTo(Math.PI * 2)
    expect(donutSlices([0, null])).toEqual([])
  })

  it("arcPath draws a whole circle in two halves, because an arc whose ends meet draws nothing", () => {
    expect(arcPath(0, 0, 10, 0, Math.PI * 2).match(/A/g)).toHaveLength(2)
    expect(arcPath(0, 0, 10, 0, 1).match(/A/g)).toHaveLength(1)
  })

  it("angles run clockwise from twelve o'clock and every angle finds a slice", () => {
    expect(angleAt(0, -1, 0, 0)).toBeCloseTo(0)
    expect(angleAt(1, 0, 0, 0)).toBeCloseTo(Math.PI / 2)
    expect(angleAt(-1, 0, 0, 0)).toBeCloseTo(Math.PI * 1.5)
    const slices = donutSlices([1, 1])
    expect(sliceAtAngle(slices, 0)).toBe(0)
    expect(sliceAtAngle(slices, Math.PI + 0.5)).toBe(1)
    expect(sliceAtAngle(slices, Math.PI * 2)).toBe(0)
  })

  it("nearestIndex and labelStride", () => {
    expect(nearestIndex([0, 10, 20], 14)).toBe(1)
    expect(nearestIndex([], 14)).toBeNull()
    expect(labelStride(12, 600, 3)).toBe(1)
    expect(labelStride(12, 120, 3)).toBeGreaterThan(1)
  })

  it("chartKeyStep clamps at the ends and ignores other keys", () => {
    expect(chartKeyStep("ArrowRight", 2, 3)).toBe(2)
    expect(chartKeyStep("ArrowLeft", 0, 3)).toBe(0)
    expect(chartKeyStep("End", 0, 3)).toBe(2)
    expect(chartKeyStep("Escape", 1, 3)).toBeNull()
    expect(chartKeyStep("a", 1, 3)).toBeUndefined()
  })
})

describe("Chart", () => {
  it("each variant draws different marks from one data shape", () => {
    const counts = (variant: ChartVariant) => {
      const { unmount } = renderChart({ variant })
      const result = { bar: slots("chart-bar").length, line: slots("chart-line").length, area: slots("chart-area").length, slice: slots("chart-slice").length }
      expect(slots("chart")[0]).toHaveAttribute("data-variant", variant)
      unmount()
      return result
    }
    expect(counts("bar")).toEqual({ bar: 3, line: 0, area: 0, slice: 0 })
    expect(counts("line")).toEqual({ bar: 0, line: 1, area: 0, slice: 0 })
    expect(counts("area")).toEqual({ bar: 0, line: 1, area: 1, slice: 0 })
    expect(counts("donut")).toEqual({ bar: 0, line: 0, area: 0, slice: 3 })
  })

  it("keeps a real table for assistive tech, with the missing value spelled out", () => {
    renderChart({ data: [...DATA, { month: "Apr", visits: null }] })
    const table = screen.getByRole("table", { name: "Traffic" })
    expect(within(table).getByRole("rowheader", { name: "Feb" })).toBeInTheDocument()
    expect(within(table).getByRole("columnheader", { name: "Visits" })).toBeInTheDocument()
    expect(within(table).getByText("No data")).toBeInTheDocument()
    expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("focus opens the tooltip, arrows walk the points and the live region speaks them", async () => {
    const user = userEvent.setup()
    renderChart()
    await user.tab()
    expect(plot()).toHaveFocus()
    expect(slots("chart-tooltip")[0]).toHaveTextContent("Jan")
    await user.keyboard("{ArrowRight}")
    expect(slots("chart-tooltip")[0]).toHaveTextContent("Feb")
    expect(slots("chart-live")[0]).toHaveTextContent("Feb: Visits 180")
    await user.keyboard("{End}")
    expect(slots("chart-tooltip")[0]).toHaveTextContent("Mar")
    await user.keyboard("{Escape}")
    expect(slots("chart-tooltip")).toHaveLength(0)
  })

  it("hover shows the nearest point without speaking, and leaving hides it", () => {
    renderChart()
    fireEvent.pointerMove(plot(), { clientX: 390, clientY: 40, pointerType: "mouse" })
    expect(slots("chart-tooltip")[0]).toHaveTextContent("Mar")
    expect(slots("chart-live")[0]).toHaveTextContent("")
    fireEvent.pointerLeave(plot(), { pointerType: "mouse" })
    expect(slots("chart-tooltip")).toHaveLength(0)
  })

  it("a tooltip opens away from the near side, so it stays inside", () => {
    renderChart()
    fireEvent.pointerMove(plot(), { clientX: 10, clientY: 40, pointerType: "mouse" })
    expect(slots("chart-tooltip")[0]).toHaveAttribute("data-side", "right")
    fireEvent.pointerMove(plot(), { clientX: 390, clientY: 40, pointerType: "mouse" })
    expect(slots("chart-tooltip")[0]).toHaveAttribute("data-side", "left")
  })

  it("a second series gets a legend, and the tooltip lists both", async () => {
    const user = userEvent.setup()
    renderChart({ series: TWO, variant: "line" })
    expect(slots("chart-legend")[0]).toHaveTextContent("Signups")
    expect(slots("chart-line")).toHaveLength(2)
    await user.tab()
    expect(slots("chart-tooltip")[0]).toHaveTextContent("Signups")
  })

  it("donut skips zero slices by keyboard, totals the rest and lists them", async () => {
    const user = userEvent.setup()
    const data = [
      { kind: "Card", amount: 60 },
      { kind: "Cash", amount: 0 },
      { kind: "Transfer", amount: 40 },
    ]
    render(<Chart label="Payments" variant="donut" data={data} index="kind" series={[{ key: "amount", label: "Paid" }]} />)
    expect(slots("chart-total")[0]).toHaveTextContent("100")
    expect(slots("chart-slice")).toHaveLength(2)
    await user.tab()
    expect(slots("chart-tooltip")[0]).toHaveTextContent("Card")
    await user.keyboard("{ArrowRight}")
    expect(slots("chart-tooltip")[0]).toHaveTextContent("Transfer")
    expect(slots("chart-tooltip")[0]).toHaveTextContent("40%")
  })

  it("redraws at the new width, so axis text stays one size", () => {
    renderChart()
    expect(document.querySelector("svg")).toHaveAttribute("viewBox", "0 0 400 200")
    act(() => resizeCallbacks.at(-1)?.([{ contentRect: { width: 263 } } as ResizeObserverEntry], {} as ResizeObserver))
    expect(document.querySelector("svg")).toHaveAttribute("viewBox", "0 0 263 200")
  })

  it("an empty chart says so and takes no focus", () => {
    renderChart({ data: [], emptyText: "Nothing yet" })
    expect(screen.getByText("Nothing yet")).toBeInTheDocument()
    expect(plot()).not.toHaveAttribute("tabindex")
    expect(document.querySelector("svg")).toBeNull()
  })

  it("draw waits for the chart to be seen", () => {
    seenCallbacks.length = 0
    renderChart({ effect: "draw" })
    expect(slots("chart")[0]).toHaveAttribute("data-effect", "draw")
    expect(seenCallbacks).toHaveLength(1)
    act(() => seenCallbacks[0]([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
    expect(slots("chart-bar")).toHaveLength(3)
  })

  it("draw watches nothing under reduced motion and shows the marks at once", () => {
    renderChart()
    setReducedMotion(true)
    seenCallbacks.length = 0
    renderChart({ effect: "draw", label: "Second" })
    expect(seenCallbacks).toHaveLength(0)
    expect(slots("chart-bar").length).toBeGreaterThan(0)
    setReducedMotion(false)
  })
})
