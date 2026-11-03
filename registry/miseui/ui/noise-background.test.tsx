import { render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { NoiseBackground, noiseTile, type NoiseBackgroundVariant } from "./noise-background"

const VARIANTS: readonly NoiseBackgroundVariant[] = ["grain", "paper", "tint", "speckle"]
const TILE = { frequency: "0.8", octaves: 2, slope: 3.5, intercept: -1.25, size: 220, seed: 3 }

const root = () => document.querySelector("[data-slot='noise-background']") as HTMLElement
const layer = () => document.querySelector("[data-slot='noise-background-layer']") as HTMLElement
const films = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='noise-background-film']"))
const svgOf = (url: string) => decodeURIComponent(url.replace(/^url\("data:image\/svg\+xml,/, "").replace(/"\)$/, ""))

describe("noiseTile", () => {
  it("makes a self-contained data URI with nothing that would end the url early", () => {
    const url = noiseTile(TILE)
    expect(url.startsWith('url("data:image/svg+xml,')).toBe(true)
    const inner = url.slice(5, -2)
    expect(inner).not.toMatch(/[#"<>\s]/)
  })

  it("stitches the tile and sizes it, so repeats have no seam", () => {
    const svg = svgOf(noiseTile(TILE))
    expect(svg).toContain("stitchTiles='stitch'")
    expect(svg).toContain("width='220'")
    expect(svg).toContain("baseFrequency='0.8'")
    expect(svg).toContain("type='fractalNoise'")
  })

  it("puts the noise in the alpha channel only, so one image serves both themes", () => {
    const svg = svgOf(noiseTile(TILE))
    expect(svg).toContain("values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.5 -1.25'")
  })

  it("is the same every time, so a server render hydrates", () => {
    expect(noiseTile(TILE)).toBe(noiseTile(TILE))
    expect(renderToString(<NoiseBackground />)).toBe(renderToString(<NoiseBackground />))
  })
})

describe("NoiseBackground", () => {
  it("draws one hidden layer behind and keeps the content outside it", () => {
    render(
      <NoiseBackground className="h-48">
        <button type="button">Read the note</button>
      </NoiseBackground>,
    )
    expect(root()).toHaveClass("relative", "isolate", "overflow-clip", "h-48")
    expect(layer()).toHaveAttribute("aria-hidden", "true")
    expect(layer()).toHaveClass("pointer-events-none")
    expect(layer().contains(screen.getByRole("button", { name: "Read the note" }))).toBe(false)
  })

  it("builds each variant from different layers", () => {
    const shape = (variant: NoiseBackgroundVariant) => {
      const { unmount } = render(<NoiseBackground variant={variant} />)
      const result = films().map((film) => `${film.className}|${film.style.maskImage}`).join("\n")
      const count = films().length
      unmount()
      return { result, count }
    }
    const shapes = VARIANTS.map(shape)
    expect(new Set(shapes.map((entry) => entry.result)).size).toBe(4)
    expect(shapes[0].count).toBe(1)
    expect(shapes[1].count).toBe(2)
    expect(shapes[2].count).toBe(2)
    expect(shapes[3].count).toBe(2)
  })

  it("keeps grain fine and flecks sparse: higher frequency, and a threshold only for speckle", () => {
    const { unmount } = render(<NoiseBackground variant="grain" />)
    const grain = svgOf(films()[0].style.maskImage)
    unmount()
    render(<NoiseBackground variant="speckle" />)
    const speckle = svgOf(films()[0].style.maskImage)
    expect(grain).toContain("baseFrequency='0.8'")
    expect(speckle).toContain("baseFrequency='0.14'")
    expect(speckle).toContain("14 -10.2")
  })

  it("washes tint in the soft accent and leaves a second colour for speckle", () => {
    const { unmount } = render(<NoiseBackground variant="tint" />)
    expect(films()[0].className).toContain("var(--mise-soft)")
    expect(films()[0].style.maskImage).toBeFalsy()
    unmount()
    render(<NoiseBackground variant="speckle" />)
    expect(films()[1]).toHaveClass("bg-mise")
  })

  it("makes paper warm from the page colour only where relative colour works", () => {
    render(<NoiseBackground variant="paper" />)
    expect(films()[0].className).toContain("supports-[color:oklch(from_red_l_c_h)]:bg-[color:oklch(from_var(--background)")
    expect(films()[0].className).not.toMatch(/(^|\s)bg-\[/)
  })

  it("has no motion anywhere", () => {
    for (const variant of VARIANTS) {
      const { unmount } = render(<NoiseBackground variant={variant} />)
      expect(root().outerHTML).not.toContain("animate")
      expect(root()).not.toHaveAttribute("data-effect")
      unmount()
    }
  })

  it("steps aside for forced colours and high contrast", () => {
    render(<NoiseBackground />)
    expect(layer()).toHaveClass("forced-colors:hidden", "contrast-more:hidden")
  })
})
