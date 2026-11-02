import { render, screen } from "@testing-library/react"
import { ShimmerText } from "./shimmer-text"

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

describe("ShimmerText", () => {
  it("renders the text inside a band that sweeps", () => {
    render(<ShimmerText>Thinking…</ShimmerText>)
    const band = screen.getByTestId("shimmer-band")
    expect(band).toHaveTextContent("Thinking…")
    expect(band).toHaveClass("bg-clip-text", "text-transparent")
    expect(band.parentElement).toHaveAttribute("data-slot", "shimmer-text")
    expect(band.parentElement).toHaveAttribute("data-active", "true")
  })

  it("falls back to plain text when inactive", () => {
    render(<ShimmerText active={false}>Done</ShimmerText>)
    const text = screen.getByText("Done")
    expect(text).toHaveAttribute("data-active", "false")
    expect(text).not.toHaveClass("text-transparent")
    expect(screen.queryByTestId("shimmer-band")).not.toBeInTheDocument()
  })

  it("forwards class and style to the root so it sits in any type setting", () => {
    render(
      <ShimmerText className="text-sm" style={{ opacity: 0.5 }}>
        Reading…
      </ShimmerText>,
    )
    const root = screen.getByTestId("shimmer-band").parentElement
    expect(root).toHaveClass("text-sm")
    expect(root).toHaveStyle({ opacity: "0.5" })
  })

  it("parks the band when the user prefers reduced motion", () => {
    setReducedMotion(true)
    render(<ShimmerText>Thinking…</ShimmerText>)
    expect(screen.getByTestId("shimmer-band")).toHaveAttribute("data-reduced", "true")
  })
})
