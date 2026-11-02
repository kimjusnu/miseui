import { render, screen } from "@testing-library/react"
import { ThinkingOrb } from "./thinking-orb"

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

describe("ThinkingOrb", () => {
  it("names itself after its state unless given a label", () => {
    const { rerender } = render(<ThinkingOrb state="listening" />)
    expect(screen.getByRole("img", { name: "listening" })).toHaveAttribute("data-state", "listening")

    rerender(<ThinkingOrb state="thinking" label="Assistant is thinking" />)
    expect(screen.getByRole("img", { name: "Assistant is thinking" })).toHaveAttribute("data-state", "thinking")
  })

  it("shows the halo only while listening", () => {
    const { unmount } = render(<ThinkingOrb state="idle" />)
    expect(screen.queryByTestId("orb-halo")).not.toBeInTheDocument()
    unmount()

    render(<ThinkingOrb state="listening" />)
    expect(screen.getByTestId("orb-halo")).toBeInTheDocument()
  })

  it("takes its diameter from size", () => {
    render(<ThinkingOrb size={72} />)
    const orb = screen.getByRole("img")
    expect(orb.style.width).toBe("72px")
    expect(orb.style.height).toBe("72px")
  })

  it("marks itself reduced so the loops stay still", () => {
    setReducedMotion(true)
    render(<ThinkingOrb state="thinking" />)
    expect(screen.getByRole("img")).toHaveAttribute("data-reduced", "true")
  })
})
