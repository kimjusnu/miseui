import { act, fireEvent, render, screen } from "@testing-library/react"
import { GlitchText } from "./glitch-text"
import { BANDS, MIN_REPLAY_MS, dropOuts, frameAt, glitchBurst } from "./glitch-math"

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

const slots = (name: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-slot='glitch-text-${name}']`))

describe("GlitchText", () => {
  it("keeps the real text in the tree and hides every copy from assistive tech and selection", () => {
    render(<GlitchText as="h2" text="Signal restored" />)
    const heading = screen.getByRole("heading", { level: 2, name: "Signal restored" })
    expect(heading).toBeInTheDocument()
    expect(slots("content")[0].textContent).toBe("Signal restored")
    slots("fringe").forEach((layer) => {
      expect(layer).toHaveAttribute("aria-hidden", "true")
      expect(layer).toHaveClass("select-none", "invisible")
    })
  })

  it("draws its variants differently in structure", () => {
    const { rerender } = render(<GlitchText text="Back online" variant="split" />)
    expect(slots("fringe")).toHaveLength(2)
    expect(slots("fringe")[0]).toHaveClass("text-red-500", "mix-blend-multiply", "dark:mix-blend-screen")
    expect(slots("fringe")[1]).toHaveClass("text-cyan-500")
    rerender(<GlitchText text="Back online" variant="slice" />)
    expect(slots("fringe")).toHaveLength(0)
    expect(slots("band")).toHaveLength(BANDS.length)
    expect(slots("band")[0].style.clipPath).toContain("inset(")
    rerender(<GlitchText text="Back online" variant="flicker" />)
    expect(slots("letter")).toHaveLength(10)
    expect(slots("content")).toHaveLength(0)
    expect(document.querySelector(".sr-only")?.textContent).toBe("Back online")
    rerender(<GlitchText text="Back online" variant="skew" />)
    expect(slots("band")).toHaveLength(0)
    expect(slots("content")).toHaveLength(1)
  })

  it("rests clean, plays a short burst when seen, and ends clean with no frames asked", () => {
    const { rerender } = render(<GlitchText text="Now" variant="split" />)
    expect(frames.size).toBe(0)
    state.inView = true
    rerender(<GlitchText text="Now" variant="split" />)
    expect(frames.size).toBe(1)
    step(1000)
    const [red, cyan] = slots("fringe")
    expect(red.style.visibility).toBe("visible")
    expect(red.style.transform).toMatch(/^translateX\(-?[\d.]+em\)$/)
    expect(cyan.style.transform).toMatch(/^translateX\(-?[\d.]+em\)$/)
    expect(red.style.transform).not.toBe(cyan.style.transform)
    step(1000 + 5000)
    expect(red.style.visibility).toBe("")
    expect(red.style.transform).toBe("")
    expect(frames.size).toBe(0)
  })

  it("rebuilds the line from bands during slice and gives the text back afterwards", () => {
    state.inView = true
    render(<GlitchText text="Now" variant="slice" />)
    step(1000)
    expect(slots("content")[0].style.opacity).toBe("0")
    expect(slots("band").every((band) => band.style.visibility === "visible")).toBe(true)
    step(1000 + 5000)
    expect(slots("content")[0].style.opacity).toBe("")
    expect(slots("band").every((band) => band.style.visibility === "")).toBe(true)
  })

  it("jumps the whole line in steps for skew and drops letters for flicker", () => {
    state.inView = true
    const { unmount } = render(<GlitchText text="Now" variant="skew" />)
    step(1000)
    expect(slots("content")[0].style.transform).toMatch(/skewX\(-?\d+deg\)/)
    step(6000)
    expect(slots("content")[0].style.transform).toBe("")
    unmount()
    render(<GlitchText text="Open all night and all day" variant="flicker" />)
    step(1000)
    expect(slots("letter").some((letter) => letter.style.opacity === "0.12")).toBe(true)
    step(6000)
    expect(slots("letter").every((letter) => letter.style.opacity === "")).toBe(true)
  })

  it("does nothing under reduced motion, also on hover", () => {
    state.reduced = true
    state.inView = true
    render(
      <a href="#status">
        <GlitchText text="Status" effect="hover" />
      </a>,
    )
    fireEvent.mouseEnter(screen.getByRole("link"))
    expect(frames.size).toBe(0)
  })

  it("with hover stays clean when seen, plays on the link around it, and has a cool-down", () => {
    state.inView = true
    const now = vi.spyOn(performance, "now").mockReturnValue(5000)
    render(
      <a href="#status">
        <GlitchText text="Status" effect="hover" />
      </a>,
    )
    expect(frames.size).toBe(0)
    const link = screen.getByRole("link")
    fireEvent.mouseEnter(link)
    expect(frames.size).toBe(1)
    step(0)
    step(5000)
    expect(frames.size).toBe(0)
    now.mockReturnValue(5000 + MIN_REPLAY_MS - 1)
    fireEvent.mouseEnter(link)
    expect(frames.size).toBe(0)
    now.mockReturnValue(5000 + MIN_REPLAY_MS)
    fireEvent.mouseEnter(link)
    expect(frames.size).toBe(1)
    now.mockRestore()
  })

  it("with hover plays on keyboard focus only", () => {
    render(
      <a href="#status">
        <GlitchText text="Status" effect="hover" />
      </a>,
    )
    const link = screen.getByRole("link")
    const matches = vi.spyOn(link, "matches").mockReturnValue(false)
    fireEvent.focusIn(link)
    expect(frames.size).toBe(0)
    matches.mockReturnValue(true)
    fireEvent.focusIn(link)
    expect(frames.size).toBe(1)
  })

  it("can start again after being cut short, as StrictMode does on mount, and leaves no pose behind", () => {
    const { rerender } = render(<GlitchText text="Now" trigger="mount" seed={1} />)
    expect(frames.size).toBe(1)
    step(1000)
    expect(slots("fringe")[0].style.visibility).toBe("visible")
    rerender(<GlitchText text="Now" trigger="mount" seed={2} />)
    expect(slots("fringe")[0].style.visibility).toBe("")
    expect(frames.size).toBe(1)
  })

  it("watches the same element after the text changes, so a later first view still plays", () => {
    const { rerender } = render(<GlitchText text="Before" />)
    const stage = document.querySelector("[data-slot='glitch-text-stage']")
    rerender(<GlitchText text="After" />)
    expect(document.querySelector("[data-slot='glitch-text-stage']")).toBe(stage)
    expect(slots("content")[0].textContent).toBe("After")
  })

  it("does not leak the old loop on unmount", () => {
    state.inView = true
    const { unmount } = render(<GlitchText text="Gone" />)
    expect(frames.size).toBe(1)
    unmount()
    expect(frames.size).toBe(0)
  })
})

describe("glitch-math", () => {
  it("is seeded and short for every variant", () => {
    ;(["split", "slice", "flicker", "skew"] as const).forEach((variant) => {
      expect(glitchBurst(variant, 4, 20)).toEqual(glitchBurst(variant, 4, 20))
      expect(glitchBurst(variant, 4, 20).durationMs).toBeLessThanOrEqual(700)
    })
    expect(glitchBurst("slice", 4, 20)).not.toEqual(glitchBurst("slice", 5, 20))
  })

  it("holds each pose and returns null once clean", () => {
    const burst = glitchBurst("split", 1, 0)
    expect(frameAt(burst, 0)).toBe(burst.frames[0])
    expect(frameAt(burst, 69)).toBe(burst.frames[0])
    expect(frameAt(burst, 70)).toBe(burst.frames[1])
    expect(frameAt(burst, burst.durationMs)).toBeNull()
  })

  it("never drops a letter more than three times per burst, with bursts at least a second apart", () => {
    const seeds = [1, 2, 3, 4, 5]
    seeds.forEach((seed) => {
      const burst = glitchBurst("flicker", seed, 40)
      Array.from({ length: 40 }).forEach((_, letter) => expect(dropOuts(burst, letter)).toBeLessThanOrEqual(3))
      burst.frames.forEach((frame, index) => {
        if (index > 0 && frame.off.length > 0) expect(burst.frames[index - 1].off).toEqual([])
      })
    })
    expect(MIN_REPLAY_MS).toBeGreaterThanOrEqual(1000)
  })

  it("covers the whole line with bands, with no gap", () => {
    expect(BANDS[0][0]).toBe(0)
    expect(BANDS.at(-1)?.[1]).toBe(100)
    BANDS.slice(1).forEach(([top], index) => expect(top).toBeLessThanOrEqual(BANDS[index][1]))
  })

  it("shifts bands in a slice frame and leaves the first pose off-centre", () => {
    const burst = glitchBurst("slice", 2, 0)
    expect(burst.frames[0].bands.some((shift) => shift !== 0)).toBe(true)
    expect(burst.frames[0].bands).toHaveLength(BANDS.length)
  })
})
