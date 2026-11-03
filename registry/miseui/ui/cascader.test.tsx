import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Cascader, type CascaderOption, type CascaderProps } from "./cascader"
import {
  checkStateOf,
  columnsFor,
  enabledIndex,
  labelsFor,
  leavesOf,
  resolveOptions,
  searchLeaves,
  toggleLeaves,
  treeKeyAction,
} from "./cascader-math"

const OPTIONS: readonly CascaderOption[] = [
  {
    value: "asia",
    label: "Asia",
    children: [
      {
        value: "korea",
        label: "Korea",
        children: [
          { value: "seoul", label: "Seoul" },
          { value: "busan", label: "Busan" },
        ],
      },
      { value: "japan", label: "Japan", disabled: true },
      { value: "india", label: "India", children: [{ value: "delhi", label: "Delhi" }] },
    ],
  },
  { value: "europe", label: "Europe", children: [{ value: "lisbon", label: "Lisbon" }] },
  { value: "other", label: "Other" },
]

const originalMatchMedia = window.matchMedia
let narrow = false

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query.includes("max-width") ? narrow : false
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

afterEach(() => {
  narrow = false
})

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const place = (props: Partial<CascaderProps> = {}) => render(<Cascader aria-label="Place" options={OPTIONS} {...(props as object)} />)
const row = (name: string) => screen.getByRole("treeitem", { name })
const openPanel = (user: ReturnType<typeof setup>) => user.click(screen.getByRole("button", { name: /^Place/ }))

describe("cascader maths", () => {
  it("builds columns along the active path and stops at a missing value", () => {
    expect(columnsFor(OPTIONS, []).map((column) => column.level)).toEqual([0])
    expect(columnsFor(OPTIONS, ["asia", "korea"]).map((column) => column.options.length)).toEqual([3, 3, 2])
    expect(columnsFor(OPTIONS, ["asia", "gone"])).toHaveLength(2)
  })

  it("reads labels, falling back to the raw value before a lazy parent has loaded", () => {
    expect(labelsFor(OPTIONS, ["asia", "korea", "seoul"])).toEqual(["Asia", "Korea", "Seoul"])
    expect(labelsFor(OPTIONS, ["asia", "nope"])).toEqual(["Asia", "nope"])
  })

  it("merges loaded children without touching the original", () => {
    const lazy: readonly CascaderOption[] = [{ value: "a", label: "A", lazy: true }]
    const resolved = resolveOptions(lazy, { '["a"]': [{ value: "b", label: "B" }] })
    expect(resolved[0].children?.[0].label).toBe("B")
    expect(lazy[0].children).toBeUndefined()
  })

  it("finds enabled leaves, skipping disabled branches and unloaded lazy ones", () => {
    expect(leavesOf(OPTIONS[0], ["asia"])).toEqual([
      ["asia", "korea", "seoul"],
      ["asia", "korea", "busan"],
      ["asia", "india", "delhi"],
    ])
    expect(leavesOf({ value: "x", label: "X", lazy: true }, ["x"])).toEqual([])
  })

  it("computes tri-state and toggles all under a branch", () => {
    const korea = OPTIONS[0].children![0]
    const seoul = ["asia", "korea", "seoul"]
    const busan = ["asia", "korea", "busan"]
    expect(checkStateOf(korea, ["asia", "korea"], [])).toBe("unchecked")
    expect(checkStateOf(korea, ["asia", "korea"], [seoul])).toBe("mixed")
    expect(checkStateOf(korea, ["asia", "korea"], [seoul, busan])).toBe("checked")
    expect(toggleLeaves([seoul], [seoul, busan])).toEqual([seoul, busan])
    expect(toggleLeaves([seoul, busan], [seoul, busan])).toEqual([])
  })

  it("searches whole paths and every term", () => {
    expect(searchLeaves(OPTIONS, "seoul").map((match) => match.path.at(-1))).toEqual(["seoul"])
    expect(searchLeaves(OPTIONS, "korea bu").map((match) => match.path.at(-1))).toEqual(["busan"])
    expect(searchLeaves(OPTIONS, "asia")).toHaveLength(3)
    expect(searchLeaves(OPTIONS, "  ")).toEqual([])
    expect(searchLeaves(OPTIONS, "japan")).toEqual([])
  })

  it("steps over disabled rows and stops at the ends", () => {
    const column = OPTIONS[0].children!
    expect(enabledIndex(column, 0, 1)).toBe(2)
    expect(enabledIndex(column, 2, -1)).toBe(0)
    expect(enabledIndex(column, 2, 1)).toBeNull()
  })

  it("maps keys to actions and sends plain characters to search", () => {
    const key = (name: string, extra = {}) => ({ key: name, ctrlKey: false, metaKey: false, altKey: false, ...extra })
    expect(treeKeyAction(key("ArrowRight"), false, true)).toBe("expand")
    expect(treeKeyAction(key(" "), false, true)).toBe("activate")
    expect(treeKeyAction(key(" "), true, true)).toBe("toggle")
    expect(treeKeyAction(key("s"), false, true)).toBe("search")
    expect(treeKeyAction(key("s"), false, false)).toBeNull()
    expect(treeKeyAction(key("s", { metaKey: true }), false, true)).toBeNull()
  })
})

describe("Cascader", () => {
  it("opens level by level, picks a leaf, closes and shows the path in the trigger", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    place({ onValueChange })
    await openPanel(user)
    expect(screen.getAllByRole("group")).toHaveLength(1)
    await user.click(row("Asia"))
    expect(row("Asia")).toHaveAttribute("aria-expanded", "true")
    await user.click(row("Korea"))
    expect(screen.getAllByRole("group")).toHaveLength(3)
    await user.click(row("Seoul"))
    expect(onValueChange).toHaveBeenCalledWith(["asia", "korea", "seoul"])
    await waitFor(() => expect(screen.queryByRole("tree")).not.toBeInTheDocument())
    const trigger = screen.getByRole("button", { name: "Place, Asia, Korea, Seoul" })
    expect(within(trigger).getByText("Asia / Korea /")).toBeInTheDocument()
    expect(within(trigger).getByText("Seoul")).toBeInTheDocument()
  })

  it("opens back on the chosen path", async () => {
    const user = setup()
    place({ defaultValue: ["asia", "korea", "busan"] })
    await user.click(screen.getByRole("button", { name: /^Place/ }))
    expect(screen.getAllByRole("group")).toHaveLength(3)
    expect(row("Busan")).toHaveAttribute("aria-selected", "true")
    expect(row("Seoul")).toHaveAttribute("aria-selected", "false")
  })

  it("exposes tree semantics: level, position and expanded", async () => {
    const user = setup()
    place()
    await openPanel(user)
    await user.click(row("Asia"))
    const korea = row("Korea")
    expect(screen.getByRole("tree", { name: "Place" })).toBeInTheDocument()
    expect(korea).toHaveAttribute("aria-level", "2")
    expect(korea).toHaveAttribute("aria-posinset", "1")
    expect(korea).toHaveAttribute("aria-setsize", "3")
    expect(korea).toHaveAttribute("aria-expanded", "false")
    expect(row("Japan")).toHaveAttribute("aria-disabled", "true")
    expect(row("Other")).not.toHaveAttribute("aria-expanded")
  })

  it("is fully usable from the keyboard", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    place({ searchable: false, onValueChange })
    screen.getByRole("button", { name: /^Place/ }).focus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(row("Asia")).toHaveFocus())
    await user.keyboard("{ArrowDown}")
    expect(row("Europe")).toHaveFocus()
    await user.keyboard("{Home}")
    expect(row("Asia")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(row("Korea")).toHaveFocus())
    await user.keyboard("{ArrowDown}")
    expect(row("India")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(row("Asia")).toHaveFocus())
    expect(row("Asia")).toHaveAttribute("aria-expanded", "false")
    await user.keyboard("{Enter}")
    await waitFor(() => expect(row("Korea")).toHaveFocus())
    await user.keyboard("{Enter}")
    await waitFor(() => expect(row("Seoul")).toHaveFocus())
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(["asia", "korea", "seoul"])
  })

  it("keeps a single tab stop in the tree", async () => {
    const user = setup()
    place({ defaultValue: ["asia", "korea", "seoul"], searchable: false })
    await user.click(screen.getByRole("button", { name: /^Place/ }))
    const tree = screen.getByRole("tree")
    expect(tree.querySelectorAll("[tabindex='0']")).toHaveLength(1)
  })

  it("puts the tab stop on the chosen row when reopened", async () => {
    const user = setup()
    place({ defaultValue: ["asia", "korea", "busan"], searchable: false })
    await user.click(screen.getByRole("button", { name: /^Place/ }))
    await waitFor(() => expect(row("Busan")).toHaveFocus())
    expect(row("Busan")).toHaveAttribute("tabindex", "0")
  })

  it("keeps a tab stop when an inline stepped panel starts deep in the tree", () => {
    place({ variant: "inline", layout: "steps", defaultValue: ["asia", "korea", "seoul"], searchable: false })
    expect(screen.getByRole("tree").querySelectorAll("[tabindex='0']")).toHaveLength(1)
    expect(row("Seoul")).toHaveAttribute("tabindex", "0")
  })

  it("adds the chosen path to a name given by aria-labelledby", () => {
    render(
      <>
        <span id="office-label">Office</span>
        <Cascader aria-labelledby="office-label" options={OPTIONS} defaultValue={["other"]} />
      </>,
    )
    expect(screen.getByRole("button", { name: "Office Other" })).toBeInTheDocument()
  })

  it("searches paths, moves with arrows and picks with Enter", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    place({ onValueChange })
    await openPanel(user)
    const box = screen.getByRole("combobox", { name: "Search" })
    await waitFor(() => expect(box).toHaveFocus())
    await user.keyboard("asia")
    expect(screen.queryByRole("tree")).not.toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(3)
    await user.keyboard("{ArrowDown}")
    expect(box).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[1].id)
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(["asia", "korea", "busan"])
  })

  it("says so when search finds nothing, and the first Escape only empties the box", async () => {
    const user = setup()
    place()
    await openPanel(user)
    await user.keyboard("zzz")
    expect(screen.getByText("No results.")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search" })).toHaveValue("")
    expect(screen.getByRole("tree")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("tree")).not.toBeInTheDocument())
  })

  it("loads lazy children once, with a loading state and focus moving in for the keyboard", async () => {
    const user = setup()
    let finish: (children: readonly CascaderOption[]) => void = () => {}
    const loadChildren = vi.fn(() => new Promise<readonly CascaderOption[]>((resolve) => (finish = resolve)))
    place({ options: [{ value: "docs", label: "Docs", lazy: true }], searchable: false, loadChildren })
    await openPanel(user)
    await waitFor(() => expect(row("Docs")).toHaveFocus())
    await user.keyboard("{ArrowRight}")
    expect(loadChildren).toHaveBeenCalledOnce()
    expect(loadChildren.mock.calls[0]).toEqual([["docs"], expect.objectContaining({ value: "docs" })])
    expect(row("Docs")).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("status")).toHaveTextContent("Loading")
    await act(async () => finish([{ value: "readme", label: "Readme" }]))
    await waitFor(() => expect(row("Readme")).toHaveFocus())
    expect(row("Docs")).not.toHaveAttribute("aria-busy")
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(row("Docs")).toHaveFocus())
    await user.keyboard("{ArrowRight}")
    expect(loadChildren).toHaveBeenCalledOnce()
  })

  it("offers a retry when loading fails", async () => {
    const user = setup()
    const loadChildren = vi
      .fn<() => Promise<readonly CascaderOption[]>>()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce([{ value: "readme", label: "Readme" }])
    place({ options: [{ value: "docs", label: "Docs", lazy: true }], searchable: false, loadChildren })
    await openPanel(user)
    await user.click(row("Docs"))
    await user.click(await screen.findByRole("button", { name: "Could not load. Try again" }))
    expect(await screen.findByRole("treeitem", { name: "Readme" })).toBeInTheDocument()
  })

  it("multiple: ticks leaves, shows a mixed parent, stays open and summarises", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    place({ variant: "multiple", searchable: false, onValueChange })
    await openPanel(user)
    expect(screen.getByRole("tree")).toHaveAttribute("aria-multiselectable", "true")
    await user.click(row("Asia"))
    await user.click(row("Korea"))
    await user.click(row("Seoul"))
    expect(row("Seoul")).toHaveAttribute("aria-checked", "true")
    expect(row("Korea")).toHaveAttribute("aria-checked", "mixed")
    expect(row("Asia")).toHaveAttribute("aria-checked", "mixed")
    expect(onValueChange).toHaveBeenLastCalledWith([["asia", "korea", "seoul"]])
    await user.click(row("Busan"))
    expect(row("Korea")).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("tree")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: /Seoul \+1/ })).toBeInTheDocument()
  })

  it("multiple: Space toggles a whole branch, and pressing its box does not open it", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    place({ variant: "multiple", searchable: false, onValueChange })
    await openPanel(user)
    await waitFor(() => expect(row("Asia")).toHaveFocus())
    await user.keyboard(" ")
    expect(onValueChange).toHaveBeenLastCalledWith([
      ["asia", "korea", "seoul"],
      ["asia", "korea", "busan"],
      ["asia", "india", "delhi"],
    ])
    expect(row("Asia")).toHaveAttribute("aria-expanded", "false")
    const box = within(row("Europe")).getByText("", { selector: "[data-slot='cascader-check']" })
    await user.click(box)
    expect(row("Europe")).toHaveAttribute("aria-checked", "true")
    expect(row("Europe")).toHaveAttribute("aria-expanded", "false")
  })

  it("steps one level at a time on phones, with a back button that goes up", async () => {
    narrow = true
    const user = setup()
    place({ searchable: false, effect: "slide" })
    await openPanel(user)
    expect(document.querySelector("[data-layout='steps']")).not.toBeNull()
    await waitFor(() => expect(row("Asia")).toHaveFocus())
    await user.click(row("Asia"))
    await waitFor(() => expect(screen.queryByRole("treeitem", { name: "Europe" })).not.toBeInTheDocument())
    await waitFor(() => expect(row("Korea")).toHaveFocus())
    await user.click(screen.getByRole("button", { name: "Back, Asia" }))
    await waitFor(() => expect(row("Asia")).toBeInTheDocument())
    expect(screen.queryByRole("button", { name: /Back/ })).not.toBeInTheDocument()
  })

  it("does not raise the phone keyboard on open", async () => {
    narrow = true
    const user = setup()
    place()
    await openPanel(user)
    await waitFor(() => expect(row("Asia")).toHaveFocus())
    expect(screen.getByRole("combobox", { name: "Search" })).not.toHaveFocus()
  })

  it("makes the variants differ in structure", async () => {
    const user = setup()
    const shape = async (variant: CascaderProps["variant"]) => {
      const { unmount, container } = place({ variant, searchable: false } as Partial<CascaderProps>)
      const trigger = container.querySelector<HTMLElement>("[data-slot='cascader-trigger']")
      if (trigger) await user.click(trigger)
      const firstRow = (await screen.findAllByRole("treeitem"))[0]
      const result = {
        trigger: trigger !== null,
        tight: trigger?.className.includes("h-8") ?? false,
        tickBox: firstRow.querySelector("[data-slot='cascader-check']") !== null,
        narrowColumn: document.querySelector("[data-slot='cascader-column']")?.className.includes("w-32") ?? false,
      }
      unmount()
      return result
    }
    expect(await shape("plain")).toEqual({ trigger: true, tight: false, tickBox: false, narrowColumn: false })
    expect(await shape("inline")).toEqual({ trigger: false, tight: false, tickBox: false, narrowColumn: false })
    expect(await shape("compact")).toEqual({ trigger: true, tight: true, tickBox: false, narrowColumn: true })
    expect(await shape("multiple")).toEqual({ trigger: true, tight: false, tickBox: true, narrowColumn: false })
  })

  it("inline: stays open after a pick and shows the path above", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    place({ variant: "inline", searchable: false, onValueChange })
    expect(screen.getByText("Nothing chosen yet")).toBeInTheDocument()
    await user.click(row("Europe"))
    await user.click(row("Lisbon"))
    expect(onValueChange).toHaveBeenCalledWith(["europe", "lisbon"])
    expect(screen.getByRole("tree")).toBeInTheDocument()
    expect(screen.getByText("Europe /")).toBeInTheDocument()
  })

  it("posts the leaf value with a form and respects disabled", () => {
    const { container, rerender } = place({ name: "city", defaultValue: ["asia", "korea", "seoul"] })
    expect(container.querySelector<HTMLInputElement>("input[type='hidden']")?.value).toBe("seoul")
    rerender(<Cascader aria-label="Place" options={OPTIONS} disabled />)
    expect(screen.getByRole("button", { name: /^Place/ })).toBeDisabled()
  })
})
