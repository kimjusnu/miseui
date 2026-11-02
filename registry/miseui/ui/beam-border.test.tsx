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
    expect(screen.getByTestId("beam")).toHaveClass("animate-spin")
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

  it("exposes the lap duration as the CSS variable the spin reads", () => {
    render(<BeamBorder duration={6}>Slow lap</BeamBorder>)
    expect(screen.getByTestId("beam-layer").style.getPropertyValue("--beam-duration")).toBe("6s")
    expect(screen.getByTestId("beam").style.animationDuration).toBe("var(--beam-duration)")
  })

  it("holds one still highlight instead of spinning under reduced motion", () => {
    setReducedMotion(true)
    render(<BeamBorder>Still</BeamBorder>)
    expect(screen.getByTestId("beam-layer")).toHaveAttribute("data-reduced", "true")
    expect(screen.getByTestId("beam")).not.toHaveClass("animate-spin")
  })
})
