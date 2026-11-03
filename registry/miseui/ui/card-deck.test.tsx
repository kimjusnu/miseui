import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CardDeck, type CardDeckProps, type CardDeckSlide, type CardDeckVariant } from "./card-deck"
import { clampIndex, rewindStepMs, swipeTarget } from "./card-deck-state"
import { stackPose } from "./card-deck-stages"

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
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => {
  setReducedMotion(false)
  vi.useRealTimers()
})

const VARIANTS: readonly CardDeckVariant[] = ["slides", "stack", "story", "outline"]
const SLIDES: readonly CardDeckSlide[] = [
  { id: "why", title: "Why we rebuilt onboarding", kicker: "Context" },
  { id: "what", title: "What changed", body: "Three screens became one." },
  { id: "result", title: "What it did", stats: [{ label: "Activation", value: "58%" }] },
]

function Deck(props: Partial<CardDeckProps>) {
  return <CardDeck label="Quarterly review" slides={SLIDES} {...props} />
}

const live = () => screen.getByText(/^Slide \d of 3/)

describe("CardDeck helpers", () => {
  it("clamps an index to the deck, including an empty deck", () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(9, 3)).toBe(2)
    expect(clampIndex(2, 0)).toBe(0)
  })

  it("turns a slide on a long drag or a short fast flick, and not on a slow nudge", () => {
    expect(swipeTarget(0, -200, 0, 300, 3)).toBe(1)
    expect(swipeTarget(0, -40, -800, 300, 3)).toBe(1)
    expect(swipeTarget(1, 40, 0, 300, 3)).toBe(1)
    expect(swipeTarget(1, 200, 0, 300, 3)).toBe(0)
    expect(swipeTarget(2, -200, 0, 300, 3)).toBe(2)
    expect(swipeTarget(1, -200, 0, 0, 3)).toBe(1)
  })

  it("keeps a rewind under a second however far back it goes", () => {
    expect(rewindStepMs(2)).toBe(120)
    expect(rewindStepMs(30) * 30).toBeCloseTo(900)
    expect(rewindStepMs(0)).toBe(0)
  })

  it("poses the pile: thrown left, on top, waiting behind, then hidden", () => {
    expect(stackPose(-1).opacity).toBe(0)
    expect(stackPose(0)).toMatchObject({ y: 0, scale: 1, opacity: 1 })
    expect(stackPose(1).y).toBeGreaterThan(0)
    expect(stackPose(1).scale).toBeLessThan(1)
    expect(stackPose(5).opacity).toBe(0)
  })
})

describe("CardDeck", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("marks the root and moves with the arrow keys, stopping at both ends", async () => {
      const user = userEvent.setup()
      const onIndexChange = vi.fn()
      render(<Deck variant={variant} onIndexChange={onIndexChange} />)
      const root = screen.getByRole("region", { name: "Quarterly review" })
      expect(root).toHaveAttribute("data-slot", "card-deck")
      expect(root).toHaveAttribute("data-variant", variant)
      expect(root).toHaveAttribute("aria-roledescription", "slide deck")
      await user.tab()
      await user.keyboard("{ArrowLeft}")
      expect(onIndexChange).not.toHaveBeenCalled()
      await user.keyboard("{ArrowRight}")
      expect(onIndexChange).toHaveBeenLastCalledWith(1)
      expect(live()).toHaveTextContent("Slide 2 of 3: What changed")
      await user.keyboard("{End}")
      expect(live()).toHaveTextContent("Slide 3 of 3: What it did")
      await user.keyboard("{ArrowRight}")
      expect(onIndexChange).toHaveBeenCalledTimes(2)
    })

    it("keeps the slides it is not showing out of the tab order and the reading order", () => {
      const { container } = render(<Deck variant={variant} defaultIndex={1} />)
      const slides = [...container.querySelectorAll("[data-slot='card-deck-slide']")]
      expect(slides).toHaveLength(3)
      expect(slides.filter((slide) => !slide.hasAttribute("inert"))).toHaveLength(1)
      expect(slides[1]).not.toHaveAttribute("inert")
    })
  })

  it("gives each variant its own structure", () => {
    const shape = (variant: CardDeckVariant) => {
      const { container, unmount } = render(<Deck variant={variant} />)
      const found = {
        strip: container.querySelector("[data-slot='card-deck-strip']") !== null,
        pile: container.querySelector("[data-layout='pile']") !== null,
        segments: container.querySelector("[data-slot='card-deck-segments']") !== null,
        outline: container.querySelector("[data-slot='card-deck-outline']") !== null,
        controls: container.querySelector("[data-slot='card-deck-controls']") !== null,
      }
      unmount()
      return found
    }
    expect(shape("slides")).toMatchObject({ strip: true, pile: false, controls: true })
    expect(shape("stack")).toMatchObject({ strip: false, pile: true, controls: true })
    expect(shape("story")).toMatchObject({ segments: true, controls: false })
    expect(shape("outline")).toMatchObject({ outline: true, strip: false, controls: true })
  })

  it("keeps focus on Previous when it reaches the first slide", async () => {
    const user = userEvent.setup()
    render(<Deck defaultIndex={1} />)
    const previous = screen.getByRole("button", { name: "Previous slide" })
    await user.click(previous)
    expect(previous).toHaveFocus()
    expect(previous).toHaveAttribute("aria-disabled", "true")
    expect(live()).toHaveTextContent("Slide 1 of 3")
    await user.click(previous)
    expect(live()).toHaveTextContent("Slide 1 of 3")
  })

  it("story moves with tap zones and fills one segment per slide seen", async () => {
    const user = userEvent.setup()
    const { container } = render(<Deck variant="story" />)
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    expect(live()).toHaveTextContent("Slide 2 of 3")
    expect(container.querySelectorAll("[data-seen='true']")).toHaveLength(2)
  })

  it("outline jumps from a title and marks the current one", async () => {
    const user = userEvent.setup()
    render(<Deck variant="outline" />)
    const row = screen.getByRole("button", { name: /What it did/ })
    await user.click(row)
    expect(row).toHaveAttribute("aria-current", "true")
    expect(live()).toHaveTextContent("Slide 3 of 3")
  })

  it("rewind passes every slide on the way back, and a key press interrupts it", () => {
    vi.useFakeTimers()
    const onIndexChange = vi.fn()
    const { rerender } = render(<Deck effect="rewind" defaultIndex={2} onIndexChange={onIndexChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Start over" }))
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    act(() => {
      vi.advanceTimersByTime(rewindStepMs(2))
    })
    expect(onIndexChange).toHaveBeenLastCalledWith(0)
    expect(onIndexChange).toHaveBeenCalledTimes(2)

    onIndexChange.mockClear()
    rerender(<Deck key="again" effect="rewind" defaultIndex={2} onIndexChange={onIndexChange} />)
    fireEvent.keyDown(screen.getByRole("region"), { key: "Home" })
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onIndexChange.mock.calls.map(([value]) => value)).toEqual([1, 2])
  })

  it("jumps straight back under reduced motion, without the steps", () => {
    setReducedMotion(true)
    const onIndexChange = vi.fn()
    render(<Deck effect="rewind" defaultIndex={2} onIndexChange={onIndexChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Start over" }))
    expect(onIndexChange.mock.calls).toEqual([[0]])
  })

  it("offers Start over only with the rewind effect", () => {
    const { unmount } = render(<Deck />)
    expect(screen.queryByRole("button", { name: "Start over" })).toBeNull()
    unmount()
    render(<Deck effect="rewind" />)
    expect(screen.getByRole("button", { name: "Start over" })).toHaveAttribute("aria-disabled", "true")
  })

  it("follows a controlled index, not the click", async () => {
    const user = userEvent.setup()
    const onIndexChange = vi.fn()
    render(<Deck index={1} onIndexChange={onIndexChange} />)
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    expect(onIndexChange).toHaveBeenCalledWith(2)
    expect(live()).toHaveTextContent("Slide 2 of 3")
  })

  it("leaves arrow keys alone while someone types inside a slide", () => {
    const onIndexChange = vi.fn()
    const slides = [{ id: "form", title: "Form", body: <input aria-label="Note" /> }, ...SLIDES]
    render(<CardDeck label="With a form" slides={slides} onIndexChange={onIndexChange} />)
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Note" }), { key: "ArrowRight" })
    expect(onIndexChange).not.toHaveBeenCalled()
  })
})
