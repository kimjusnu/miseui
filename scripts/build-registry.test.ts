import { mergeRegistryItems } from "./build-registry"

const info = { name: "miseui", homepage: "https://miseui.pages.dev" }

describe("mergeRegistryItems", () => {
  it("sorts items by name and wraps them in the registry schema", () => {
    const result = mergeRegistryItems(
      [
        { name: "zeta", type: "registry:ui", files: [] },
        { name: "alpha", type: "registry:ui", files: [] },
      ],
      info,
    )
    expect(result.$schema).toBe("https://ui.shadcn.com/schema/registry.json")
    expect(result.name).toBe("miseui")
    expect(result.items.map((item) => item.name)).toEqual(["alpha", "zeta"])
  })

  it("rejects duplicate names", () => {
    expect(() =>
      mergeRegistryItems(
        [
          { name: "a", type: "registry:ui", files: [] },
          { name: "a", type: "registry:ui", files: [] },
        ],
        info,
      ),
    ).toThrow(/duplicate/i)
  })

  it("does not mutate the input array", () => {
    const items = [
      { name: "b", type: "registry:ui", files: [] },
      { name: "a", type: "registry:ui", files: [] },
    ]
    mergeRegistryItems(items, info)
    expect(items.map((item) => item.name)).toEqual(["b", "a"])
  })
})
