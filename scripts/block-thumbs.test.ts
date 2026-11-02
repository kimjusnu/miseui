import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function blockNames() {
  return readdirSync(join(root, "registry", "items"))
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""))
    .filter((name) => existsSync(join(root, "registry", "miseui", "blocks", `${name}.tsx`)))
}

describe("block thumbnails", () => {
  it("has a light and a dark capture for every block, because the gallery shows nothing else", () => {
    const missing = blockNames().flatMap((name) =>
      [`${name}.webp`, `${name}-dark.webp`].filter((file) => !existsSync(join(root, "public", "thumbs", file))),
    )
    expect(blockNames().length).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })
})
