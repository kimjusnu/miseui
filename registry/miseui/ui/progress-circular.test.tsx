import { render, screen } from "@testing-library/react"
import { act } from "react"
import { ProgressCircular, type ProgressCircularVariant } from "./progress-circular"
import { arcDash, circumferenceOf, litCells, toPercent } from "./progress-circular-math"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
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
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly ProgressCircularVariant[] = ["ring", "thin", "gauge", "segmented"]
const bar = () => screen.getByRole("progressbar")

describe("helpers", () => {
  it("toPercent clamps out-of-range values and sends unknowns to null", () => {
    expect(toPercent(50, 200)).toBe(25)
    expect(toPercent(-5, 100)).toBe(0)
    expect(toPercent(500, 100)).toBe(100)
    expect(toPercent(null, 100)).toBeNull()
    expect(toPercent(undefined, 100)).toBeNull()
    expect(toPercent(Number.NaN, 100)).toBeNull()
    expect(toPercent(10, 0)).toBeNull()
  })

  it("arcDash draws a share of the circumference and a gap long enough to never repeat", () => {
    const circumference = circumferenceOf(8)
    expect(arcDash(0.5, circumference)).toBe(`${circumference / 2} ${circumference * 2}`)
    expect(circumference).toBeCloseTo(2 * Math.PI * 46)
  })

  it("litCells shows any work and keeps the last cell for finished work", () => {
    expect(litCells(0, 12)).toBe(0)
    expect(litCells(1, 12)).toBe(1)
    expect(litCells(50, 12)).toBe(6)
    expect(litCells(99.9, 12)).toBe(11)
    expect(litCells(100, 12)).toBe(12)
  })
})

describe("ProgressCircular", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("reports its value to assistive tech", () => {
      render(<ProgressCircular variant={variant} value={30} max={60} label="Upload" />)
      expect(screen.getByRole("progressbar", { name: "Upload" })).toHaveAttribute("data-variant", variant)
      expect(bar()).toHaveAttribute("aria-valuenow", "30")
      expect(bar()).toHaveAttribute("aria-valuemax", "60")
      expect(bar()).toHaveAttribute("aria-valuetext", "50%")
      expect(bar()).toHaveAttribute("data-state", "loading")
    })

    it("drops aria-valuenow and marks the state when the amount is unknown", () => {
      render(<ProgressCircular variant={variant} label="Upload" />)
      expect(bar()).not.toHaveAttribute("aria-valuenow")
      expect(bar()).toHaveAttribute("data-state", "indeterminate")
      expect(bar().querySelector("[data-slot='progress-circular-value']")).toBeNull()
    })
  })

  it("draws a different structure per variant", () => {
    const shape = (variant: ProgressCircularVariant) => {
      const { container, unmount } = render(<ProgressCircular variant={variant} value={50} steps={8} />)
      const fill = container.querySelector("[data-slot='progress-circular-fill']")
      const result = {
        cells: container.querySelectorAll("[data-slot='progress-circular-cell']").length,
        strokeWidth: fill?.getAttribute("stroke-width") ?? null,
        rotate: fill?.getAttribute("transform") ?? null,
      }
      unmount()
      return result
    }
    expect(shape("ring")).toEqual({ cells: 0, strokeWidth: "8", rotate: "rotate(-90 50 50)" })
    expect(shape("thin")).toEqual({ cells: 0, strokeWidth: "2.5", rotate: "rotate(-90 50 50)" })
    expect(shape("gauge")).toEqual({ cells: 0, strokeWidth: "8", rotate: "rotate(135 50 50)" })
    expect(shape("segmented")).toEqual({ cells: 8, strokeWidth: null, rotate: null })
  })

  it("makes the gauge arc 75 percent of the way round at full, not the whole circle", () => {
    const { container } = render(<ProgressCircular variant="gauge" value={100} />)
    const fill = container.querySelector("[data-slot='progress-circular-fill']") as SVGElement
    const circumference = circumferenceOf(8)
    expect(fill.style.strokeDasharray.replace(/px/g, "").replace(/,/g, "")).toBe(`${0.75 * circumference} ${circumference * 2}`)
  })

  it("lights cells by value, and only value", () => {
    const { container, rerender } = render(<ProgressCircular variant="segmented" value={25} steps={4} />)
    const lit = () => container.querySelectorAll("[data-slot='progress-circular-cell'][data-on='true']").length
    expect(lit()).toBe(1)
    rerender(<ProgressCircular variant="segmented" value={100} steps={4} />)
    expect(lit()).toBe(4)
    expect(bar()).toHaveAttribute("data-state", "complete")
  })

  it("writes the rounded percent in the middle, hides it at sm and lets children replace it", () => {
    const { rerender } = render(<ProgressCircular value={33.4} />)
    expect(bar()).toHaveTextContent("33%")
    rerender(<ProgressCircular value={33.4} size="sm" />)
    expect(bar()).not.toHaveTextContent("33")
    rerender(<ProgressCircular value={33.4} size="sm" showValue />)
    expect(bar()).toHaveTextContent("33%")
    rerender(<ProgressCircular value={33.4}>3 of 9</ProgressCircular>)
    expect(bar()).toHaveTextContent("3 of 9")
    expect(bar()).not.toHaveTextContent("33")
  })

  it("writes the label in the open quarter only on a large gauge", () => {
    const { container, rerender } = render(<ProgressCircular variant="gauge" size="lg" value={40} label="Disk" />)
    expect(container.querySelector("[data-slot='progress-circular-label']")).toHaveTextContent("Disk")
    rerender(<ProgressCircular variant="ring" size="lg" value={40} label="Disk" />)
    expect(container.querySelector("[data-slot='progress-circular-label']")).toBeNull()
  })

  it("spins ring and thin but sweeps the gauge, since a full turn would cross its gap", () => {
    const { container, rerender } = render(<ProgressCircular variant="ring" />)
    expect(container.querySelector("[data-slot='progress-circular-spin']")).not.toBeNull()
    rerender(<ProgressCircular variant="gauge" />)
    expect(container.querySelector("[data-slot='progress-circular-spin']")).toBeNull()
    expect(container.querySelector("[data-slot='progress-circular-sweep']")).not.toBeNull()
  })

  it("replaces the spin with a slow pulse under reduced motion", () => {
    setReducedMotion(true)
    const { container } = render(<ProgressCircular variant="ring" />)
    expect(container.querySelector("[data-slot='progress-circular-spin']")).toBeNull()
    expect(container.querySelector("[data-slot='progress-circular-pulse']")).not.toBeNull()
  })

  it("marks the spring effect on the root", () => {
    render(<ProgressCircular value={10} effect="spring" />)
    expect(bar()).toHaveAttribute("data-effect", "spring")
  })
})
