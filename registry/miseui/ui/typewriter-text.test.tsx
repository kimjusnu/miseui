import { act, fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { TypewriterText } from "./typewriter-text"
import { BLINK_MS, CARET_LINGER_MS, MAX_TYPING_MS, countAt, typingFrame, typingGlyphs, typingSchedule, typingTimeline } from "./typewriter-math"

const state = vi.hoisted(() => ({ reduced: false, inView: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

const frames = new Map<number, FrameRequestCallback>()
let nextFrame = 1
let now = 0

function step(ms: number) {
  now += ms
  const due = Array.from(frames.values())
  frames.clear()
  act(() => due.forEach((callback) => callback(now)))
}

/** Frames arrive at 60 per second; the play loop caps single gaps, so time must be walked, not jumped. */
function run(ms: number) {
  Array.from({ length: Math.ceil(ms / 16) }).forEach(() => step(16))
}

beforeEach(() => {
  state.reduced = false
  state.inView = false
  frames.clear()
  now = 0
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id))
})

afterEach(() => vi.unstubAllGlobals())

const slot = (name: string) => document.querySelector(`[data-slot='typewriter-text-${name}']`) as HTMLElement
const typed = () => slot("typed").textContent
const rest = () => slot("rest").textContent

describe("TypewriterText", () => {
  it("keeps the heading and gives assistive tech the sentence once", () => {
    render(<TypewriterText as="h2" text="Drafting notes" />)
    expect(screen.getByRole("heading", { level: 2, name: "Drafting notes" })).toBeInTheDocument()
    expect(slot("visual")).toHaveAttribute("aria-hidden", "true")
    expect(document.querySelector("[aria-live]")).toBeNull()
  })

  it("lays the whole text out from the first frame, so nothing reflows", () => {
    render(<TypewriterText text="Drafting notes" />)
    expect(typed()).toBe("D")
    expect(rest()).toBe("rafting notes")
    expect(slot("rest")).toHaveClass("invisible")
    expect(slot("caret")).toHaveClass("absolute")
  })

  it("renders the finished text on the server", () => {
    const parsed = new DOMParser().parseFromString(renderToString(<TypewriterText text="Drafting notes" />), "text/html")
    expect(parsed.querySelector("[data-slot='typewriter-text-typed']")?.textContent).toBe("Drafting notes")
    expect(parsed.querySelector("[data-slot='typewriter-text-rest']")?.textContent).toBe("")
  })

  it("reveals in order, keeping typed plus rest equal to the text", () => {
    state.inView = true
    render(<TypewriterText text="Hello there" />)
    step(0)
    run(120)
    expect(typed().length).toBeGreaterThan(1)
    expect(typed() + rest()).toBe("Hello there")
    run(4000)
    expect(typed()).toBe("Hello there")
    expect(rest()).toBe("")
  })

  it("stops the caret and asks for no more frames shortly after finishing", () => {
    state.inView = true
    render(<TypewriterText text="Hi" />)
    step(0)
    expect(slot("caret").style.opacity).toBe("1")
    run(CARET_LINGER_MS + 400)
    expect(slot("caret").style.opacity).toBe("0")
    expect(frames.size).toBe(0)
  })

  it("draws its variants differently in structure", () => {
    const { rerender } = render(<TypewriterText text="pnpm add motion" variant="block" />)
    expect(slot("prompt").textContent).toBe("$")
    expect(document.querySelector("[data-slot='typewriter-text']")).toHaveClass("font-mono")
    expect(slot("caret")).toHaveClass("w-[1ch]", "h-[1lh]")
    rerender(<TypewriterText text="Ask" variant="underscore" />)
    expect(slot("prompt")).toBeNull()
    expect(slot("caret")).toHaveClass("h-[2px]")
    rerender(<TypewriterText text="Ask" variant="field" />)
    expect(slot("visual")).toHaveClass("border", "border-input")
    expect(slot("caret")).toHaveClass("bg-mise")
    rerender(<TypewriterText text="Ask" variant="line" />)
    expect(slot("visual")).not.toHaveClass("border")
  })

  it("shows the finished text with no caret and no frames under reduced motion", () => {
    state.reduced = true
    state.inView = true
    render(<TypewriterText text="Plain words" />)
    expect(typed()).toBe("Plain words")
    expect(rest()).toBe("")
    expect(slot("caret").style.opacity).toBe("0")
    expect(frames.size).toBe(0)
  })

  it("loop lists phrases once, reserves the longest, and shows the first still under reduced motion", () => {
    state.reduced = true
    render(<TypewriterText effect="loop" phrases={["Short", "A much longer phrase"]} />)
    expect(document.querySelector(".sr-only")?.textContent).toBe("Short, A much longer phrase")
    expect(document.querySelectorAll("[data-slot='typewriter-text-reserve']")).toHaveLength(2)
    expect(typed()).toBe("Short")
  })

  it("loop goes on to the next phrase", () => {
    state.inView = true
    render(<TypewriterText effect="loop" phrases={["One", "Two"]} />)
    step(0)
    expect(typed()).toBe("O")
    run(2600)
    expect(typed() + rest()).toBe("Two")
  })

  it("loop holds on hover and focus and resumes on the letter it stopped at", () => {
    state.inView = true
    render(<TypewriterText effect="loop" phrases={["A longer phrase to type"]} />)
    const root = document.querySelector("[data-slot='typewriter-text']") as HTMLElement
    expect(root).toHaveAttribute("tabindex", "0")
    step(0)
    run(160)
    fireEvent.mouseEnter(root)
    expect(frames.size).toBe(0)
    const stopped = typed()
    fireEvent.mouseLeave(root)
    expect(frames.size).toBe(1)
    fireEvent.focusIn(root)
    expect(frames.size).toBe(0)
    expect(typed()).toBe(stopped)
    fireEvent.focusOut(root)
    step(16)
    expect(typed().length).toBeGreaterThanOrEqual(stopped.length)
  })

  it("loop stops off screen, in a hidden tab, and for the paused prop", () => {
    const hidden = vi.spyOn(document, "hidden", "get")
    state.inView = false
    const props = { effect: "loop", phrases: ["One"] } as const
    const { rerender } = render(<TypewriterText {...props} />)
    expect(frames.size).toBe(0)
    state.inView = true
    rerender(<TypewriterText {...props} />)
    expect(frames.size).toBe(1)
    rerender(<TypewriterText {...props} paused />)
    expect(frames.size).toBe(0)
    rerender(<TypewriterText {...props} />)
    expect(frames.size).toBe(1)
    hidden.mockReturnValue(true)
    fireEvent(document, new Event("visibilitychange"))
    expect(frames.size).toBe(0)
    hidden.mockRestore()
  })

  it("does not restart when the parent re-renders with a new array of the same phrases, and cancels on unmount", () => {
    state.inView = true
    const { rerender, unmount } = render(<TypewriterText effect="loop" phrases={["Stay on this letter"]} />)
    step(0)
    run(200)
    const reached = typed()
    expect(reached.length).toBeGreaterThan(1)
    rerender(<TypewriterText effect="loop" phrases={["Stay on this letter"]} />)
    expect(typed()).toBe(reached)
    unmount()
    expect(frames.size).toBe(0)
  })
})

describe("typewriter-math", () => {
  it("keeps Hangul, emoji and spaces as single keystrokes", () => {
    expect(typingGlyphs("제품 👨‍👩‍👧 ok")).toEqual(["제", "품", " ", "👨‍👩‍👧", " ", "o", "k"])
  })

  it("pauses longer after punctuation", () => {
    const options = { seed: 2, stepMs: 40 }
    const plain = typingSchedule(typingGlyphs("abcd"), options)
    const stopped = typingSchedule(typingGlyphs("ab.d"), options)
    expect(stopped[3] - stopped[2]).toBeGreaterThan(plain[3] - plain[2] + 200)
    const clause = typingSchedule(typingGlyphs("ab,d"), options)
    expect(clause[3] - clause[2]).toBeGreaterThan(plain[3] - plain[2] + 100)
    expect(clause[3] - clause[2]).toBeLessThan(stopped[3] - stopped[2])
  })

  it("is seeded: same seed same rhythm, and not metronomic", () => {
    const glyphs = typingGlyphs("a steady hand on the keys")
    expect(typingSchedule(glyphs, { seed: 3 })).toEqual(typingSchedule(glyphs, { seed: 3 }))
    expect(typingSchedule(glyphs, { seed: 3 })).not.toEqual(typingSchedule(glyphs, { seed: 4 }))
    const times = typingSchedule(glyphs, { seed: 3 })
    expect(new Set(times.slice(1).map((time, index) => time - times[index])).size).toBeGreaterThan(3)
  })

  it("speeds long text up instead of keeping people waiting", () => {
    const times = typingSchedule(typingGlyphs("word. ".repeat(100)), { seed: 1 })
    expect(times.at(-1)).toBeLessThanOrEqual(MAX_TYPING_MS)
    expect(times.every((time, index) => index === 0 || time >= times[index - 1])).toBe(true)
  })

  it("counts what has landed, with the first glyph at once", () => {
    expect(countAt([0, 50, 100], 0)).toBe(1)
    expect(countAt([0, 50, 100], 75)).toBe(2)
    expect(countAt([0, 50, 100], 500)).toBe(3)
    expect(countAt([], 0)).toBe(0)
  })

  it("blinks under one flash a second and then goes away for good", () => {
    const timeline = typingTimeline(["Hi"], { seed: 1 }, false)
    const { typedAt } = timeline.segments[0]
    expect(typingFrame(timeline, typedAt).caret).toBe(1)
    expect(typingFrame(timeline, typedAt + BLINK_MS + 1).caret).toBe(0)
    expect(typingFrame(timeline, typedAt + BLINK_MS * 2 + 1).caret).toBe(1)
    const end = typingFrame(timeline, typedAt + CARET_LINGER_MS)
    expect(end).toMatchObject({ caret: 0, done: true })
    expect(1000 / (BLINK_MS * 2)).toBeLessThan(3)
  })

  it("walks a loop through typing, holding, deleting and the next phrase, and wraps", () => {
    const timeline = typingTimeline(["Ab", "Cd"], { seed: 1 }, true)
    const [first, second] = timeline.segments
    expect(typingFrame(timeline, first.typedAt + 10)).toMatchObject({ phrase: 0, count: 2 })
    expect(typingFrame(timeline, first.deletedAt - 1).count).toBeLessThanOrEqual(1)
    expect(typingFrame(timeline, first.deletedAt + 1)).toMatchObject({ phrase: 0, count: 0 })
    expect(typingFrame(timeline, second.startAt)).toMatchObject({ phrase: 1, count: 1 })
    expect(typingFrame(timeline, timeline.totalMs)).toMatchObject({ phrase: 0, count: 1 })
    expect(typingFrame(timeline, timeline.totalMs * 3).done).toBe(false)
  })
})
