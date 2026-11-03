import { act, fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { DotBackground, halftoneBuckets } from "./dot-background"

type Resize = (entries: { contentRect: { width: number; height: number } }[]) => void

const observers = vi.hoisted(() => ({ callbacks: [] as unknown[], disconnects: 0 }))

class ResizeObserverStub {
  private readonly callback: Resize
  constructor(callback: Resize) {
    this.callback = callback
    observers.callbacks = [...observers.callbacks, callback]
  }
  observe() {
    this.callback([{ contentRect: { width: 320, height: 200 } }])
  }
  unobserve() {}
  disconnect() {
    observers.disconnects += 1
  }
}

beforeEach(() => {
  observers.callbacks = []
  observers.disconnects = 0
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const root = () => document.querySelector("[data-slot='dot-background']") as HTMLElement
const layer = () => document.querySelector("[data-slot='dot-background-layer']") as HTMLElement
const marks = () => document.querySelector("[data-slot='dot-background-marks']") as HTMLElement
const halftone = () => document.querySelector("[data-slot='dot-background-halftone']")

const dotsIn = (path: string) => path.split("M").filter(Boolean).map((segment) => segment.replace("h0", "").split(" ").map(Number) as [number, number])

describe("halftoneBuckets", () => {
  it("returns nothing for a box with no size", () => {
    expect(halftoneBuckets(0, 200)).toEqual([])
    expect(halftoneBuckets(320, 0)).toEqual([])
  })

  it("grows the dots toward the top right corner", () => {
    const buckets = halftoneBuckets(320, 200)
    const largest = buckets.reduce((a, b) => (b.radius > a.radius ? b : a))
    const smallest = buckets.reduce((a, b) => (b.radius < a.radius ? b : a))
    const distance = ([x, y]: [number, number]) => Math.hypot(320 - x, y)
    const closestLarge = Math.min(...dotsIn(largest.path).map(distance))
    const closestSmall = Math.min(...dotsIn(smallest.path).map(distance))
    expect(closestLarge).toBeLessThan(closestSmall)
    expect(largest.radius).toBeGreaterThan(smallest.radius * 3)
  })

  it("ends before the far corner, so the pattern fades inside the box", () => {
    const all = halftoneBuckets(320, 200).flatMap((bucket) => dotsIn(bucket.path))
    const reach = Math.hypot(320, 200) * 0.85
    expect(all.every(([x, y]) => Math.hypot(320 - x, y) < reach)).toBe(true)
    expect(all.some(([x, y]) => x < 12 && y > 180)).toBe(false)
  })

  it("keeps a ceiling on the number of dots for a huge box", () => {
    const count = (width: number, height: number) => halftoneBuckets(width, height).reduce((sum, bucket) => sum + dotsIn(bucket.path).length, 0)
    expect(count(5120, 2880)).toBeLessThan(9000)
  })

  it("gives the same result for the same box", () => {
    expect(halftoneBuckets(263, 200)).toEqual(halftoneBuckets(263, 200))
  })
})

describe("DotBackground", () => {
  it("draws one hidden layer behind and keeps the content outside it", () => {
    render(
      <DotBackground className="h-48">
        <button type="button">Invite</button>
      </DotBackground>,
    )
    expect(root()).toHaveClass("relative", "isolate", "overflow-clip", "h-48")
    expect(layer()).toHaveAttribute("aria-hidden", "true")
    expect(layer()).toHaveClass("pointer-events-none")
    expect(layer().contains(screen.getByRole("button", { name: "Invite" }))).toBe(false)
  })

  it("draws a different structure for each variant", () => {
    const { rerender } = render(<DotBackground variant="dots" />)
    expect(renderToString(<DotBackground variant="dots" />)).toContain("background-image:radial-gradient(circle,var(--mise-dot)")
    expect(marks().style.maskImage).toBeFalsy()

    rerender(<DotBackground variant="fade" />)
    expect(marks().style.maskImage).toContain("closest-side")

    rerender(<DotBackground variant="plus" />)
    expect(marks().style.maskImage).toContain("data:image/svg+xml")
    expect(marks().style.backgroundImage).toBe("")

    rerender(<DotBackground variant="halftone" />)
    expect(marks()).toBeNull()
    expect(halftone()?.querySelectorAll("path").length).toBeGreaterThan(3)
  })

  it("only measures for halftone, and stops measuring on unmount", () => {
    const { unmount, rerender } = render(<DotBackground variant="dots" />)
    expect(observers.callbacks).toHaveLength(0)
    rerender(<DotBackground variant="halftone" />)
    expect(observers.callbacks).toHaveLength(1)
    unmount()
    expect(observers.disconnects).toBe(1)
  })

  it("redraws halftone when the box changes size", () => {
    render(<DotBackground variant="halftone" />)
    const before = halftone()?.querySelector("path")?.getAttribute("d")
    act(() => (observers.callbacks[0] as Resize)([{ contentRect: { width: 640, height: 400 } }]))
    expect(halftone()?.querySelector("path")?.getAttribute("d")).not.toBe(before)
  })

  it("server renders halftone without dots and without measuring", () => {
    const html = renderToString(<DotBackground variant="halftone" />)
    expect(html).toContain("dot-background-halftone")
    expect(html).not.toContain("<path")
  })

  it("colours a second copy around a mouse, stays off for a finger", () => {
    render(<DotBackground effect="pointer" />)
    const bright = document.querySelector("[data-slot='background-pointer-layer']") as HTMLElement
    expect(bright).toHaveClass("[--mise-dot:var(--mise)]", "opacity-0")
    expect(bright.querySelector("[data-slot='dot-background-marks']")).not.toBeNull()

    fireEvent.pointerMove(root(), { pointerType: "touch", clientX: 4, clientY: 4 })
    expect(root()).not.toHaveAttribute("data-lit")

    fireEvent.pointerMove(root(), { pointerType: "mouse", clientX: 4, clientY: 4 })
    expect(root()).toHaveAttribute("data-lit", "true")
    expect(bright).toHaveClass("opacity-100")

    fireEvent.pointerLeave(root(), { pointerType: "mouse" })
    expect(root()).not.toHaveAttribute("data-lit")
  })

  it("has no pointer layer unless asked", () => {
    render(<DotBackground />)
    expect(document.querySelector("[data-slot='background-pointer-layer']")).toBeNull()
  })

  it("steps aside for forced colours and high contrast", () => {
    render(<DotBackground />)
    expect(layer()).toHaveClass("forced-colors:hidden", "contrast-more:hidden")
  })
})
