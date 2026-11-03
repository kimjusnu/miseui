import { fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { AuroraBackground } from "./aurora-background"

const state = vi.hoisted(() => ({ reduced: false, inView: true }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

beforeEach(() => {
  state.reduced = false
  state.inView = true
})

const root = () => document.querySelector("[data-slot='aurora-background']") as HTMLElement
const layer = () => document.querySelector("[data-slot='aurora-background-layer']") as HTMLElement
const bands = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='aurora-background-band']"))
const halo = () => document.querySelector("[data-slot='aurora-background-halo']") as HTMLElement
const ribbon = () => document.querySelector("[data-slot='aurora-background-ribbon']") as HTMLElement
// jsdom drops a background-image holding var(), so what the browser receives is read from the server markup.
const markup = (element: React.ReactElement) => renderToString(element)

describe("AuroraBackground", () => {
  it("draws one hidden layer behind and keeps the content outside it", () => {
    render(
      <AuroraBackground className="h-48">
        <button type="button">Begin</button>
      </AuroraBackground>,
    )
    expect(root()).toHaveClass("relative", "isolate", "overflow-clip", "h-48")
    expect(layer()).toHaveAttribute("aria-hidden", "true")
    expect(layer()).toHaveClass("pointer-events-none")
    expect(layer().contains(screen.getByRole("button", { name: "Begin" }))).toBe(false)
  })

  it("draws a different structure for each variant", () => {
    const { rerender } = render(<AuroraBackground variant="curtain" />)
    expect(bands()).toHaveLength(5)
    expect(halo()).toBeNull()
    rerender(<AuroraBackground variant="horizon" />)
    expect(bands()).toHaveLength(3)
    rerender(<AuroraBackground variant="halo" />)
    expect(bands()).toHaveLength(0)
    expect(halo()).not.toBeNull()
    expect(markup(<AuroraBackground variant="halo" />)).toContain("conic-gradient(from 20deg in oklab,var(--mise-aurora-1)")
    rerender(<AuroraBackground variant="ribbon" />)
    expect(halo()).toBeNull()
    expect(ribbon().style.maskImage).toContain("linear-gradient")
  })

  it("hangs curtains from the top: taller than wide, anchored at the top edge", () => {
    render(<AuroraBackground variant="curtain" />)
    for (const band of bands()) {
      expect(band.style.top).toBe("0px")
      expect(band.style.bottom).toBe("")
      expect(parseFloat(band.style.height)).toBeGreaterThan(parseFloat(band.style.width))
    }
    expect(markup(<AuroraBackground variant="curtain" />).match(/radial-gradient\(50% 100% at 50% 0%,/g)).toHaveLength(5)
  })

  it("raises horizon from the bottom edge, wider than tall", () => {
    render(<AuroraBackground variant="horizon" />)
    for (const band of bands()) {
      expect(band.style.bottom).toBe("0px")
      expect(band.style.top).toBe("")
      expect(band.style.transformOrigin).toBe("50% 100%")
    }
    expect(markup(<AuroraBackground variant="horizon" />).match(/radial-gradient\(50% 100% at 50% 100%,/g)).toHaveLength(3)
    expect(parseFloat(bands()[0].style.width)).toBeGreaterThan(100)
  })

  it("ends the halo inside its own box, sized from the shorter side, so it fades before the edge", () => {
    render(<AuroraBackground variant="halo" />)
    expect(halo().style.maskImage).toContain("closest-side")
    expect(halo().style.maskImage).toContain("transparent 100%")
    expect(halo().parentElement).toHaveClass("size-[96cqmin]")
  })

  it("makes the ribbon longer than the box and tilted, so its ends never show", () => {
    render(<AuroraBackground variant="ribbon" />)
    expect(ribbon().parentElement).toHaveClass("w-[180%]", "-rotate-[16deg]")
  })

  it("walks hues away from yellow, clamps lightness per theme, and falls back to the plain accent", () => {
    render(<AuroraBackground />)
    const classes = layer().className
    expect(classes).toContain("[--mise-aurora-1:var(--mise)]")
    expect(classes).toContain("calc(h_+_40_*_sin((h_-_100)_*_1deg))")
    expect(classes).toContain("calc(h_+_80_*_sin((h_-_100)_*_1deg))")
    expect(classes).toContain("dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-aurora-1:oklch(from_var(--mise)_clamp(0.5,l,0.68)_c_h)]")
  })

  it("stands still unless asked", () => {
    render(<AuroraBackground />)
    expect(bands().every((band) => band.style.animationName === "")).toBe(true)
    expect(root()).not.toHaveAttribute("data-playing")
    expect(markup(<AuroraBackground />)).not.toContain("@keyframes")
  })

  it("sways each band by transform and carries its keyframes", () => {
    render(<AuroraBackground effect="drift" />)
    expect(bands()[0].style.animationName).toBe("mise-aurora-sway-a")
    expect(bands()[1].style.animationName).toBe("mise-aurora-sway-b")
    expect(new Set(bands().map((band) => band.style.animationDuration)).size).toBe(5)
    const html = markup(<AuroraBackground effect="drift" />)
    const keyframes = html.slice(html.indexOf("@keyframes"), html.indexOf("</style>"))
    expect(keyframes).toContain("@keyframes mise-aurora-sway-a")
    expect(keyframes).not.toMatch(/filter|mask|background-position/)
  })

  it("turns the halo at a steady pace with no way back", () => {
    render(<AuroraBackground variant="halo" effect="drift" />)
    expect(halo().style.animationName).toBe("mise-aurora-turn")
    expect(halo().style.animationTimingFunction).toBe("linear")
    expect(halo().style.animationDirection).toBe("normal")
  })

  it("leaves no animation properties on a still halo", () => {
    render(<AuroraBackground variant="halo" />)
    expect(halo().style.animationName).toBe("")
    expect(halo().style.animationTimingFunction).toBe("")
  })

  it("slides the ribbon along its length", () => {
    render(<AuroraBackground variant="ribbon" effect="drift" />)
    expect(ribbon().style.animationName).toBe("mise-aurora-slide")
  })

  it("holds the drift when paused, off screen and in a hidden tab", () => {
    const { rerender } = render(<AuroraBackground effect="drift" paused />)
    expect(bands()[0].style.animationPlayState).toBe("paused")
    expect(root()).toHaveAttribute("data-playing", "false")
    rerender(<AuroraBackground effect="drift" />)
    expect(bands()[0].style.animationPlayState).toBe("running")

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    fireEvent(document, new Event("visibilitychange"))
    expect(bands()[0].style.animationPlayState).toBe("paused")
    hidden.mockRestore()
    fireEvent(document, new Event("visibilitychange"))
    expect(bands()[0].style.animationPlayState).toBe("running")

    state.inView = false
    rerender(<AuroraBackground effect="drift" />)
    expect(bands()[0].style.animationPlayState).toBe("paused")
  })

  it("draws the same finished picture under reduced motion", () => {
    state.reduced = true
    render(<AuroraBackground effect="drift" />)
    expect(bands()).toHaveLength(5)
    expect(bands().every((band) => band.style.animationName === "" && band.style.opacity !== "")).toBe(true)
  })

  it("renders the same markup twice, so a server render hydrates", () => {
    expect(renderToString(<AuroraBackground variant="halo" />)).toBe(renderToString(<AuroraBackground variant="halo" />))
  })

  it("steps aside for forced colours and high contrast", () => {
    render(<AuroraBackground />)
    expect(layer()).toHaveClass("forced-colors:hidden", "contrast-more:hidden")
  })
})
