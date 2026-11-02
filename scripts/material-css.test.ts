import { readFileSync } from "node:fs"
import { join } from "node:path"
import { themeItem } from "./build-registry"
import { PALETTES } from "../src/lib/palettes"

/**
 * Regression: with a hand-written -webkit-backdrop-filter after the standard property, Lightning CSS kept only
 * the prefixed one, and Chrome ignored it. The header was see-through with no blur, and nothing failed.
 */
describe("material utility", () => {
  it("declares only the standard backdrop-filter in the site stylesheet", () => {
    const css = readFileSync(join(process.cwd(), "src", "index.css"), "utf8")
    expect(css).toContain("backdrop-filter: blur(20px)")
    expect(css).not.toContain("-webkit-backdrop-filter")
  })

  it("declares only the standard backdrop-filter in the installed theme", () => {
    const css = themeItem(PALETTES[0]).css as Record<string, Record<string, string>>
    expect(css["@utility material"]["backdrop-filter"]).toBeDefined()
    expect(css["@utility material"]["-webkit-backdrop-filter"]).toBeUndefined()
  })
})
