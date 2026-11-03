import { act, fireEvent, render, screen } from "@testing-library/react"
import { seededRandom } from "./background-seed"
import { BeamsBackground, type BeamsBackgroundVariant } from "./beams-background"
import { columnLayout, MAX_WASH_OPACITY, rayGradient, rayLayout, travelLayout } from "./beams-background-layout"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

type Watch = (entries: { isIntersecting: boolean }[]) => void
const watchers: Watch[] = []
const disconnect = vi.fn()

beforeEach(() => {
  state.reduced = false
  watchers.length = 0
  disconnect.mockClear()
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Watch) {
        watchers.push(callback)
      }
      observe() {}
      disconnect = disconnect
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const root = () => document.querySelector("[data-slot='beams-background']") as HTMLElement
const layer = () => document.querySelector("[data-slot='beams-background-layer']") as HTMLElement
const count = (slot: string) => document.querySelectorAll(`[data-slot='beams-background-${slot}']`).length

describe("seededRandom", () => {
  it("walks the same numbers from the same seed and stays in range", () => {
    const first = seededRandom(7)
    const second = seededRandom(7)
    const other = seededRandom(8)
    const walk = Array.from({ length: 50 }, () => first())
    expect(walk).toEqual(Array.from({ length: 50 }, () => second()))
    expect(walk).not.toEqual(Array.from({ length: 50 }, () => other()))
    expect(Math.min(...walk)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...walk)).toBeLessThan(1)
  })
})

describe("beams layout", () => {
  it("is the same from the same seed, so a server render hydrates", () => {
    expect(rayLayout(3)).toEqual(rayLayout(3))
    expect(travelLayout(3)).toEqual(travelLayout(3))
    expect(columnLayout(3)).toEqual(columnLayout(3))
    expect(rayLayout(3)).not.toEqual(rayLayout(4))
  })

  it("keeps every wash under the cap that holds muted text at 4.5:1", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      for (const beam of [...rayLayout(seed), ...columnLayout(seed)]) expect(beam.peak).toBeLessThanOrEqual(MAX_WASH_OPACITY)
    }
  })

  it("fans the rays out on both sides of straight down, in order, without overlapping wedges", () => {
    const rays = rayLayout(1)
    expect(rays[0]?.angle).toBeLessThan(-30)
    expect(rays[rays.length - 1]?.angle).toBeGreaterThan(30)
    rays.slice(1).forEach((ray, index) => {
      const previous = rays[index] as (typeof rays)[number]
      expect(ray.angle - ray.spread).toBeGreaterThan(previous.angle)
    })
  })

  it("draws a wedge that starts and ends transparent, around its own angle", () => {
    const gradient = rayGradient({ angle: 10, spread: 4, peak: 0.1, seconds: 8, delay: 0 })
    expect(gradient).toContain("from 186deg at 50% -12%")
    expect(gradient).toMatch(/transparent 0deg, var\(--mise-light\) 4deg, transparent 8deg/)
  })

  it("keeps shafts inside the box and lights away from the edges", () => {
    for (const column of columnLayout(2)) {
      expect(column.top).toBeGreaterThanOrEqual(0)
      expect(column.top + column.height).toBeLessThanOrEqual(100)
      expect(column.left).toBeGreaterThanOrEqual(0)
      expect(column.left + column.width).toBeLessThanOrEqual(104)
    }
    const axes = travelLayout(2).map((travel) => travel.axis)
    expect(axes.filter((axis) => axis === "x")).toHaveLength(3)
    expect(axes.filter((axis) => axis === "y")).toHaveLength(3)
    for (const travel of travelLayout(2)) {
      expect(travel.still).toBeLessThan(0)
      expect(travel.still).toBeGreaterThan(-100)
    }
  })
})

describe("BeamsBackground", () => {
  it("puts children above a hidden, click-through layer", async () => {
    const onClick = vi.fn()
    render(
      <BeamsBackground className="h-50">
        <button onClick={onClick}>Create a project</button>
      </BeamsBackground>,
    )
    expect(root()).toHaveClass("relative", "isolate", "overflow-clip", "h-50")
    expect(layer()).toHaveAttribute("aria-hidden", "true")
    expect(layer()).toHaveClass("pointer-events-none", "absolute", "inset-0", "rounded-[inherit]")
    expect(screen.getByRole("button", { name: "Create a project" }).parentElement).toHaveClass("relative")
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("never sets a viewport height", () => {
    render(<BeamsBackground />)
    expect(root().className).not.toMatch(/h-screen|min-h-screen|vh/)
  })

  it("gives each variant its own structure", () => {
    const structure = (variant: BeamsBackgroundVariant) => {
      const { unmount } = render(<BeamsBackground variant={variant} />)
      const shape = { ray: count("ray"), light: count("light"), grid: count("grid"), band: count("band"), column: count("column") }
      expect(root()).toHaveAttribute("data-variant", variant)
      unmount()
      return shape
    }
    expect(structure("rays")).toEqual({ ray: 7, light: 0, grid: 0, band: 0, column: 0 })
    expect(structure("lines")).toEqual({ ray: 0, light: 6, grid: 1, band: 0, column: 0 })
    expect(structure("sweep")).toEqual({ ray: 0, light: 0, grid: 0, band: 1, column: 0 })
    expect(structure("columns")).toEqual({ ray: 0, light: 0, grid: 0, band: 0, column: 13 })
  })

  it("carries its keyframes with it, without an inline animation shorthand that would reset the play state", () => {
    render(<BeamsBackground variant="sweep" />)
    const band = document.querySelector("[data-slot='beams-background-band']") as HTMLElement
    expect(document.head.querySelector("style[data-href='mise-beams-background']")?.textContent).toContain("@keyframes mise-beam-sweep")
    expect(band.style.animationName).toBe("mise-beam-sweep")
    expect(band.getAttribute("style")).toContain("animation-play-state")
  })

  it("only moves transform and opacity", () => {
    render(<BeamsBackground />)
    const css = document.head.querySelector("style[data-href='mise-beams-background']")?.textContent ?? ""
    const properties = [...css.matchAll(/[{;]([a-z-]+):/g)].map((match) => match[1])
    expect(new Set(properties)).toEqual(new Set(["transform", "opacity"]))
  })

  it("stops with the paused prop", () => {
    const { rerender } = render(<BeamsBackground paused />)
    expect(root()).toHaveAttribute("data-playing", "false")
    expect(layer().style.getPropertyValue("--mise-bg-play")).toBe("paused")
    rerender(<BeamsBackground />)
    expect(root()).toHaveAttribute("data-playing", "true")
    expect(layer().style.getPropertyValue("--mise-bg-play")).toBe("running")
  })

  it("stops off screen and in a hidden tab, and lets go on unmount", () => {
    const { unmount } = render(<BeamsBackground />)
    act(() => watchers[0]?.([{ isIntersecting: false }]))
    expect(root()).toHaveAttribute("data-playing", "false")
    act(() => watchers[0]?.([{ isIntersecting: true }]))
    expect(root()).toHaveAttribute("data-playing", "true")
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    fireEvent(document, new Event("visibilitychange"))
    expect(root()).toHaveAttribute("data-playing", "false")
    hidden.mockRestore()
    fireEvent(document, new Event("visibilitychange"))
    expect(root()).toHaveAttribute("data-playing", "true")
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })

  it("draws a still, finished frame under reduced motion and with the still effect", () => {
    const stillFrame = (props: React.ComponentProps<typeof BeamsBackground>) => {
      const { unmount } = render(<BeamsBackground variant="lines" {...props} />)
      expect(root()).not.toHaveAttribute("data-playing")
      expect(watchers).toHaveLength(0)
      const lights = [...document.querySelectorAll<HTMLElement>("[data-slot='beams-background-light']")]
      expect(lights).toHaveLength(6)
      for (const light of lights) {
        expect(light.style.animationName).toBe("")
        expect(Number(light.style.opacity)).toBeGreaterThan(0.5)
        expect(light.style.transform).toMatch(/^translate[XY]\(-\d/)
      }
      unmount()
    }
    stillFrame({ effect: "still" })
    state.reduced = true
    stillFrame({})
  })

  it("passes attributes through", () => {
    render(<BeamsBackground data-testid="hero" id="hero" />)
    expect(screen.getByTestId("hero")).toHaveAttribute("id", "hero")
    expect(screen.getByTestId("hero")).toHaveAttribute("data-effect", "flow")
  })
})
