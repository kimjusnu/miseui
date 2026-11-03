import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { DecryptText } from "./decrypt-text"
import { DOT, MARK_MS, barScale, decryptPlan, markOpacity, scanFractions, scanProgress, springProgress } from "./decrypt-math"

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

const layers = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='glyph-layer']"))
const letters = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='glyph-letter']"))
const bars = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='decrypt-text-bar']"))
const visual = () => document.querySelector("[data-slot='decrypt-text-visual']") as HTMLElement
const encrypted = () => layers().map((layer) => layer.textContent).join("")

describe("DecryptText", () => {
  it("starts encrypted before paint and gives assistive tech the sentence once", () => {
    render(<DecryptText as="h2" text="Card ending 4242" />)
    expect(screen.getByRole("heading", { level: 2, name: "Card ending 4242" })).toBeInTheDocument()
    expect(visual()).toHaveAttribute("aria-hidden", "true")
    expect(encrypted()).toBe(DOT.repeat(14))
    expect(letters().map((letter) => letter.textContent).join("")).toBe("Cardending4242")
  })

  it("replaces dots letter by letter and ends as plain text", () => {
    state.inView = true
    render(<DecryptText text="Open" />)
    step(0)
    expect(encrypted()).toBe(DOT.repeat(4))
    step(320 + 40)
    expect(encrypted()).toBe(DOT.repeat(2))
    step(5000)
    expect(encrypted()).toBe("")
    expect(frames.size).toBe(0)
  })

  it("draws its variants differently in structure", () => {
    const { rerender } = render(<DecryptText text="Two words" variant="redact" />)
    expect(bars()).toHaveLength(2)
    expect(layers()).toHaveLength(0)
    rerender(<DecryptText text="Two words" variant="cipher" />)
    expect(bars()).toHaveLength(0)
    expect(document.querySelectorAll("[data-slot='decrypt-text-mark']")).toHaveLength(8)
    expect(document.querySelector("[data-slot='decrypt-text']")).toHaveClass("font-mono")
    expect(layers()[0]).toHaveClass("text-muted-foreground")
    rerender(<DecryptText text="Two words" variant="scan" />)
    expect(document.querySelector("[data-slot='decrypt-text-line']")).toBeInTheDocument()
    expect(document.querySelectorAll("[data-slot='decrypt-text-mark']")).toHaveLength(0)
    rerender(<DecryptText text="Two words" variant="dots" />)
    expect(encrypted()).toBe(DOT.repeat(8))
  })

  it("retracts redaction bars one word at a time", () => {
    state.inView = true
    render(<DecryptText text="alpha beta gamma" variant="redact" />)
    const scales = () => bars().map((bar) => bar.style.transform)
    expect(scales()).toEqual(["scaleX(1)", "scaleX(1)", "scaleX(1)"])
    step(0)
    step(320 + 100)
    const [first, second, third] = scales()
    expect(first).not.toBe("scaleX(1)")
    expect(second).toBe("scaleX(1)")
    expect(third).toBe("scaleX(1)")
    step(10000)
    expect(scales()).toEqual(["scaleX(0)", "scaleX(0)", "scaleX(0)"])
  })

  it("moves the scan line and decodes what it has passed, with no layout to measure in jsdom", () => {
    state.inView = true
    render(<DecryptText text="abcde" variant="scan" />)
    step(0)
    step(320 + 460)
    const cells = layers().map((layer) => layer.textContent)
    expect(cells[0]).toBe("")
    expect(cells[4]).not.toBe("")
    expect(document.querySelector<HTMLElement>("[data-slot='decrypt-text-line']")?.style.opacity).toBe("1")
    step(10000)
    expect(encrypted()).toBe("")
    expect(document.querySelector<HTMLElement>("[data-slot='decrypt-text-line']")?.style.opacity).toBe("0")
  })

  it("press stays encrypted and out of the accessibility tree until the real button is pressed", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    state.inView = true
    render(<DecryptText text="quiet-harbour-41" effect="press" onRevealedChange={onChange} />)
    expect(frames.size).toBe(0)
    expect(document.querySelector(".sr-only")?.textContent).toBe("")
    expect(visual()).toHaveAttribute("aria-hidden", "true")
    expect(letters()[0]).toHaveClass("invisible")
    expect(screen.queryByText("quiet-harbour-41")).toBeNull()

    screen.getByRole("button", { name: "Decrypt" }).focus()
    await user.keyboard("{Enter}")
    expect(onChange).toHaveBeenCalledWith(true)
    expect(document.querySelector(".sr-only")?.textContent).toBe("quiet-harbour-41")
    expect(screen.getByRole("button", { name: "Hide" })).toHaveFocus()
    expect(frames.size).toBe(1)
    step(0)
    step(10000)
    expect(encrypted()).toBe("")
    expect(letters()[0]).not.toHaveClass("invisible")
  })

  it("press hides again from the same button, mid-run too", async () => {
    const user = userEvent.setup()
    render(<DecryptText text="Secret" effect="press" />)
    await user.click(screen.getByRole("button", { name: "Decrypt" }))
    step(0)
    await user.click(screen.getByRole("button", { name: "Hide" }))
    expect(frames.size).toBe(0)
    expect(encrypted()).toBe(DOT.repeat(6))
    expect(document.querySelector(".sr-only")?.textContent).toBe("")
  })

  it("on the server press is already encrypted, and the plain variant is already finished", () => {
    const locked = new DOMParser().parseFromString(renderToString(<DecryptText text="Secret" effect="press" />), "text/html")
    expect(locked.querySelector(".sr-only")?.textContent).toBe("")
    expect(Array.from(locked.querySelectorAll("[data-slot='glyph-layer']"), (node) => node.textContent).join("")).toBe(DOT.repeat(6))
    const open = new DOMParser().parseFromString(renderToString(<DecryptText text="Open" />), "text/html")
    expect(open.querySelector(".sr-only")?.textContent).toBe("Open")
    expect(Array.from(open.querySelectorAll("[data-slot='glyph-layer']"), (node) => node.textContent).join("")).toBe("")
  })

  it("press opened from the start has nothing to decode", () => {
    render(<DecryptText text="Open" effect="press" defaultRevealed />)
    expect(encrypted()).toBe("")
    expect(frames.size).toBe(0)
  })

  it("press under reduced motion reveals at once", async () => {
    const user = userEvent.setup()
    state.reduced = true
    render(<DecryptText text="Secret" effect="press" />)
    expect(encrypted()).toBe(DOT.repeat(6))
    await user.click(screen.getByRole("button", { name: "Decrypt" }))
    expect(encrypted()).toBe("")
    expect(frames.size).toBe(0)
  })

  it("shows the finished text under reduced motion", () => {
    state.reduced = true
    state.inView = true
    render(<DecryptText text="Plain" variant="cipher" />)
    expect(encrypted()).toBe("")
    expect(frames.size).toBe(0)
  })

  it("does not leak the old loop on unmount", () => {
    state.inView = true
    const { unmount } = render(<DecryptText text="Gone" />)
    expect(frames.size).toBe(1)
    unmount()
    expect(frames.size).toBe(0)
  })
})

describe("decrypt-math", () => {
  it("uses a fixed, seeded cipher that keeps case and leaves punctuation alone", () => {
    const cells = (seed: number) => decryptPlan("Ab, 한", "cipher", seed).words.flatMap((word) => word.cells)
    expect(cells(1).map((cell) => cell.before)).toEqual(cells(1).map((cell) => cell.before))
    expect(cells(1)[0].before).toMatch(/^[A-Z]$/)
    expect(cells(1)[1].before).toMatch(/^[a-z]$/)
    expect(cells(1)[2].before).toBe(",")
    expect(cells(1)[3].before).toMatch(/^[가-힣]$/)
  })

  it("stays short however long the text is", () => {
    const long = "word ".repeat(120)
    expect(decryptPlan(long, "dots", 1).durationMs).toBeLessThanOrEqual(1200)
    expect(decryptPlan(long, "cipher", 1).durationMs).toBeLessThanOrEqual(1200)
    expect(decryptPlan(long, "redact", 1).durationMs).toBeLessThanOrEqual(1200)
    expect(decryptPlan(long, "scan", 1).durationMs).toBeLessThanOrEqual(1200)
  })

  it("settles without overshoot", () => {
    const samples = Array.from({ length: 21 }, (_, index) => springProgress(index / 20))
    expect(samples[0]).toBe(0)
    expect(samples[20]).toBe(1)
    expect(samples.every((value, index) => index === 0 || value >= samples[index - 1])).toBe(true)
    expect(Math.max(...samples)).toBeLessThanOrEqual(1)
    expect(barScale(100, 50)).toBe(1)
    expect(barScale(100, 5000)).toBe(0)
  })

  it("flashes the accent mark only briefly", () => {
    expect(markOpacity(100, 99)).toBe(0)
    expect(markOpacity(100, 100)).toBe(1)
    expect(markOpacity(100, 100 + MARK_MS)).toBe(0)
  })

  it("places cells by their centre, with reading order when nothing is laid out", () => {
    expect(scanFractions([{ left: 10, width: 20 }, { left: 90, width: 20 }], 0, 100)).toEqual([0.2, 1])
    expect(scanFractions([{ left: 0, width: 0 }, { left: 0, width: 0 }, { left: 0, width: 0 }], 0, 0)).toEqual([0, 0.5, 1])
    expect(scanProgress(-10)).toBe(0)
    expect(scanProgress(99999)).toBe(1)
  })
})
