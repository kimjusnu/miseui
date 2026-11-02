import { readFileSync } from "node:fs"
import { join } from "node:path"
import { DEFAULT_PALETTE, PALETTES, darkVars, lightVars, paletteCss } from "../src/lib/palettes"

// Read from disk: vitest strips CSS imports, including ?raw.
const css = readFileSync(join(process.cwd(), "src", "index.css"), "utf8")

const defaultPalette = PALETTES.find((palette) => palette.name === DEFAULT_PALETTE)!

function block(selector: string) {
  const start = css.indexOf(`${selector} {`)
  return css.slice(start, css.indexOf("}", start))
}

describe("palettes", () => {
  it("keeps index.css identical to the default palette, so the two cannot drift", () => {
    Object.entries(lightVars(defaultPalette)).forEach(([name, value]) => {
      expect(block(":root")).toContain(`--${name}: ${value};`)
    })
    Object.entries(darkVars(defaultPalette)).forEach(([name, value]) => {
      expect(block(".dark")).toContain(`--${name}: ${value};`)
    })
  })

  it("defines the same variables in every palette, so switching never leaves a stale colour", () => {
    const expected = Object.keys(lightVars(defaultPalette)).sort()
    PALETTES.forEach((palette) => {
      expect(Object.keys(lightVars(palette)).sort()).toEqual(expected)
    })
  })

  it("emits dark rules for both the root and nested dark sections, and skips the default", () => {
    const output = paletteCss()
    expect(output).toContain('[data-palette="cobalt"].dark, [data-palette="cobalt"] .dark')
    expect(output).not.toContain(`[data-palette="${DEFAULT_PALETTE}"]`)
  })
})
