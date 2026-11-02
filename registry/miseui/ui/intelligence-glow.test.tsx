import { render, screen } from "@testing-library/react"
import { IntelligenceGlow } from "./intelligence-glow"

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

const glow = () => document.querySelector<HTMLElement>('[data-slot="intelligence-glow"]')

describe("IntelligenceGlow", () => {
  it("is in the DOM only while active, and hidden from assistive tech", () => {
    const { rerender } = render(<IntelligenceGlow active={false} />)
    expect(glow()).toBeNull()

    rerender(<IntelligenceGlow active />)
    expect(glow()).toHaveAttribute("role", "presentation")
    expect(glow()).toHaveAttribute("aria-hidden", "true")
    expect(glow()).toHaveAttribute("data-active", "true")
  })

  it("clamps intensity into 0..1 and exposes it as a CSS variable", () => {
    const { rerender } = render(<IntelligenceGlow active intensity={3} />)
    expect(glow()?.style.getPropertyValue("--glow-intensity")).toBe("1")
    rerender(<IntelligenceGlow active intensity={-1} />)
    expect(glow()?.style.getPropertyValue("--glow-intensity")).toBe("0")
    rerender(<IntelligenceGlow active intensity={0.25} />)
    expect(glow()?.style.getPropertyValue("--glow-intensity")).toBe("0.25")
  })

  it("covers the screen by default and the parent when inset", () => {
    const { rerender } = render(<IntelligenceGlow active />)
    expect(glow()).toHaveClass("fixed", "z-50")
    rerender(<IntelligenceGlow active inset />)
    expect(glow()).toHaveClass("absolute")
    expect(glow()).not.toHaveClass("fixed")
  })

  it("keeps the light still under reduced motion", () => {
    setReducedMotion(true)
    render(<IntelligenceGlow active />)
    expect(glow()).toHaveAttribute("data-reduced", "true")
    for (const spin of screen.getAllByTestId("glow-spin")) {
      expect(spin).not.toHaveClass("animate-spin")
    }
  })
})
