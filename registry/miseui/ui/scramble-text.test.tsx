import { act, fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { ScrambleText } from "./scramble-text"
import { cellGlyph, glyphKind, noiseGlyph, scrambleDuration, scrambleWords, seededUnit, tickerGlyph } from "./scramble-math"

const state = vi.hoisted(() => ({ reduced: false, inView: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

const frames = new Map<number, FrameRequestCallback>()
let nextFrame = 1

function step(now: number) {
  const due = Array.from(frames.values())
  frames.clear()
  act(() => due.forEach((callback) => callback(now)))
}

beforeEach(() => {
  state.reduced = false
  state.inView = false
  frames.clear()
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id))
})

afterEach(() => vi.unstubAllGlobals())

const visual = () => document.querySelector("[data-slot='scramble-text-visual']") as HTMLElement
const layers = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='glyph-layer']"))
const letters = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='glyph-letter']"))
const shown = () => layers().map((layer, index) => layer.textContent || letters()[index].textContent).join("")

describe("ScrambleText", () => {
  it("keeps the heading and gives assistive tech the sentence once", () => {
    render(<ScrambleText as="h2" text="Ship it" />)
    expect(screen.getByRole("heading", { level: 2, name: "Ship it" })).toBeInTheDocument()
    expect(visual()).toHaveAttribute("aria-hidden", "true")
    expect(visual().closest("[aria-live]")).toBeNull()
  })

  it("reserves each cell with the real letter while the noise runs", () => {
    render(<ScrambleText text="Quiet" />)
    expect(letters().map((letter) => letter.textContent).join("")).toBe("Quiet")
    expect(layers().every((layer) => layer.textContent !== "")).toBe(true)
    expect(letters()[0].style.color).toBe("transparent")
  })

  it("keeps real spaces between words as break points", () => {
    render(<ScrambleText text="two words" />)
    const words = document.querySelectorAll("[data-slot='glyph-word']")
    expect(words).toHaveLength(2)
    expect(visual().textContent).toContain(" ")
  })

  it("waits to be seen, then settles into plain text and stops asking for frames", () => {
    const { rerender } = render(<ScrambleText text="Now" />)
    expect(frames.size).toBe(0)
    state.inView = true
    rerender(<ScrambleText text="Now" />)
    expect(frames.size).toBe(1)
    step(0)
    expect(frames.size).toBe(1)
    step(5000)
    expect(shown()).toBe("Now")
    expect(layers().every((layer) => layer.textContent === "")).toBe(true)
    expect(letters()[0].style.color).toBe("")
    expect(frames.size).toBe(0)
  })

  it("renders the finished text on the server and never calls Math.random", () => {
    const random = vi.spyOn(Math, "random")
    const html = renderToString(<ScrambleText text="Ship" />)
    expect(html).toContain("sr-only select-none\">Ship<")
    const parsed = new DOMParser().parseFromString(html, "text/html")
    expect(Array.from(parsed.querySelectorAll("[data-slot='glyph-letter']"), (node) => node.textContent).join("")).toBe("Ship")
    expect(Array.from(parsed.querySelectorAll("[data-slot='glyph-layer']")).every((node) => node.textContent === "")).toBe(true)
    render(<ScrambleText text="Ship" />)
    expect(random).not.toHaveBeenCalled()
    random.mockRestore()
  })

  it("is the same on every run for one seed", () => {
    const first = render(<ScrambleText text="Same noise" seed={3} />)
    const noise = shown()
    first.unmount()
    render(<ScrambleText text="Same noise" seed={3} />)
    expect(shown()).toBe(noise)
  })

  it("shows the finished text with nothing moving under reduced motion", () => {
    state.reduced = true
    state.inView = true
    render(<ScrambleText text="Plain words" />)
    expect(shown()).toBe("Plainwords")
    expect(layers().every((layer) => layer.textContent === "")).toBe(true)
    expect(frames.size).toBe(0)
  })

  it("does not leak the old loop when it unmounts or the text changes", () => {
    state.inView = true
    const { rerender, unmount } = render(<ScrambleText text="First" />)
    expect(frames.size).toBe(1)
    rerender(<ScrambleText text="Second" />)
    expect(frames.size).toBe(1)
    expect(letters().map((letter) => letter.textContent).join("")).toBe("Second")
    unmount()
    expect(frames.size).toBe(0)
  })

  it("watches the same element after the text changes, so a later first view still plays", () => {
    const { rerender } = render(<ScrambleText text="Before" />)
    const element = visual()
    rerender(<ScrambleText text="After" />)
    expect(visual()).toBe(element)
    expect(letters().map((letter) => letter.textContent).join("")).toBe("After")
    expect(layers().every((layer) => layer.textContent !== "")).toBe(true)
  })

  it("with hover rests clean, then replays on the link around it", () => {
    state.inView = true
    render(
      <a href="#changelog">
        <ScrambleText text="Changelog" effect="hover" />
      </a>,
    )
    expect(layers().every((layer) => layer.textContent === "")).toBe(true)
    expect(frames.size).toBe(0)
    const link = screen.getByRole("link", { name: "Changelog" })
    fireEvent.mouseEnter(link)
    expect(frames.size).toBe(1)
    step(0)
    expect(layers().some((layer) => layer.textContent !== "")).toBe(true)
    step(5000)
    expect(shown()).toBe("Changelog")
  })

  it("with hover replays on keyboard focus of the link", () => {
    render(
      <a href="#changelog">
        <ScrambleText text="Changelog" effect="hover" />
      </a>,
    )
    const link = screen.getByRole("link")
    // jsdom has no focus heuristics, so the two answers of :focus-visible are stubbed on this link.
    const matches = vi.spyOn(link, "matches").mockReturnValue(false)
    fireEvent.focusIn(link)
    expect(frames.size).toBe(0)
    matches.mockReturnValue(true)
    fireEvent.focusIn(link)
    expect(frames.size).toBe(1)
  })

  it("mono is monospace with muted noise; the other variants keep their face", () => {
    const { rerender } = render(<ScrambleText text="Build" variant="mono" />)
    expect(document.querySelector("[data-slot='scramble-text']")).toHaveClass("font-mono")
    expect(layers()[0]).toHaveClass("text-muted-foreground")
    expect(/[#%&*+=/<>~^_-]/.test(shown())).toBe(true)
    rerender(<ScrambleText text="Build" variant="letters" />)
    expect(document.querySelector("[data-slot='scramble-text']")).not.toHaveClass("font-mono")
    expect(layers()[0]).not.toHaveClass("text-muted-foreground")
  })
})

describe("scramble-math", () => {
  const plan = (text: string, mode: "letters" | "symbols" | "ticker", order: "start" | "center" = "start") => scrambleWords(text, { mode, order, seed: 7 })

  it("gives the same value for the same seed and spreads across seeds", () => {
    expect(seededUnit(7, 3, 2)).toBe(seededUnit(7, 3, 2))
    expect(seededUnit(7, 3, 2)).not.toBe(seededUnit(8, 3, 2))
    const values = Array.from({ length: 200 }, (_, index) => seededUnit(1, index))
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true)
    expect(new Set(values.map((value) => Math.floor(value * 10))).size).toBe(10)
  })

  it("keeps Hangul and emoji whole and never scrambles what is not a letter", () => {
    const cells = plan("제품 👨‍👩‍👧 ok!", "letters").flatMap((word) => word.cells)
    expect(cells.map((cell) => cell.target)).toEqual(["제", "품", "👨‍👩‍👧", "o", "k", "!"])
    expect(glyphKind("👨‍👩‍👧")).toBe("fixed")
    expect(cellGlyph(cells[2], 0, "letters", 7)).toBeNull()
    expect(cellGlyph(cells[5], 0, "letters", 7)).toBeNull()
  })

  it("keeps same-case noise, narrow glyphs for narrow letters, and Hangul for Hangul", () => {
    const options = { set: "letters", seed: 1, tick: 0 } as const
    const sample = (target: string) => Array.from({ length: 40 }, (_, index) => noiseGlyph(target, { ...options, index }))
    expect(sample("a").every((glyph) => /^[a-z]$/.test(glyph))).toBe(true)
    expect(sample("A").every((glyph) => /^[A-Z]$/.test(glyph))).toBe(true)
    expect(sample("i").every((glyph) => "fijlrt".includes(glyph))).toBe(true)
    expect(sample("a").some((glyph) => glyph === "m" || glyph === "w")).toBe(false)
    expect(sample("한").every((glyph) => /^[가-힣]$/.test(glyph))).toBe(true)
    expect(noiseGlyph("7", { ...options, index: 0 })).toMatch(/^[0-9]$/)
  })

  it("steps the ticker through the alphabet in order and wraps", () => {
    expect(tickerGlyph("d", 1)).toBe("c")
    expect(tickerGlyph("d", 3)).toBe("a")
    expect(tickerGlyph("a", 1)).toBe("z")
    expect(tickerGlyph("B", 2)).toBe("Z")
    expect(tickerGlyph("3", 4)).toBe("9")
    expect(tickerGlyph("!", 4)).toBe("!")
    expect(tickerGlyph("가", 3)).toMatch(/^[가-힣]$/)
    const [cell] = plan("q", "ticker")[0].cells
    const walk = Array.from({ length: cell.steps + 1 }, (_, step) => cellGlyph(cell, cell.startAt + step * 45, "ticker", 7))
    expect(walk.at(-1)).toBeNull()
    const codes = walk.slice(0, -1).map((glyph) => (glyph as string).charCodeAt(0))
    expect(codes.slice(1).every((code, index) => code === codes[index] + 1 || code === 97)).toBe(true)
  })

  it("settles left to right, or from the middle out", () => {
    const left = plan("abcde", "letters")[0].cells.map((cell) => cell.settleAt)
    expect(left).toEqual([...left].sort((a, b) => a - b))
    expect(left[0]).toBeLessThan(left[4])
    const middle = plan("abcde", "letters", "center")[0].cells.map((cell) => cell.settleAt)
    expect(middle[2]).toBeLessThan(middle[0])
    expect(middle[0]).toBe(middle[4])
  })

  it("stays short however long the text is", () => {
    const long = "A sentence that keeps going well past what anyone would put in a headline ".repeat(4)
    expect(scrambleDuration(plan(long, "letters"))).toBeLessThanOrEqual(900)
    expect(scrambleDuration(plan(long, "ticker"))).toBeLessThanOrEqual(900)
  })

  it("changes noise per tick, not per frame", () => {
    const [cell] = plan("abcdefghij", "letters")[0].cells.slice(-1)
    expect(cellGlyph(cell, 10, "letters", 7)).toBe(cellGlyph(cell, 40, "letters", 7))
    const distinct = new Set(Array.from({ length: 8 }, (_, tick) => cellGlyph(cell, tick * 55, "letters", 7)))
    expect(distinct.size).toBeGreaterThan(1)
  })
})
