import { act, render, screen } from "@testing-library/react"
import { MeteorsBackground } from "./meteors-background"
import { glintLayout, MAX_COUNT, meteorCount, starLayout, streakLayout } from "./meteors-background-layout"

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

const root = () => document.querySelector("[data-slot='meteors-background']") as HTMLElement
const all = (slot: string) => [...document.querySelectorAll<HTMLElement>(`[data-slot='meteors-background-${slot}']`)]

describe("meteors layout", () => {
  it("clamps the count to a ceiling per variant and rejects nonsense", () => {
    expect(meteorCount("meteors")).toBe(8)
    expect(meteorCount("meteors", 3)).toBe(3)
    expect(meteorCount("meteors", 5000)).toBe(MAX_COUNT.meteors)
    expect(meteorCount("rain", 5000)).toBe(MAX_COUNT.rain)
    expect(meteorCount("comets", -4)).toBe(0)
    expect(meteorCount("stars", Number.NaN)).toBe(36)
  })

  it("is the same from the same seed, so a server render hydrates", () => {
    expect(streakLayout("meteors", 3)).toEqual(streakLayout("meteors", 3))
    expect(starLayout(3)).toEqual(starLayout(3))
    expect(glintLayout(3)).toEqual(glintLayout(3))
    expect(streakLayout("meteors", 3)).not.toEqual(streakLayout("meteors", 4))
  })

  it("never comes close to a stream, even at the ceiling", () => {
    const arrivalsPerSecond = (variant: "meteors" | "rain" | "comets") =>
      streakLayout(variant, 1, MAX_COUNT[variant]).reduce((sum, streak) => sum + 1 / streak.seconds, 0)
    expect(arrivalsPerSecond("meteors")).toBeLessThan(2.5)
    expect(arrivalsPerSecond("comets")).toBeLessThan(0.4)
    expect(arrivalsPerSecond("rain")).toBeLessThan(13)
  })

  it("makes rain vertical and fainter, comets longer and slower than meteors", () => {
    const meteors = streakLayout("meteors", 1)
    const rain = streakLayout("rain", 1)
    const comets = streakLayout("comets", 1)
    const longest = (list: typeof meteors) => Math.max(...list.map((streak) => streak.length))
    const shortest = (list: typeof meteors) => Math.min(...list.map((streak) => streak.length))
    expect(rain.every((streak) => streak.angle === 90 && streak.peak <= 0.3)).toBe(true)
    expect(meteors.every((streak) => streak.angle !== 90)).toBe(true)
    expect(shortest(comets)).toBeGreaterThan(longest(meteors))
    expect(Math.min(...comets.map((streak) => streak.seconds))).toBeGreaterThan(Math.max(...meteors.map((streak) => streak.seconds)))
  })

  it("places every still-frame streak and star inside the box", () => {
    for (const streak of streakLayout("meteors", 5)) {
      expect(streak.stillLeft).toBeGreaterThanOrEqual(0)
      expect(streak.stillLeft).toBeLessThanOrEqual(100)
      expect(streak.stillTop).toBeGreaterThanOrEqual(0)
      expect(streak.stillTop).toBeLessThanOrEqual(100)
    }
    for (const star of starLayout(5)) {
      expect(star.left).toBeGreaterThan(0)
      expect(star.left).toBeLessThan(100)
    }
  })
})

describe("MeteorsBackground", () => {
  it("keeps the content above a hidden layer", () => {
    render(
      <MeteorsBackground>
        <button>Save my seat</button>
      </MeteorsBackground>,
    )
    const layer = document.querySelector("[data-slot='meteors-background-layer']")
    expect(layer).toHaveAttribute("aria-hidden", "true")
    expect(layer).toHaveClass("pointer-events-none")
    expect(screen.getByRole("button", { name: "Save my seat" }).closest("[aria-hidden]")).toBeNull()
  })

  it("gives each variant its own structure", () => {
    const shape = (variant: "meteors" | "rain" | "comets" | "stars") => {
      const { unmount } = render(<MeteorsBackground variant={variant} />)
      const result = { streak: all("streak").length, head: all("head").length, star: all("star").length }
      unmount()
      return result
    }
    expect(shape("meteors")).toEqual({ streak: 8, head: 0, star: 0 })
    expect(shape("rain")).toEqual({ streak: 26, head: 0, star: 0 })
    expect(shape("comets")).toEqual({ streak: 3, head: 3, star: 0 })
    expect(shape("stars")).toEqual({ streak: 1, head: 0, star: 36 })
  })

  it("respects the count prop and its ceiling", () => {
    const { rerender } = render(<MeteorsBackground count={3} />)
    expect(all("streak")).toHaveLength(3)
    rerender(<MeteorsBackground count={9999} />)
    expect(all("streak")).toHaveLength(MAX_COUNT.meteors)
  })

  it("moves only through transform and opacity", () => {
    render(<MeteorsBackground />)
    const css = document.head.querySelector("style[data-href='mise-meteors-background']")?.textContent ?? ""
    const properties = [...css.matchAll(/[{;]([a-z-]+):/g)].map((match) => match[1])
    expect(new Set(properties)).toEqual(new Set(["transform", "opacity"]))
  })

  it("stops with paused and off screen", () => {
    const { rerender } = render(<MeteorsBackground paused />)
    expect(root()).toHaveAttribute("data-playing", "false")
    rerender(<MeteorsBackground />)
    expect(root()).toHaveAttribute("data-playing", "true")
    act(() => watchers[0]?.([{ isIntersecting: false }]))
    expect(root()).toHaveAttribute("data-playing", "false")
  })

  it("draws visible streaks with no animation under reduced motion", () => {
    state.reduced = true
    render(<MeteorsBackground />)
    expect(root()).not.toHaveAttribute("data-playing")
    for (const streak of all("streak")) {
      expect(streak.style.animationName).toBe("")
      expect(streak.style.transform).toBe("rotate(125deg)")
      expect(Number(streak.style.opacity)).toBeGreaterThan(0.3)
      expect(parseFloat(streak.style.top)).toBeGreaterThan(0)
    }
  })

  it("keeps the still sky lit with the still effect", () => {
    render(<MeteorsBackground variant="stars" effect="still" />)
    const stars = all("star")
    expect(stars).toHaveLength(36)
    expect(stars.every((star) => Number(star.style.opacity) > 0)).toBe(true)
    expect(all("streak")).toHaveLength(1)
  })
})
