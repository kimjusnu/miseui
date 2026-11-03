import { act, render, screen, waitFor } from "@testing-library/react"
import { motionValue, type MotionValue } from "motion/react"
import { ScrubText, settledProgress, splitWords, wordRange } from "./scrub-text"

const state = vi.hoisted(() => ({
  reduced: false,
  passing: null as unknown,
  page: null as unknown,
}))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  // jsdom has no layout, so the scroll positions are fed in by hand.
  useScroll: (options: { target?: unknown }) => ({ scrollYProgress: options.target ? state.passing : state.page }),
}))

const passing = () => state.passing as MotionValue<number>
const page = () => state.page as MotionValue<number>

beforeEach(() => {
  state.reduced = false
  state.passing = motionValue(0)
  state.page = motionValue(0)
})

const TEXT = "We read every note before we write a line"
const root = () => document.querySelector("[data-slot='scrub-text']") as HTMLElement
const words = () => Array.from(root().querySelectorAll<HTMLElement>("[data-slot='scrub-text-word']"))

describe("ScrubText", () => {
  it("keeps the whole sentence in the paragraph as real text", () => {
    render(<ScrubText text={TEXT} />)
    expect(root().tagName).toBe("P")
    expect(root().textContent?.replace(/\s+/g, " ").trim()).toBe(TEXT)
    expect(words()).toHaveLength(9)
  })

  it("brightens words in order as the scroll advances", async () => {
    render(<ScrubText text={TEXT} />)
    expect(Number(words()[0].style.opacity)).toBeCloseTo(0.24)
    act(() => passing().set(0.3))
    await waitFor(() => expect(Number(words()[0].style.opacity)).toBeGreaterThan(0.5))
    expect(Number(words().at(-1)?.style.opacity)).toBeCloseTo(0.24)
    act(() => passing().set(1))
    await waitFor(() => expect(Number(words().at(-1)?.style.opacity)).toBe(1))
  })

  it("finishes when the page runs out before the paragraph reaches its end offset", async () => {
    render(<ScrubText text={TEXT} />)
    act(() => {
      passing().set(0.4)
      page().set(1)
    })
    await waitFor(() => expect(Number(words().at(-1)?.style.opacity)).toBe(1))
  })

  it("moves different properties for each variant", () => {
    const { rerender } = render(<ScrubText text={TEXT} variant="marker" />)
    expect(words()[0].className).toContain("bg-no-repeat")
    expect(words()[0].style.backgroundSize).toContain("0%")
    expect(words()[0].style.opacity).toBe("")

    rerender(<ScrubText text={TEXT} variant="rise" />)
    expect(words()[0].className).toContain("inline-block")
    expect(Number(words()[0].style.opacity)).toBe(0)
  })

  it("shows the finished text at once when motion is off", () => {
    state.reduced = true
    render(<ScrubText text={TEXT} variant="rise" effect="smooth" />)
    expect(screen.getByText(TEXT)).toHaveAttribute("data-reduced", "true")
    expect(words()).toHaveLength(0)
  })

  it("sets the first word at the start and the last at the end", () => {
    expect(wordRange(0, 10)[0]).toBe(0)
    expect(wordRange(9, 10)[1]).toBeCloseTo(1)
    expect(wordRange(0, 1)).toEqual([0, 1])
    expect(wordRange(1, 2)).toEqual([0, 1])
  })

  it("splits on any whitespace and treats a finished page as done", () => {
    expect(splitWords("  한 줄\n  두 줄 ")).toEqual(["한", "줄", "두", "줄"])
    expect(settledProgress(0.2, 0.5)).toBe(0.2)
    expect(settledProgress(0.2, 1)).toBe(1)
  })
})
