import { act, fireEvent, render, screen } from "@testing-library/react"
import { RippleBackground } from "./ripple-background"
import { addPressRing, pondSources, ringLayout, waveLayout } from "./ripple-background-layout"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

type Watch = (entries: { isIntersecting: boolean }[]) => void
const watchers: Watch[] = []

beforeEach(() => {
  state.reduced = false
  watchers.length = 0
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Watch) {
        watchers.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const root = () => document.querySelector("[data-slot='ripple-background']") as HTMLElement
const all = (slot: string) => [...document.querySelectorAll<HTMLElement>(`[data-slot='ripple-background-${slot}']`)]

describe("ripple layout", () => {
  it("widens the gaps on the way out and fades each ring further", () => {
    const rings = ringLayout(6, 10, 100, 0.4)
    const sizes = rings.map((ring) => ring.size)
    expect(sizes[0]).toBe(10)
    expect(sizes[5]).toBe(100)
    const gaps = sizes.slice(1).map((size, index) => size - (sizes[index] as number))
    gaps.slice(1).forEach((gap, index) => expect(gap).toBeGreaterThan(gaps[index] as number))
    rings.slice(1).forEach((ring, index) => expect(ring.opacity).toBeLessThan((rings[index] as (typeof rings)[number]).opacity))
    expect(rings[5]?.opacity).toBeCloseTo(0.08)
  })

  it("handles one ring without dividing by zero", () => {
    expect(ringLayout(1, 10, 100, 0.4)).toEqual([{ size: 10, opacity: 0.4 }])
  })

  it("staggers waves evenly, already under way at the first frame", () => {
    const waves = waveLayout(4, 12, 0.5)
    expect(waves.every((wave) => wave.delay < 0)).toBe(true)
    const delays = waves.map((wave) => wave.delay)
    expect(delays[0] as number - (delays[1] as number)).toBeCloseTo(3)
    expect(delays[1] as number - (delays[2] as number)).toBeCloseTo(3)
    expect(waves[0]?.stillOpacity).toBeGreaterThan(waves[3]?.stillOpacity as number)
    expect(Math.max(...waves.map((wave) => wave.stillScale))).toBeLessThanOrEqual(1)
  })

  it("places pond sources from the seed, apart and away from the edges", () => {
    const sources = pondSources(3, 3)
    expect(sources).toEqual(pondSources(3, 3))
    expect(sources).not.toEqual(pondSources(4, 3))
    expect(sources).toHaveLength(3)
    for (const source of sources) {
      expect(source.left).toBeGreaterThanOrEqual(14)
      expect(source.left).toBeLessThanOrEqual(86)
    }
    const [a, b, c] = sources as [(typeof sources)[number], (typeof sources)[number], (typeof sources)[number]]
    expect(Math.hypot(a.left - b.left, a.top - b.top)).toBeGreaterThanOrEqual(26)
    expect(Math.hypot(a.left - c.left, a.top - c.top)).toBeGreaterThanOrEqual(26)
    expect(Math.hypot(b.left - c.left, b.top - c.top)).toBeGreaterThanOrEqual(26)
  })

  it("drops the oldest press ring past the limit, without changing the list it was given", () => {
    const start = Array.from({ length: 6 }, (_, id) => ({ id, x: 0, y: 0 }))
    const next = addPressRing(start, { id: 6, x: 1, y: 1 })
    expect(next.map((ring) => ring.id)).toEqual([1, 2, 3, 4, 5, 6])
    expect(start).toHaveLength(6)
  })
})

describe("RippleBackground", () => {
  it("gives each variant its own structure", () => {
    const shape = (variant: "rings" | "pulse" | "sonar" | "pond") => {
      const { unmount } = render(<RippleBackground variant={variant} />)
      const result = { ring: all("ring").length, wave: all("wave").length, sweep: all("sweep").length, source: all("source").length }
      unmount()
      return result
    }
    expect(shape("rings")).toEqual({ ring: 7, wave: 0, sweep: 0, source: 0 })
    expect(shape("pulse")).toEqual({ ring: 0, wave: 4, sweep: 0, source: 0 })
    expect(shape("sonar")).toEqual({ ring: 5, wave: 0, sweep: 1, source: 0 })
    expect(shape("pond")).toEqual({ ring: 0, wave: 9, sweep: 0, source: 3 })
  })

  it("does not animate or watch anything for the still rings", () => {
    render(<RippleBackground variant="rings" />)
    expect(root()).not.toHaveAttribute("data-playing")
    expect(watchers).toHaveLength(0)
    expect(all("ring").every((ring) => ring.style.animationName === "")).toBe(true)
  })

  it("fades everything before the box edge through a mask and sizes rings from the box", () => {
    render(<RippleBackground variant="pulse" />)
    const layer = document.querySelector("[data-slot='ripple-background-layer']") as HTMLElement
    expect(layer).toHaveClass("[container-type:size]", "pointer-events-none")
    expect(layer).toHaveAttribute("aria-hidden", "true")
    expect(all("wave")[0]?.style.width).toBe("100cqmax")
  })

  it("stops with paused, off screen and turns into still rings under reduced motion", () => {
    const { rerender, unmount } = render(<RippleBackground variant="pulse" paused />)
    expect(root()).toHaveAttribute("data-playing", "false")
    rerender(<RippleBackground variant="pulse" />)
    expect(root()).toHaveAttribute("data-playing", "true")
    act(() => watchers[0]?.([{ isIntersecting: false }]))
    expect(root()).toHaveAttribute("data-playing", "false")
    unmount()

    state.reduced = true
    render(<RippleBackground variant="pulse" />)
    const waves = all("wave")
    expect(root()).not.toHaveAttribute("data-playing")
    expect(waves.every((wave) => wave.style.animationName === "")).toBe(true)
    expect(waves.every((wave) => Number(wave.style.opacity) > 0)).toBe(true)
    expect(new Set(waves.map((wave) => wave.style.transform)).size).toBe(4)
  })

  it("moves only through transform and opacity", () => {
    render(<RippleBackground variant="sonar" effect="press" />)
    const css = [...document.head.querySelectorAll("style[data-href^='mise-ripple-background']")].map((style) => style.textContent).join("")
    const properties = [...css.matchAll(/[{;]([a-z-]+):/g)].map((match) => match[1])
    expect(new Set(properties)).toEqual(new Set(["transform", "opacity"]))
  })

  describe("press", () => {
    const stubBox = () => {
      vi.spyOn(root(), "getBoundingClientRect").mockReturnValue({ left: 100, top: 50, width: 400, height: 200, right: 500, bottom: 250, x: 100, y: 50, toJSON: () => ({}) })
    }

    it("spreads a ring from where the pointer went down and removes it when done", () => {
      render(<RippleBackground effect="press" />)
      stubBox()
      fireEvent.pointerDown(root(), { clientX: 180, clientY: 90, button: 0 })
      const [ring] = all("press")
      expect(ring?.style.left).toBe("80px")
      expect(ring?.style.top).toBe("40px")
      expect(ring?.style.animation).toContain("mise-ripple-press")
      // jsdom has no AnimationEvent, so React listens for the prefixed name here.
      fireEvent(ring as HTMLElement, new Event("webkitAnimationEnd", { bubbles: true }))
      expect(all("press")).toHaveLength(0)
    })

    it("works from touch and from anything on top, and leaves the click alone", () => {
      const onClick = vi.fn()
      const onPointerDown = vi.fn()
      render(
        <RippleBackground effect="press" onPointerDown={onPointerDown}>
          <button onClick={onClick}>Join the call</button>
        </RippleBackground>,
      )
      stubBox()
      const button = screen.getByRole("button", { name: "Join the call" })
      const notCancelled = fireEvent.pointerDown(button, { clientX: 200, clientY: 100, button: 0, pointerType: "touch" })
      expect(notCancelled).toBe(true)
      expect(onPointerDown).toHaveBeenCalledTimes(1)
      expect(all("press")).toHaveLength(1)
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it("ignores other mouse buttons and stays off without the effect", () => {
      const { rerender } = render(<RippleBackground effect="press" />)
      fireEvent.pointerDown(root(), { button: 2 })
      expect(all("press")).toHaveLength(0)
      rerender(<RippleBackground />)
      fireEvent.pointerDown(root(), { button: 0 })
      expect(all("press")).toHaveLength(0)
    })

    it("fades in place without spreading under reduced motion", () => {
      state.reduced = true
      render(<RippleBackground variant="pulse" effect="press" />)
      fireEvent.pointerDown(root(), { button: 0 })
      expect(all("press")[0]?.style.animation).toContain("mise-ripple-press-still")
    })
  })
})
