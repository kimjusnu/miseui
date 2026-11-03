import { act, render, screen, waitFor } from "@testing-library/react"
import { MotionReveal, staggerDelay } from "./motion-reveal"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

type ObserverCallback = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void

/** The real useInView runs on this, so the test exercises the watching as well as the reveal. */
const observers: Array<{ callback: ObserverCallback; targets: Element[] }> = []

class IntersectionObserverStub {
  private readonly record: { callback: ObserverCallback; targets: Element[] }
  constructor(callback: ObserverCallback) {
    this.record = { callback, targets: [] }
    observers.push(this.record)
  }
  observe(target: Element) {
    this.record.targets.push(target)
  }
  unobserve() {}
  disconnect() {}
}

function intersect(isIntersecting: boolean) {
  act(() => {
    observers.forEach(({ callback, targets }) => callback(targets.map((target) => ({ isIntersecting, target }))))
  })
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  state.reduced = false
  observers.splice(0)
})

const root = () => document.querySelector("[data-slot='motion-reveal']") as HTMLElement
const pieces = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='motion-reveal-piece']"))

describe("MotionReveal", () => {
  it("stays hidden until it comes into view, then shows", async () => {
    render(<MotionReveal variant="fade">Report ready</MotionReveal>)
    expect(root().style.opacity).toBe("0")
    expect(observers[0].targets).toContain(root())
    intersect(true)
    await waitFor(() => expect(Number(root().style.opacity)).toBeGreaterThan(0))
    expect(screen.getByText("Report ready")).toBeInTheDocument()
  })

  it("starts each variant from a different hidden state", () => {
    const { rerender } = render(<MotionReveal key="rise">Text</MotionReveal>)
    expect(root().style.opacity).toBe("0")
    expect(root().style.transform).toContain("translateY(16px)")

    rerender(<MotionReveal key="fade" variant="fade">Text</MotionReveal>)
    expect(root().style.opacity).toBe("0")
    expect(root().style.transform).toBe("")

    rerender(<MotionReveal key="clip" variant="clip">Text</MotionReveal>)
    expect(root().style.opacity).toBe("")
    expect(root().style.transform).toBe("")
    expect(root()).toHaveAttribute("data-variant", "clip")
  })

  it("shows at once with no observer work when motion is off", () => {
    state.reduced = true
    render(
      <MotionReveal as="section" aria-label="Summary" effect="stagger">
        <p>One</p>
        <p>Two</p>
      </MotionReveal>,
    )
    expect(screen.getByRole("region", { name: "Summary" })).toHaveAttribute("data-reduced", "true")
    expect(root().style.opacity).toBe("")
    expect(pieces()).toHaveLength(0)
  })

  it("reveals children one by one with the stagger effect, with the root still", async () => {
    render(
      <MotionReveal effect="stagger" variant="fade">
        <p>One</p>
        <p>Two</p>
        <p>Three</p>
      </MotionReveal>,
    )
    expect(pieces()).toHaveLength(3)
    expect(root().style.opacity).toBe("")
    expect(pieces()[0].style.opacity).toBe("0")
    intersect(true)
    await waitFor(() => expect(Number(pieces()[0].style.opacity)).toBeGreaterThan(0))
  })

  it("wraps staggered children in list items inside a list", () => {
    render(
      <MotionReveal as="ul" effect="stagger">
        <span>One</span>
        <span>Two</span>
      </MotionReveal>,
    )
    expect(screen.getByRole("list").tagName).toBe("UL")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })

  it("renders the requested tag and keeps its attributes", () => {
    render(<MotionReveal as="article" id="note" className="mt-4">Note</MotionReveal>)
    expect(root().tagName).toBe("ARTICLE")
    expect(root()).toHaveAttribute("id", "note")
    expect(root().className).toContain("mt-4")
  })

  it("hides again on leaving only when asked to repeat", async () => {
    render(<MotionReveal variant="fade" repeat>Again</MotionReveal>)
    intersect(true)
    await waitFor(() => expect(Number(root().style.opacity)).toBe(1), { timeout: 3000 })
    intersect(false)
    await waitFor(() => expect(Number(root().style.opacity)).toBeLessThan(1), { timeout: 3000 })
  })

  it("stays shown on leaving by default", async () => {
    render(<MotionReveal variant="fade">Once</MotionReveal>)
    intersect(true)
    await waitFor(() => expect(Number(root().style.opacity)).toBe(1), { timeout: 3000 })
    intersect(false)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(Number(root().style.opacity)).toBe(1)
  })

  it("keeps the last row of a long list from waiting too long", () => {
    expect(staggerDelay(0, 3)).toBe(0)
    expect(staggerDelay(2, 3)).toBeCloseTo(0.12)
    expect(staggerDelay(0, 3, 0.2)).toBeCloseTo(0.2)
    expect(staggerDelay(99, 100)).toBeLessThanOrEqual(0.48)
  })
})
