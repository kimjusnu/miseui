import { act, render, screen } from "@testing-library/react"
import { StreamingText } from "./streaming-text"

/** 10 characters per second keeps the arithmetic obvious: one character every 100 ms. */
const SPEED = 10
const MS_PER_CHAR = 100

/**
 * vitest.setup.ts installs matchMedia as a vi.fn, and restoreAllMocks does not undo a spy placed
 * on an existing mock, so we swap the property ourselves and put the original back after each test.
 */
const originalMatchMedia = window.matchMedia

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe("StreamingText", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
  })

  it("reveals more characters as time passes", () => {
    render(<StreamingText text="Hello world" speed={SPEED} />)
    const region = screen.getByText((_, element) => element?.getAttribute("data-slot") === "streaming-text")
    expect(region).toHaveTextContent("")
    expect(region).toHaveAttribute("data-streaming", "true")
    expect(region).toHaveAttribute("aria-live", "polite")

    advance(MS_PER_CHAR * 3)
    expect(region.textContent).toBe("Hel")

    advance(MS_PER_CHAR * 2)
    expect(region.textContent).toBe("Hello")
    expect(screen.getByTestId("streaming-cursor")).toBeInTheDocument()
  })

  it("calls onDone exactly once when every character is visible", () => {
    const onDone = vi.fn()
    render(<StreamingText text="abc" speed={SPEED} onDone={onDone} />)

    advance(MS_PER_CHAR * 2)
    expect(onDone).not.toHaveBeenCalled()

    advance(MS_PER_CHAR * 5)
    expect(onDone).toHaveBeenCalledTimes(1)
    const region = screen.getByText("abc")
    expect(region).toHaveAttribute("data-streaming", "false")
    expect(screen.queryByTestId("streaming-cursor")).not.toBeInTheDocument()

    advance(MS_PER_CHAR * 10)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("shows the whole text at once when the user prefers reduced motion", () => {
    mockReducedMotion(true)
    const onDone = vi.fn()
    render(<StreamingText text="Instant" speed={SPEED} onDone={onDone} />)

    const region = screen.getByText("Instant")
    expect(region).toHaveAttribute("data-streaming", "false")
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("continues from where it was when text is appended, and restarts when it changes", () => {
    const { rerender } = render(<StreamingText text="Hello" speed={SPEED} />)
    advance(MS_PER_CHAR * 3)
    const region = screen.getByText("Hel")

    rerender(<StreamingText text="Hello world" speed={SPEED} />)
    expect(region.textContent).toBe("Hel")
    advance(MS_PER_CHAR)
    expect(region.textContent).toBe("Hell")

    rerender(<StreamingText text="Goodbye" speed={SPEED} />)
    expect(region.textContent).toBe("")
    advance(MS_PER_CHAR * 2)
    expect(region.textContent).toBe("Go")
  })
})
