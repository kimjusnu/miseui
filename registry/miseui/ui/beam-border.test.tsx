import { render, screen } from "@testing-library/react"
import { BeamBorder } from "./beam-border"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
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
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  changeListeners.forEach((listener) => listener())
}

afterEach(() => setReducedMotion(false))

describe("BeamBorder", () => {
  it("wraps its children and runs the beam by default", () => {
    render(
      <BeamBorder>
        <p>Drafting reply</p>
      </BeamBorder>,
    )
    const wrapper = screen.getByText("Drafting reply").parentElement
    expect(wrapper).toHaveAttribute("data-slot", "beam-border")
    expect(wrapper).toHaveAttribute("data-active", "true")
    expect(screen.getByTestId("beam-layer")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("beam-bloom")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("beam").style.width).toBe("120px")
  })

  it("drops the beam layer entirely when inactive", () => {
    render(
      <BeamBorder active={false}>
        <p>Idle card</p>
      </BeamBorder>,
    )
    expect(screen.getByText("Idle card").parentElement).toHaveAttribute("data-active", "false")
    expect(screen.queryByTestId("beam-layer")).not.toBeInTheDocument()
  })

  describe("with the Web Animations API", () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }))

    beforeEach(() => {
      animate.mockClear()
      Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: animate })
    })

    afterEach(() => {
      Reflect.deleteProperty(Element.prototype, "animate")
    })

    it("runs one endless lap of the perimeter per duration, for the beam and its bloom", () => {
      render(<BeamBorder duration={6}>Slow lap</BeamBorder>)
      expect(animate).toHaveBeenCalledTimes(2)
      expect(animate).toHaveBeenCalledWith([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], {
        duration: 6000,
        iterations: Infinity,
      })
    })

    it("holds one still highlight instead of travelling under reduced motion", () => {
      setReducedMotion(true)
      render(<BeamBorder>Still</BeamBorder>)
      expect(screen.getByTestId("beam-layer")).toHaveAttribute("data-reduced", "true")
      expect(animate).not.toHaveBeenCalled()
      expect(screen.getByTestId("beam").style.backgroundImage).toContain("conic-gradient")
    })
  })
})
