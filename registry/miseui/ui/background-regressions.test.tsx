import { renderToString } from "react-dom/server"
import { AuroraBackground } from "./aurora-background"
import { BeamsBackground } from "./beams-background"
import { halftoneBuckets } from "./dot-background"
import { MeshBackground } from "./mesh-background"
import { NoiseBackground } from "./noise-background"
import { RippleBackground } from "./ripple-background"

/** Defects found by looking at the wave in a real browser: every one of these passed its tests and still looked wrong. */

function dots(width: number, height: number) {
  return halftoneBuckets(width, height).flatMap((bucket) =>
    Array.from(bucket.path.matchAll(/M([\d.]+) ([\d.]+)h0/g), (match) => ({ x: Number(match[1]), y: Number(match[2]), radius: bucket.radius })),
  )
}

describe("the sentence on top wins", () => {
  it("keeps halftone dots out of the middle, where text sits", () => {
    const width = 376
    const height = 200
    const inMiddle = dots(width, height).filter(({ x, y }) => x > width * 0.2 && x < width * 0.6 && y > height * 0.25 && y < height * 0.75)
    expect(inMiddle).toEqual([])
    expect(dots(width, height).length).toBeGreaterThan(20)
  })

  it("draws a faint grid under moving lights, because a grid line crosses the text", () => {
    const html = renderToString(<BeamsBackground variant="lines" effect="still" />)
    expect(html).toMatch(/data-slot="beams-background-grid"[^>]*opacity:0\.[0-6]/)
  })

  it("holds the halo below shouting strength", () => {
    expect(renderToString(<AuroraBackground variant="halo" />)).toContain("opacity-35")
  })
})

describe("noise reads as texture, not as a pattern", () => {
  const decoded = (variant: "grain" | "paper") => decodeURIComponent(renderToString(<NoiseBackground variant={variant} />)).replaceAll("&#x27;", "'")

  it("keeps paper fine, because a low frequency draws blotches like an animal print", () => {
    const frequency = decoded("paper").match(/baseFrequency='([\d.]+) ([\d.]+)'/)
    expect(frequency).not.toBeNull()
    expect(Number(frequency?.[1])).toBeGreaterThanOrEqual(0.6)
  })

  it("keeps grain at a strength that tints the surface instead of greying it", () => {
    const html = renderToString(<NoiseBackground variant="grain" />)
    expect(html).toContain("opacity-[0.05]")
    expect(html).not.toContain("opacity-[0.09]")
  })
})

describe("aurora curtains", () => {
  it("are wide and overlapping, because narrow ellipses hanging from an edge read as icicles", () => {
    const html = renderToString(<AuroraBackground variant="curtain" />)
    const widths = Array.from(html.matchAll(/aurora-background-band"[^>]*width:(\d+)%/g), (match) => Number(match[1]))
    expect(widths.length).toBeGreaterThan(0)
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(30)
  })
})

describe("spreading rings", () => {
  it("are soft bands, because a hairline scaled down by the compositor breaks into dashes", () => {
    const html = renderToString(<RippleBackground variant="pulse" />)
    const waves = html.match(/<span[^>]*ripple-background-wave[^>]*>/g) ?? []
    expect(waves.length).toBeGreaterThan(0)
    waves.forEach((wave) => {
      expect(wave).toContain("radial-gradient(closest-side")
      expect(wave).not.toContain("border")
    })
  })
})

describe("mesh in dark", () => {
  it("sits back, because a dark warm tone at full strength turns to brown", () => {
    expect(renderToString(<MeshBackground variant="split" />)).toContain("dark:opacity-70")
  })
})
