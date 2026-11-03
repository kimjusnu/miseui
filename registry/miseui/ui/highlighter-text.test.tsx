import { act, render, screen, waitFor } from "@testing-library/react"
import { HighlighterGroup, HighlighterText } from "./highlighter-text"
import {
  lineSchedule,
  mergeLineRects,
  sameLines,
  scheduleSeconds,
  seededUnit,
  seedFromText,
  sketchBoxPath,
  sketchStrokePath,
} from "./highlighter-math"

const state = vi.hoisted(() => ({ reduced: false, inView: true }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

const observers = vi.hoisted(() => ({ list: [] as { callback: () => void; observed: Element[]; disconnected: boolean }[] }))

class ResizeObserverStub {
  private readonly record: { callback: () => void; observed: Element[]; disconnected: boolean }
  constructor(callback: () => void) {
    this.record = { callback, observed: [], disconnected: false }
    observers.list.push(this.record)
  }
  observe(element: Element) {
    this.record.observed.push(element)
  }
  disconnect() {
    this.record.disconnected = true
  }
  unobserve() {}
}

const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })
const TWO_LINES = [box(10, 0, 200, 20), box(0, 24, 90, 44)]

let rects = TWO_LINES

beforeEach(() => {
  state.reduced = false
  state.inView = true
  rects = TWO_LINES
  observers.list = []
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Range.prototype.getClientRects = (() => rects) as unknown as Range["getClientRects"]
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(Range.prototype, "getClientRects")
})

const lines = (scope: ParentNode = document) => Array.from(scope.querySelectorAll<HTMLElement>("[data-slot='highlighter-line']"))
const marks = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='highlighter-text']"))

describe("HighlighterText", () => {
  it("keeps the text as a real mark with its colour reset", () => {
    render(<HighlighterText>the part that matters</HighlighterText>)
    const mark = screen.getByText("the part that matters").closest("mark") as HTMLElement
    expect(mark).toHaveClass("bg-transparent", "text-inherit")
    expect(mark).not.toHaveClass("text-mise")
    expect(mark.textContent).toBe("the part that matters")
  })

  it("draws behind the letters in its own stacking context, hidden from assistive tech", () => {
    render(<HighlighterText>words</HighlighterText>)
    expect(marks()[0]).toHaveClass("isolate")
    const anchor = document.querySelector("[data-slot='highlighter-marks']") as HTMLElement
    expect(anchor).toHaveAttribute("aria-hidden", "true")
    expect(anchor).toHaveClass("-z-10", "pointer-events-none", "select-none")
  })

  it("measures one mark per wrapped line, from the anchor", () => {
    render(<HighlighterText>a phrase that wraps</HighlighterText>)
    const [first, second] = lines()
    expect(lines()).toHaveLength(2)
    expect(first.style.left).toBe("8px")
    expect(first.style.width).toBe("194px")
    expect(second.style.left).toBe("-2px")
  })

  it("re-measures on resize and when fonts finish loading", () => {
    const listeners: (() => void)[] = []
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { addEventListener: (_: string, listener: () => void) => listeners.push(listener), removeEventListener: vi.fn() },
    })
    render(
      <p>
        <HighlighterText>a phrase</HighlighterText>
      </p>,
    )
    expect(observers.list[0].observed[0].tagName).toBe("P")
    expect(lines()).toHaveLength(2)

    rects = [box(0, 0, 300, 20)]
    act(() => observers.list[0].callback())
    expect(lines()).toHaveLength(1)

    rects = TWO_LINES
    act(() => listeners[0]())
    expect(lines()).toHaveLength(2)
    Reflect.deleteProperty(document, "fonts")
  })

  it("holds the marks undrawn until seen", async () => {
    state.inView = false
    const { rerender } = render(<HighlighterText>words</HighlighterText>)
    expect(marks()[0]).toHaveAttribute("data-drawn", "false")
    expect(lines()[0].style.transform).toContain("scaleX(0)")
    state.inView = true
    rerender(<HighlighterText>words</HighlighterText>)
    expect(marks()[0]).toHaveAttribute("data-drawn", "true")
    await waitFor(() => expect(lines()[0].style.transform).not.toContain("scaleX(0)"), { timeout: 2000 })
  })

  it("draws at once with the mount trigger, even off screen", () => {
    state.inView = false
    render(<HighlighterText trigger="mount">words</HighlighterText>)
    expect(marks()[0]).toHaveAttribute("data-drawn", "true")
  })

  it("shows the finished mark with nothing moving under reduced motion", () => {
    state.reduced = true
    state.inView = false
    render(<HighlighterText>words</HighlighterText>)
    expect(marks()[0]).toHaveAttribute("data-drawn", "true")
    expect(lines()[0].style.transform).not.toContain("scaleX(0)")
  })

  it("builds a different structure for each variant", () => {
    const shape = (variant: "marker" | "underline" | "sketch" | "box") => {
      const { unmount } = render(<HighlighterText variant={variant}>words</HighlighterText>)
      const line = lines()[0]
      const result = { tag: line.tagName.toLowerCase(), soft: line.classList.contains("bg-mise-soft"), thin: line.classList.contains("h-0.5"), closes: (line.querySelector("path")?.getAttribute("d") ?? "").includes("L") }
      unmount()
      return result
    }
    expect(shape("marker")).toEqual({ tag: "span", soft: true, thin: false, closes: false })
    expect(shape("underline")).toEqual({ tag: "span", soft: false, thin: true, closes: false })
    expect(shape("sketch")).toEqual({ tag: "svg", soft: false, thin: false, closes: false })
    expect(shape("box")).toEqual({ tag: "svg", soft: false, thin: false, closes: true })
  })

  it("gives each line its own hand-drawn stroke, and the same one on every render", () => {
    const paths = () => lines().map((line) => line.querySelector("path")?.getAttribute("d"))
    const { unmount } = render(<HighlighterText variant="sketch">same words</HighlighterText>)
    const first = paths()
    expect(first[0]).not.toBe(first[1])
    unmount()
    render(<HighlighterText variant="sketch">same words</HighlighterText>)
    expect(paths()).toEqual(first)
  })

  it("disconnects its observer on unmount", () => {
    const { unmount } = render(<HighlighterText>words</HighlighterText>)
    unmount()
    expect(observers.list[0].disconnected).toBe(true)
  })
})

describe("HighlighterGroup", () => {
  it("draws the marks one after another, in reading order", async () => {
    vi.useFakeTimers()
    rects = [box(0, 0, 100, 20)]
    render(
      <HighlighterGroup>
        Read <HighlighterText>the first</HighlighterText> and then <HighlighterText>the second</HighlighterText>
      </HighlighterGroup>,
    )
    const drawn = () => marks().map((mark) => mark.getAttribute("data-drawn"))
    expect(drawn()).toEqual(["true", "false"])
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(drawn()).toEqual(["true", "true"])
  })

  it("starts nothing until the group is seen", () => {
    state.inView = false
    render(
      <HighlighterGroup>
        <HighlighterText>the first</HighlighterText>
      </HighlighterGroup>,
    )
    expect(marks()[0]).toHaveAttribute("data-drawn", "false")
  })

  it("draws all at once under reduced motion", () => {
    state.reduced = true
    render(
      <HighlighterGroup>
        <HighlighterText>one</HighlighterText> <HighlighterText>two</HighlighterText>
      </HighlighterGroup>,
    )
    expect(marks().map((mark) => mark.getAttribute("data-drawn"))).toEqual(["true", "true"])
  })

  it("renders the chosen tag and marks the effect", () => {
    render(<HighlighterGroup as="blockquote">Words</HighlighterGroup>)
    const group = document.querySelector("[data-slot='highlighter-group']") as HTMLElement
    expect(group.tagName).toBe("BLOCKQUOTE")
    expect(group).toHaveAttribute("data-effect", "sequence")
  })
})

describe("highlighter-math", () => {
  it("merges fragments on one line and keeps separate lines apart", () => {
    const merged = mergeLineRects([box(10, 0, 50, 20), box(50, 2, 90, 18), box(10, 0, 90, 20), box(0, 24, 40, 44)], { left: 10, top: 0 })
    expect(merged).toEqual([
      { left: 0, top: 0, width: 80, height: 20 },
      { left: -10, top: 24, width: 40, height: 20 },
    ])
  })

  it("drops empty boxes that a line break leaves behind", () => {
    expect(mergeLineRects([box(50, 0, 50, 20), box(0, 24, 40, 44)], { left: 0, top: 0 })).toHaveLength(1)
    expect(mergeLineRects([], { left: 0, top: 0 })).toEqual([])
  })

  it("compares line sets by value", () => {
    const line = { left: 0, top: 0, width: 10, height: 10 }
    expect(sameLines([line], [{ ...line }])).toBe(true)
    expect(sameLines([line], [{ ...line, width: 11 }])).toBe(false)
    expect(sameLines([line], [])).toBe(false)
  })

  it("schedules lines in reading order, with short lines taking less time", () => {
    const line = (width: number) => ({ left: 0, top: 0, width, height: 20 })
    const timings = lineSchedule([line(620), line(100), line(40)])
    expect(timings[0].delay).toBe(0)
    expect(timings[1].delay).toBeGreaterThan(timings[0].delay)
    expect(timings[2].delay).toBeGreaterThan(timings[1].delay)
    expect(timings[0].duration).toBeGreaterThan(timings[1].duration)
    expect(timings[1].duration).toBe(0.28)
    expect(scheduleSeconds(timings)).toBeGreaterThan(timings[2].delay)
    expect(scheduleSeconds([])).toBe(0)
  })

  it("seeds from text with no randomness at render", () => {
    expect(seedFromText("마크")).toBe(seedFromText("마크"))
    expect(seedFromText("a")).not.toBe(seedFromText("b"))
    expect(seededUnit(42, 3)).toBe(seededUnit(42, 3))
    expect(seededUnit(42, 3)).not.toBe(seededUnit(42, 4))
    const spread = Array.from({ length: 200 }, (_, position) => seededUnit(7, position))
    expect(Math.min(...spread)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...spread)).toBeLessThan(1)
    expect(Math.max(...spread) - Math.min(...spread)).toBeGreaterThan(0.8)
  })

  it("draws a stroke across the whole width, with only finite numbers", () => {
    const path = sketchStrokePath(300, 5)
    expect(path.startsWith("M")).toBe(true)
    expect(path.match(/Q/g)).toHaveLength(3)
    const numbers = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
    expect(numbers.every(Number.isFinite)).toBe(true)
    expect(Math.max(...numbers)).toBeGreaterThanOrEqual(298)
    expect(sketchStrokePath(300, 5)).toBe(path)
    expect(sketchStrokePath(300, 6)).not.toBe(path)
    expect(sketchStrokePath(4, 5)).not.toContain("NaN")
  })

  it("draws a box that overruns its own start, and stays valid when tiny", () => {
    const path = sketchBoxPath(120, 24, 5)
    expect(path.startsWith("M")).toBe(true)
    expect(path.match(/Q/g)).toHaveLength(6)
    expect(path.match(/L/g)).toHaveLength(3)
    expect(sketchBoxPath(120, 24, 5)).toBe(path)
    expect(sketchBoxPath(2, 2, 5)).not.toContain("NaN")
  })
})
