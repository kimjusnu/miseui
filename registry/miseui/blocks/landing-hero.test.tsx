import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LandingHero } from "./landing-hero"

/** motion reads matchMedia once per module and then only listens for "change"; see beam-border.test.tsx. */
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

describe("LandingHero", () => {
  it("states one message: a single h1, a sentence and two actions, with no props", () => {
    render(<LandingHero />)
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("button", { name: /try it on your next call/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /see a sample summary/i })).toBeInTheDocument()
  })

  it("sets the headline in two tones inside one heading", () => {
    render(<LandingHero headline="First." headlineQuiet="Second." />)
    const heading = screen.getByRole("heading", { level: 1, name: "First. Second." })
    expect(screen.getByText("Second.")).toHaveClass("text-muted-foreground")
    expect(screen.getByText("Second.").parentElement).toBe(heading)
  })

  it("keeps the sample description under 20 words", () => {
    const { container } = render(<LandingHero preview={null} />)
    const text = container.querySelector("p")?.textContent ?? ""
    expect(text.trim().split(/\s+/).length).toBeLessThan(20)
  })

  it("fires both actions", async () => {
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()
    render(
      <LandingHero
        primaryAction={{ label: "Start", onClick: onPrimary }}
        secondaryAction={{ label: "Read more", onClick: onSecondary }}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /start/i }))
    await userEvent.click(screen.getByRole("button", { name: /read more/i }))
    expect(onPrimary).toHaveBeenCalledOnce()
    expect(onSecondary).toHaveBeenCalledOnce()
  })

  it("renders an action with href as a real link", () => {
    render(<LandingHero primaryAction={{ label: "Start", href: "/signup" }} />)
    expect(screen.getByRole("link", { name: /start/i })).toHaveAttribute("href", "/signup")
  })

  it("puts whatever is passed in the preview slot, and null collapses it", () => {
    const { container, rerender } = render(<LandingHero preview={<div>My product</div>} />)
    expect(screen.getByText("My product")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="landing-hero-preview"]')).not.toBeInTheDocument()
    rerender(<LandingHero preview={null} />)
    expect(screen.queryByText("My product")).not.toBeInTheDocument()
    expect(container.querySelector(".grid")?.className).not.toContain("grid-cols")
  })

  it("composes the default preview from the real orb, starting in the thinking state", () => {
    const { container } = render(<LandingHero />)
    expect(container.querySelector('[data-slot="thinking-orb"]')).toHaveAttribute("data-state", "thinking")
    expect(screen.getByText("Reading the transcript")).toBeInTheDocument()
  })

  it("layers real pieces: a card peeking from behind, and a chip once the work is done", () => {
    render(<LandingHero />)
    expect(screen.getByTestId("preview-back-card")).toHaveAttribute("data-slot", "card")
    expect(screen.getByTestId("preview-back-card")).toHaveAttribute("aria-hidden", "true")
    expect(screen.queryByText("Sent to 5 people")).not.toBeInTheDocument()
  })

  it("plays thinking, then streaming, with fake time", () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<LandingHero />)
      expect(container.querySelector('[data-slot="streaming-text"]')).not.toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(container.querySelector('[data-slot="streaming-text"]')).toHaveAttribute("data-streaming", "true")
      expect(container.querySelector('[data-slot="thinking-orb"]')).toHaveAttribute("data-state", "speaking")
    } finally {
      vi.useRealTimers()
    }
  })

  it("goes straight to the finished preview under reduced motion", () => {
    setReducedMotion(true)
    const { container } = render(<LandingHero />)
    expect(container.querySelector('[data-slot="thinking-orb"]')).toHaveAttribute("data-state", "idle")
    expect(container.querySelector('[data-slot="streaming-text"]')).not.toBeInTheDocument()
    expect(screen.getByText(/drop the \$9 tier/)).toBeInTheDocument()
    expect(screen.getByText("Sent to 5 people")).toBeInTheDocument()
    screen.getAllByTestId("preview-action-item").forEach((row) => expect(row).toHaveAttribute("aria-hidden", "false"))
    expect(screen.queryByRole("button", { name: "Replay the summary" })).not.toBeInTheDocument()
  })

  it("responds to its container, not the viewport", () => {
    const { container } = render(<LandingHero />)
    expect(container.querySelector('[data-slot="landing-hero"]')).toHaveClass("@container")
  })
})
