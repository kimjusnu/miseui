import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const blocks = join(process.cwd(), "registry", "miseui", "blocks")
const QUERY = /(^|\s)@[0-9a-z]+:/

/** The class lists written as one string or as one cn() call. */
function classLists(source: string) {
  const strings = source.match(/"[^"\n]*@container[^"\n]*"/g) ?? []
  const calls = source.match(/cn\([^)]*@container[^)]*\)/g) ?? []
  return [...strings, ...calls]
}

describe("block container queries", () => {
  it("never queries the element that is the container, because a container query only sees ancestors", () => {
    const offenders = readdirSync(blocks)
      .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
      .flatMap((file) =>
        classLists(readFileSync(join(blocks, file), "utf8"))
          .filter((list) => QUERY.test(list.replace(/@container/g, "")))
          .map((list) => `${file}: ${list}`),
      )
    expect(offenders).toEqual([])
  })
})
