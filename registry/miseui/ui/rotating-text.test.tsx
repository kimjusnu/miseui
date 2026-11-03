import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { RotatingText, clampInterval, nextWordIndex, spokenSentence } from "./rotating-text"

const state = vi.hoisted(() => ({ reduced: false, inView: true }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

type ObserverCallback = (entries: readonly { borderBoxSize: readonly { inlineSize: number }[] }[]) => void

const observers = vi.hoisted(() => ({ list: [] as { callback: ObserverCallback; disconnected: boolean }[] }))

class ResizeObserverStub {
  private readonly record: { callback: ObserverCallback; disconnected: boolean }
  constructor(callback: ObserverCallback) {
    this.record = { callback, disconnected: false }
    observers.list.push(this.record)
  }
  observe() {}
  disconnect() {
    this.record.disconnected = true
  }
  unobserve() {}
}

const WORDS = ["designers", "developers", "founders"]

const shownWord = () => document.querySelector("[data-slot='rotating-text-sizer']")?.textContent
const root = () => document.querySelector("[data-slot='rotating-text']") as HTMLElement
const pieces = () => document.querySelectorAll("[data-slot='rotating-text-piece']")

const tick = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

beforeEach(() => {
  state.reduced = false
  state.inView = true
  observers.list = []
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("RotatingText", () => {
  it("gives assistive tech the sentence with every word once, and hides the moving part", () => {
    render(<RotatingText as="h2" before="Built for " words={WORDS} after=" who ship." />)
    expect(screen.getByRole("heading", { level: 2, name: "Built for designers, developers, founders who ship." })).toBeInTheDocument()
    expect(document.querySelector("[data-slot='rotating-text-visual']")).toHaveAttribute("aria-hidden", "true")
    expect(document.querySelector("[aria-live]")).toBeNull()
  })

  it("cycles through the words and wraps", () => {
    vi.useFakeTimers()
    render(<RotatingText words={WORDS} interval={2000} />)
    expect(shownWord()).toBe("designers")
    tick(2000)
    expect(shownWord()).toBe("developers")
    tick(2000)
    expect(shownWord()).toBe("founders")
    tick(2000)
    expect(shownWord()).toBe("designers")
  })

  it("keeps both words during the change and removes the old one afterwards", async () => {
    render(<RotatingText words={WORDS} interval={1200} />)
    const words = () => Array.from(document.querySelectorAll("[data-slot='rotating-text-word']")).map((word) => word.textContent)
    expect(words()).toEqual(["designers"])
    await waitFor(() => expect(words()).toContain("developers"), { timeout: 2000 })
    await waitFor(() => expect(words()).toEqual(["developers"]), { timeout: 2000 })
  })

  it("does not start off screen", () => {
    vi.useFakeTimers()
    state.inView = false
    render(<RotatingText words={WORDS} interval={2000} />)
    tick(6000)
    expect(shownWord()).toBe("designers")
    expect(root()).toHaveAttribute("data-running", "false")
  })

  it("stops for the paused prop, hover, focus and a hidden tab", () => {
    vi.useFakeTimers()
    const { rerender } = render(<RotatingText words={WORDS} interval={2000} paused />)
    tick(6000)
    expect(shownWord()).toBe("designers")

    rerender(<RotatingText words={WORDS} interval={2000} />)
    fireEvent.pointerEnter(root())
    tick(6000)
    expect(shownWord()).toBe("designers")
    fireEvent.pointerLeave(root())

    fireEvent.focus(root())
    tick(6000)
    expect(shownWord()).toBe("designers")
    fireEvent.blur(root())

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    fireEvent(document, new Event("visibilitychange"))
    tick(6000)
    expect(shownWord()).toBe("designers")
    hidden.mockRestore()
    fireEvent(document, new Event("visibilitychange"))
    tick(2000)
    expect(shownWord()).toBe("developers")
  })

  it("does not leak the timer when it unmounts or restarts with a new key", () => {
    vi.useFakeTimers()
    const { rerender, unmount } = render(<RotatingText key="a" words={WORDS} interval={2000} />)
    const before = vi.getTimerCount()
    rerender(<RotatingText key="b" words={WORDS} interval={2000} />)
    expect(vi.getTimerCount()).toBe(before)
    expect(shownWord()).toBe("designers")
    unmount()
    expect(vi.getTimerCount()).toBeLessThan(before)
  })

  it("shows the first word still under reduced motion, and never ticks", () => {
    vi.useFakeTimers()
    state.reduced = true
    render(<RotatingText words={WORDS} interval={2000} />)
    tick(6000)
    expect(document.querySelector("[data-slot='rotating-text-still']")).toHaveTextContent("designers")
    expect(document.querySelector("[data-slot='rotating-text-slot']")).toBeNull()
    expect(observers.list).toHaveLength(0)
  })

  it("does not tick with a single word", () => {
    vi.useFakeTimers()
    render(<RotatingText words={["alone"]} interval={2000} />)
    tick(6000)
    expect(shownWord()).toBe("alone")
  })

  it("renders with no words, without an undefined anywhere", () => {
    render(<RotatingText before="Hello" words={[]} />)
    expect(root()).toHaveTextContent("Hello")
    expect(root().textContent).not.toContain("undefined")
  })

  it("sets the slot from the observer, so a late font still corrects it", async () => {
    render(<RotatingText words={WORDS} />)
    const slot = document.querySelector("[data-slot='rotating-text-slot']") as HTMLElement
    act(() => observers.list[0].callback([{ borderBoxSize: [{ inlineSize: 80.2 }] }]))
    await waitFor(() => expect(slot.style.width).toBe("81px"))
    act(() => observers.list[0].callback([{ borderBoxSize: [{ inlineSize: 96 }] }]))
    await waitFor(() => expect(Number.parseFloat(slot.style.width)).toBeGreaterThan(81))
  })

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<RotatingText words={WORDS} />)
    unmount()
    expect(observers.list[0].disconnected).toBe(true)
  })

  it("builds a different structure for each variant", () => {
    const slotOf = (variant: "slide" | "blur" | "flip" | "pill") => {
      const { unmount } = render(<RotatingText words={WORDS} variant={variant} />)
      const slot = document.querySelector("[data-slot='rotating-text-slot']") as HTMLElement
      const piece = pieces()[0] as HTMLElement
      const result = { clipped: slot.className.includes("overflow-clip"), chip: slot.className.includes("bg-mise-soft"), depth: slot.className.includes("perspective"), hinged: piece.className.includes("origin-") }
      unmount()
      return result
    }
    expect(slotOf("slide")).toEqual({ clipped: true, chip: false, depth: false, hinged: false })
    expect(slotOf("blur")).toEqual({ clipped: false, chip: false, depth: false, hinged: false })
    expect(slotOf("flip")).toEqual({ clipped: false, chip: false, depth: true, hinged: true })
    expect(slotOf("pill")).toEqual({ clipped: true, chip: true, depth: false, hinged: false })
  })

  it("moves the word as one, or by grapheme with the letters effect", () => {
    const { rerender } = render(<RotatingText words={["한글 👩‍💻"]} />)
    expect(pieces()).toHaveLength(2)
    rerender(<RotatingText words={["한글 👩‍💻"]} effect="letters" />)
    expect(pieces()).toHaveLength(3)
    expect(root()).toHaveAttribute("data-effect", "letters")
  })
})

describe("rotating-text helpers", () => {
  it("wraps the index and survives an empty list", () => {
    expect(nextWordIndex(0, 3)).toBe(1)
    expect(nextWordIndex(2, 3)).toBe(0)
    expect(nextWordIndex(0, 0)).toBe(0)
  })

  it("will not change faster than a word can be read", () => {
    expect(clampInterval(50)).toBe(1200)
    expect(clampInterval(4000)).toBe(4000)
    expect(clampInterval(Number.NaN)).toBe(2600)
  })

  it("keeps the spacing the owner wrote, for languages that attach particles", () => {
    expect(spokenSentence("For ", ["a", "b"], ".")).toBe("For a, b.")
    expect(spokenSentence("", ["개발자", "디자이너"], "를 위한 도구")).toBe("개발자, 디자이너를 위한 도구")
  })
})
