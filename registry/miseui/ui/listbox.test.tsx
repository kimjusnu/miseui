import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Listbox, type ListboxOption, type ListboxProps, type ListboxVariant } from "./listbox"
import { groupOptions, nextEnabled, typeaheadMatch } from "./listbox-state"

const OPTIONS: readonly ListboxOption[] = [
  { value: "apple", label: "Apple", description: "Crisp", group: "Fruit" },
  { value: "kale", label: "Kale", description: "Leafy", group: "Greens" },
  { value: "apricot", label: "Apricot", group: "Fruit" },
  { value: "banana", label: "Banana", group: "Fruit", disabled: true },
  { value: "avocado", label: "Avocado", group: "Greens" },
]
const FLAT: readonly ListboxOption[] = OPTIONS.map(({ value, label, description, disabled }) => ({ value, label, description, disabled }))

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const renderList = (props: Partial<ListboxProps> = {}) => {
  const merged = { "aria-label": "Food", options: FLAT, ...props } as ListboxProps
  return render(<Listbox {...merged} />)
}
const list = () => screen.getByRole("listbox", { name: "Food" })
const option = (name: RegExp | string) => screen.getByRole("option", { name })
const active = () => document.getElementById(list().getAttribute("aria-activedescendant") ?? "")

async function focusList(user: ReturnType<typeof setup>) {
  await user.tab()
  expect(list()).toHaveFocus()
}

describe("listbox helpers", () => {
  it("groupOptions keeps first-seen group order and gathers mixed entries", () => {
    const groups = groupOptions(OPTIONS)
    expect(groups.map((group) => group.name)).toEqual(["Fruit", "Greens"])
    expect(groups[0].options.map((entry) => entry.value)).toEqual(["apple", "apricot", "banana"])
  })

  it("nextEnabled skips disabled options and stops at the ends", () => {
    expect(nextEnabled(FLAT, 2, 1)?.value).toBe("avocado")
    expect(nextEnabled(FLAT, 4, 1)).toBeNull()
    expect(nextEnabled(FLAT, 0, -1)).toBeNull()
  })

  it("typeaheadMatch cycles on one repeated letter and narrows on a word", () => {
    expect(typeaheadMatch(FLAT, "a", 0)?.value).toBe("apricot")
    expect(typeaheadMatch(FLAT, "aa", 2)?.value).toBe("avocado")
    expect(typeaheadMatch(FLAT, "av", 0)?.value).toBe("avocado")
    expect(typeaheadMatch(FLAT, "b", 0)).toBeNull()
  })
})

describe("Listbox", () => {
  it.each<ListboxVariant>(["plain", "check", "card", "compact"])("%s marks itself and picks an option", async (variant) => {
    const user = setup()
    const onValueChange = vi.fn()
    renderList({ variant, onValueChange })
    expect(list()).toHaveAttribute("data-variant", variant)
    await user.click(option(/Kale/))
    expect(onValueChange).toHaveBeenCalledWith("kale")
    expect(option(/Kale/)).toHaveAttribute("aria-selected", "true")
    expect(option(/Apple/)).toHaveAttribute("aria-selected", "false")
  })

  it("the variants differ in structure", () => {
    const { unmount } = renderList({ variant: "check" })
    expect(document.querySelectorAll("[data-slot='listbox-check']")).toHaveLength(FLAT.length)
    expect(screen.getByText("Crisp")).toBeInTheDocument()
    unmount()
    const compact = renderList({ variant: "compact" })
    expect(screen.queryByText("Crisp")).toBeNull()
    expect(document.querySelector("[data-slot='listbox-check']")).toBeNull()
    compact.unmount()
    renderList({ variant: "check", multiple: true })
    expect(document.querySelectorAll("[data-slot='listbox-checkbox']")).toHaveLength(FLAT.length)
  })

  it("keeps focus on the list and moves aria-activedescendant, skipping disabled options", async () => {
    const user = setup()
    renderList()
    await focusList(user)
    expect(active()).toHaveTextContent("Apple")
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")
    expect(active()).toHaveTextContent("Avocado")
    expect(list()).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(active()).toHaveTextContent("Avocado")
  })

  it("Home and End go to the first and last enabled option", async () => {
    const user = setup()
    const options = [{ value: "off", label: "Off", disabled: true }, ...FLAT, { value: "last", label: "Last", disabled: true }]
    renderList({ options })
    await focusList(user)
    await user.keyboard("{End}")
    expect(active()).toHaveTextContent("Avocado")
    await user.keyboard("{Home}")
    expect(active()).toHaveTextContent("Apple")
  })

  it("Enter and Space choose the active option; arrows alone do not", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderList({ onValueChange })
    await focusList(user)
    await user.keyboard("{ArrowDown}")
    expect(onValueChange).not.toHaveBeenCalled()
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith("kale")
    await user.keyboard("{ArrowDown} ")
    expect(onValueChange).toHaveBeenLastCalledWith("apricot")
  })

  it("starts on the selected option, which is what the list should open on", async () => {
    const user = setup()
    renderList({ defaultValue: "apricot" })
    await focusList(user)
    expect(active()).toHaveTextContent("Apricot")
  })

  it("type-ahead jumps by first letters, and a word can hold a space", async () => {
    const user = setup()
    const options = [{ value: "a", label: "New Delhi" }, { value: "b", label: "New York" }, { value: "c", label: "Oslo" }]
    const onValueChange = vi.fn()
    renderList({ options, onValueChange })
    await focusList(user)
    await user.keyboard("o")
    expect(active()).toHaveTextContent("Oslo")
    await new Promise((resolve) => setTimeout(resolve, 550))
    await user.keyboard("new y")
    expect(active()).toHaveTextContent("New York")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("multiple toggles, reports the whole array and says so to assistive tech", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderList({ multiple: true, onValueChange })
    expect(list()).toHaveAttribute("aria-multiselectable", "true")
    await user.click(option(/Apple/))
    await user.click(option(/Kale/))
    expect(onValueChange).toHaveBeenLastCalledWith(["apple", "kale"])
    await user.click(option(/Apple/))
    expect(onValueChange).toHaveBeenLastCalledWith(["kale"])
  })

  it("multiple: Shift+Arrow extends and Ctrl+A selects every enabled option, then none", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderList({ multiple: true, onValueChange })
    await focusList(user)
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}")
    expect(onValueChange).toHaveBeenLastCalledWith(["kale"])
    await user.keyboard("{Control>}a{/Control}")
    expect(onValueChange).toHaveBeenLastCalledWith(["apple", "kale", "apricot", "avocado"])
    await user.keyboard("{Control>}a{/Control}")
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  it("groups are labelled and the keyboard follows display order, not array order", async () => {
    const user = setup()
    renderList({ options: OPTIONS })
    expect(within(screen.getByRole("group", { name: "Fruit" })).getAllByRole("option")).toHaveLength(3)
    await focusList(user)
    await user.keyboard("{ArrowDown}")
    expect(active()).toHaveTextContent("Apricot")
    await user.keyboard("{ArrowDown}")
    expect(active()).toHaveTextContent("Kale")
  })

  it("disabled options refuse the pointer and carry aria-disabled", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderList({ onValueChange })
    expect(option(/Banana/)).toHaveAttribute("aria-disabled", "true")
    await user.click(option(/Banana/))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("a disabled list leaves the tab order and has no active option", async () => {
    const user = setup()
    renderList({ disabled: true })
    await user.tab()
    expect(list()).not.toHaveFocus()
    expect(list()).toHaveAttribute("aria-disabled", "true")
    expect(list()).not.toHaveAttribute("aria-activedescendant")
  })

  it("controlled value wins until the owner changes it", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderList({ value: "apple", onValueChange })
    await user.click(option(/Kale/))
    expect(onValueChange).toHaveBeenCalledWith("kale")
    expect(option(/Apple/)).toHaveAttribute("aria-selected", "true")
  })

  it("posts the selection through hidden inputs", () => {
    renderList({ multiple: true, name: "food", defaultValue: ["apple", "kale"] })
    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='hidden'][name='food']")
    expect(Array.from(inputs).map((input) => input.value)).toEqual(["apple", "kale"])
  })

  it("spring draws one highlight on the selected row and carries it along", async () => {
    const user = setup()
    renderList({ effect: "spring", defaultValue: "apple" })
    expect(list()).toHaveAttribute("data-effect", "spring")
    expect(option(/Apple/).querySelector("[data-slot='listbox-highlight']")).not.toBeNull()
    await user.click(option(/Kale/))
    expect(document.querySelectorAll("[data-slot='listbox-highlight']")).toHaveLength(1)
    expect(option(/Kale/).querySelector("[data-slot='listbox-highlight']")).not.toBeNull()
  })
})
