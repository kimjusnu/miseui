import { fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { MESH_BLOBS, MeshBackground, type MeshBackgroundVariant } from "./mesh-background"

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

const root = () => document.querySelector("[data-slot='mesh-background']") as HTMLElement
const layer = () => document.querySelector("[data-slot='mesh-background-layer']") as HTMLElement
const blobs = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='mesh-background-blob']"))
const split = () => document.querySelector("[data-slot='mesh-background-split']") as HTMLElement
// jsdom drops a background-image holding var(), so what the browser receives is read from the server markup.
const markup = (element: React.ReactElement) => renderToString(element)

describe("MeshBackground", () => {
  it("draws one hidden layer behind and keeps the content outside it", () => {
    render(
      <MeshBackground className="h-48">
        <button type="button">Start</button>
      </MeshBackground>,
    )
    expect(root()).toHaveClass("relative", "isolate", "overflow-clip", "h-48")
    expect(layer()).toHaveAttribute("aria-hidden", "true")
    expect(layer()).toHaveClass("pointer-events-none")
    expect(layer().contains(screen.getByRole("button", { name: "Start" }))).toBe(false)
  })

  it("draws a different structure for each variant", () => {
    const counts: Record<MeshBackgroundVariant, number> = { soft: 3, vivid: 4, corner: 2, split: 0 }
    for (const variant of Object.keys(counts) as MeshBackgroundVariant[]) {
      const { unmount } = render(<MeshBackground variant={variant} />)
      expect(blobs()).toHaveLength(counts[variant])
      expect(split() === null).toBe(variant !== "split")
      unmount()
    }
  })

  it("keeps soft well below vivid", () => {
    const peak = (variant: "soft" | "vivid") => Math.max(...MESH_BLOBS[variant].map((blob) => blob.opacity))
    expect(peak("soft")).toBeLessThanOrEqual(0.14)
    expect(peak("vivid")).toBeGreaterThan(peak("soft") * 2)
  })

  it("keeps corner colour in the top right, and the rest clean", () => {
    for (const { box } of MESH_BLOBS.corner) {
      const [left, top, width, height] = box
      expect(left + width / 2).toBeGreaterThan(50)
      expect(top + height / 2).toBeLessThan(50)
    }
  })

  it("fades every blob to nothing at its own box, with no filter to pay for", () => {
    const html = markup(<MeshBackground variant="vivid" />)
    expect(html.match(/radial-gradient\(closest-side,var\(--mise-mesh-\d\),transparent\)/g)).toHaveLength(4)
    expect(html).not.toContain("filter:")
    expect(html).not.toContain("blur")
  })

  it("makes split a single diagonal, larger than the box so a drift never shows its edge", () => {
    expect(markup(<MeshBackground variant="split" />)).toContain("linear-gradient(115deg in oklab,var(--mise-mesh-1) 25%,var(--mise-mesh-3) 75%)")
    render(<MeshBackground variant="split" />)
    expect(split().style.inset).toBe("-20%")
  })

  it("walks hues away from yellow, clamps lightness per theme, and falls back to the plain accent", () => {
    render(<MeshBackground />)
    const classes = layer().className
    expect(classes).toContain("[--mise-mesh-1:var(--mise)]")
    expect(classes).toContain("calc(h_+_40_*_sin((h_-_100)_*_1deg))")
    expect(classes).toContain("calc(h_+_80_*_sin((h_-_100)_*_1deg))")
    expect(classes).toContain("supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-1:oklch(from_var(--mise)_clamp(0.62,l,0.78)_c_h)]")
    expect(classes).toContain("dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-1:oklch(from_var(--mise)_clamp(0.5,l,0.66)_c_h)]")
  })

  it("stands still unless asked", () => {
    render(<MeshBackground variant="vivid" />)
    expect(blobs().every((blob) => blob.style.animationName === "")).toBe(true)
    expect(root()).not.toHaveAttribute("data-playing")
    expect(markup(<MeshBackground variant="vivid" />)).not.toContain("@keyframes")
  })

  it("drifts by transform at a different pace per blob, and carries its keyframes", () => {
    render(<MeshBackground variant="vivid" effect="drift" />)
    const names = blobs().map((blob) => blob.style.animationName)
    expect(names.slice(0, 3)).toEqual(["mise-mesh-a", "mise-mesh-b", "mise-mesh-c"])
    expect(new Set(blobs().slice(0, 3).map((blob) => blob.style.animationDuration)).size).toBe(3)
    expect(blobs()[0].style.animationPlayState).toBe("running")
    const html = markup(<MeshBackground variant="vivid" effect="drift" />)
    const keyframes = html.slice(html.indexOf("@keyframes"), html.indexOf("</style>"))
    expect(keyframes).toContain("@keyframes mise-mesh-a")
    expect(keyframes).toContain("transform:translate")
    expect(keyframes).not.toMatch(/filter|mask|background-position/)
  })

  it("holds the drift when paused, off screen and in a hidden tab", () => {
    const { rerender } = render(<MeshBackground effect="drift" paused />)
    expect(blobs()[0].style.animationPlayState).toBe("paused")
    expect(root()).toHaveAttribute("data-playing", "false")
    rerender(<MeshBackground effect="drift" />)
    expect(blobs()[0].style.animationPlayState).toBe("running")

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    fireEvent(document, new Event("visibilitychange"))
    expect(blobs()[0].style.animationPlayState).toBe("paused")
    hidden.mockRestore()
    fireEvent(document, new Event("visibilitychange"))
    expect(blobs()[0].style.animationPlayState).toBe("running")

    state.inView = false
    rerender(<MeshBackground effect="drift" />)
    expect(blobs()[0].style.animationPlayState).toBe("paused")
  })

  it("draws the same finished picture under reduced motion", () => {
    state.reduced = true
    render(<MeshBackground variant="vivid" effect="drift" />)
    expect(blobs()).toHaveLength(4)
    expect(blobs().every((blob) => blob.style.animationName === "" && blob.style.opacity !== "")).toBe(true)
    expect(root()).not.toHaveAttribute("data-playing")
  })

  it("drifts split too", () => {
    render(<MeshBackground variant="split" effect="drift" />)
    expect(split().style.animationName).toBe("mise-mesh-a")
  })

  it("renders the same markup twice, so a server render hydrates", () => {
    expect(renderToString(<MeshBackground variant="vivid" />)).toBe(renderToString(<MeshBackground variant="vivid" />))
  })

  it("steps aside for forced colours and high contrast", () => {
    render(<MeshBackground />)
    expect(layer()).toHaveClass("forced-colors:hidden", "contrast-more:hidden")
  })
})
