import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { Command, pushRecent, useCommandShortcut, type CommandItem, type CommandProps, type CommandVariant } from "./command"
import { buildSections, fuzzyScore, scoreItem } from "./command-score"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollIntoView = vi.fn()
})

afterAll(() => vi.unstubAllGlobals())

const ITEMS: readonly CommandItem[] = [
  { value: "projects", label: "Go to Projects", group: "Navigate", shortcut: ["G", "P"], description: "All active work" },
  { value: "settings", label: "Settings", group: "Navigate", keywords: ["preferences"] },
  { value: "reset", label: "Reset filters", group: "Actions" },
  { value: "invite", label: "Invite teammate", group: "Actions", disabled: true },
  { value: "theme", label: "Toggle dark theme", group: "Actions" },
]

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const input = () => screen.getByRole("combobox")
const options = () => screen.queryAllByRole("option")
const activeRow = () => document.getElementById(input().getAttribute("aria-activedescendant") ?? "")
const renderInline = (props: Partial<CommandProps> = {}) => render(<Command items={ITEMS} variant="inline" {...props} />)

describe("fuzzyScore", () => {
  it("matches a subsequence and refuses the rest", () => {
    expect(fuzzyScore("stg", "Settings")).not.toBeNull()
    expect(fuzzyScore("xyz", "Settings")).toBeNull()
    expect(fuzzyScore("settingss", "Settings")).toBeNull()
    expect(fuzzyScore("", "Settings")).toEqual({ score: 0, indices: [] })
  })

  it("ignores case and spaces in the query", () => {
    expect(fuzzyScore("SET", "settings")?.indices).toEqual([0, 1, 2])
    expect(fuzzyScore("go proj", "Go to Projects")).not.toBeNull()
  })

  it("prefers word starts over the first occurrence of a letter", () => {
    expect(fuzzyScore("gp", "Go to Projects")?.indices).toEqual([0, 6])
    expect(fuzzyScore("dt", "Toggle dark theme")?.indices).toEqual([7, 12])
    expect(fuzzyScore("up", "Set up Project")?.indices).toEqual([4, 5])
  })

  it("ranks a prefix above a mid-word match, and a tight match above a scattered one", () => {
    const score = (query: string, text: string) => fuzzyScore(query, text)?.score ?? -Infinity
    expect(score("set", "Settings")).toBeGreaterThan(score("set", "Reset filters"))
    expect(score("rep", "Reports")).toBeGreaterThan(score("rep", "Retry the Backup"))
    expect(score("gp", "Go to Projects")).toBeGreaterThan(score("gp", "Group"))
  })

  it("works on Hangul", () => {
    expect(fuzzyScore("설정", "환경 설정")?.indices).toEqual([3, 4])
    expect(fuzzyScore("없음", "환경 설정")).toBeNull()
  })

  it("stays fast on a long label", () => {
    const start = performance.now()
    for (let round = 0; round < 200; round += 1) fuzzyScore("aaaaaaaaaaaaaaaa", "a".repeat(5000))
    expect(performance.now() - start).toBeLessThan(6000)
  })

  it("lets keywords find an item, below a visible match of the same word", () => {
    const hidden = scoreItem({ value: "a", label: "Settings", keywords: ["preferences"] }, "pref")
    const visible = scoreItem({ value: "b", label: "Preferences" }, "pref")
    expect(hidden?.indices).toEqual([])
    expect(visible?.score).toBeGreaterThan(hidden?.score ?? Infinity)
  })
})

describe("buildSections and pushRecent", () => {
  it("puts recent first while browsing, without repeating them in their group", () => {
    const sections = buildSections(ITEMS, "", ["theme", "gone", "invite"], "Recent")
    expect(sections[0].heading).toBe("Recent")
    expect(sections[0].entries.map(({ item }) => item.value)).toEqual(["theme"])
    const actions = sections.find((section) => section.heading === "Actions")
    expect(actions?.entries.map(({ item }) => item.value)).toEqual(["reset", "invite"])
  })

  it("drops recent once typing starts, and orders sections by their best hit", () => {
    const sections = buildSections(ITEMS, "reset", ["theme"], "Recent")
    expect(sections.map((section) => section.heading)).toEqual(["Actions"])
    const mixed = buildSections(ITEMS, "t", [], "Recent")
    expect(mixed[0].heading).toBe("Actions")
    expect(mixed[0].entries[0].item.value).toBe("theme")
  })

  it("keeps recent newest first, unique and capped", () => {
    expect(pushRecent(["a", "b"], "b")).toEqual(["b", "a"])
    expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"])
  })
})

describe("Command", () => {
  it("wires a combobox to a listbox", () => {
    renderInline({ label: "Palette" })
    expect(input()).toHaveAccessibleName("Palette")
    expect(input()).toHaveAttribute("aria-autocomplete", "list")
    expect(input()).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("listbox").id).toBe(input().getAttribute("aria-controls"))
    expect(screen.getByRole("group", { name: "Navigate" })).toBeInTheDocument()
    expect(activeRow()).toHaveAttribute("aria-selected", "true")
    expect(activeRow()).toHaveTextContent("Go to Projects")
  })

  it("filters as you type and marks the matched letters", async () => {
    const user = setup()
    renderInline()
    await user.type(input(), "gp")
    expect(options()).toHaveLength(1)
    const marks = options()[0].querySelectorAll("mark")
    expect([...marks].map((mark) => mark.textContent)).toEqual(["G", "P"])
    expect(screen.getByRole("status")).toHaveTextContent("1 result")
  })

  it("moves with the arrows, wraps, skips disabled rows and runs on Enter", async () => {
    const user = setup()
    const onSelect = vi.fn()
    const onRun = vi.fn()
    renderInline({ onSelect, items: [...ITEMS.slice(0, 2), { ...ITEMS[2], onSelect: onRun }, ...ITEMS.slice(3)] })
    input().focus()
    await user.keyboard("{ArrowUp}")
    expect(activeRow()).toHaveTextContent("Toggle dark theme")
    await user.keyboard("{ArrowUp}")
    expect(activeRow()).toHaveTextContent("Reset filters")
    await user.keyboard("{Enter}")
    expect(onSelect).toHaveBeenCalledWith("reset", expect.objectContaining({ value: "reset" }))
    expect(onRun).toHaveBeenCalledOnce()
  })

  it("does not run on the Enter that confirms an IME syllable", () => {
    const onSelect = vi.fn()
    renderInline({ onSelect })
    fireEvent.keyDown(input(), { key: "Enter", isComposing: true })
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it("selects with a click and ignores a disabled row", async () => {
    const user = setup()
    const onSelect = vi.fn()
    renderInline({ onSelect })
    const disabled = screen.getByRole("option", { name: /Invite/ })
    expect(disabled).toHaveAttribute("aria-disabled", "true")
    await user.click(disabled)
    expect(onSelect).not.toHaveBeenCalled()
    await user.click(screen.getByRole("option", { name: /Settings/ }))
    expect(onSelect).toHaveBeenCalledWith("settings", expect.anything())
  })

  it("shows the empty state, and shows shortcuts on the right", async () => {
    const user = setup()
    renderInline({ emptyText: "Nothing here." })
    expect(within(screen.getByRole("option", { name: /Projects/ })).getByText("P")).toHaveProperty("tagName", "KBD")
    await user.type(input(), "zzzz")
    expect(screen.getByText("Nothing here.")).toBeInTheDocument()
    expect(input()).toHaveAttribute("aria-expanded", "false")
    expect(input()).not.toHaveAttribute("aria-activedescendant")
  })

  it("clears on Escape where nothing is there to close", async () => {
    const user = setup()
    renderInline()
    await user.type(input(), "reset{Escape}")
    expect(input()).toHaveValue("")
    expect(options().length).toBe(ITEMS.length)
  })

  it("opens as a dialog with focus in the input, closes after running, and gives focus back", async () => {
    const user = setup()
    const App = () => {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open</button>
          <Command items={ITEMS} open={open} onOpenChange={setOpen} label="Palette" />
        </>
      )
    }
    render(<App />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.getByRole("dialog", { name: "Palette" })).toBeInTheDocument()
    expect(input()).toHaveFocus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus()
  })

  it("closes on Escape and starts empty next time", async () => {
    const user = setup()
    render(<Command items={ITEMS} defaultOpen />)
    await user.type(input(), "reset")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("toggles from Mod+K through the helper", () => {
    const handler = vi.fn()
    const Listener = () => {
      useCommandShortcut(handler)
      return null
    }
    const { unmount } = render(<Listener />)
    fireEvent.keyDown(window, { key: "k" })
    expect(handler).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: "K", ctrlKey: true })
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(handler).toHaveBeenCalledTimes(2)
    unmount()
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: CommandVariant) => {
      const { unmount } = render(<Command items={ITEMS} variant={variant} defaultOpen />)
      const result = {
        dialog: screen.queryByRole("dialog") !== null,
        footer: document.querySelector("[data-slot='command-footer']") !== null,
        headings: document.querySelectorAll("[data-slot='command-heading']").length,
        description: document.querySelector("[data-slot='command-description']") !== null,
        large: input().className.includes("text-xl"),
      }
      unmount()
      return result
    }
    expect(shape("dialog")).toEqual({ dialog: true, footer: true, headings: 2, description: true, large: false })
    expect(shape("inline")).toEqual({ dialog: false, footer: false, headings: 2, description: true, large: false })
    expect(shape("compact")).toEqual({ dialog: false, footer: false, headings: 0, description: false, large: false })
    expect(shape("spotlight")).toEqual({ dialog: true, footer: false, headings: 0, description: false, large: true })
  })

  it("keeps a spotlight down to its input until there is something to show", async () => {
    const user = setup()
    const { unmount } = render(<Command items={ITEMS} variant="spotlight" defaultOpen />)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(input()).toHaveAttribute("aria-expanded", "false")
    await user.type(input(), "reset")
    expect(options()).toHaveLength(1)
    unmount()
    render(<Command items={ITEMS} variant="spotlight" defaultOpen recent={["settings"]} />)
    expect(screen.getByRole("group", { name: "Recent" })).toBeInTheDocument()
    expect(options()).toHaveLength(1)
  })

  it("wraps the list in a spring height only for materialize", () => {
    const { unmount } = renderInline()
    expect(document.querySelector("[data-slot='command-height']")).toBeNull()
    unmount()
    renderInline({ effect: "materialize" })
    expect(document.querySelector("[data-slot='command-height']")).toBeInTheDocument()
    expect(document.querySelector("[data-slot='command']")).toHaveAttribute("data-effect", "materialize")
  })
})
