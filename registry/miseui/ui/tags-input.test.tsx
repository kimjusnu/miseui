import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TagsInput, type TagsInputProps, type TagsInputVariant } from "./tags-input"
import { DEFAULT_TAG_MESSAGES, addTags, filterSuggestions, parseTags } from "./tags-input-math"

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const renderTags = (props: Partial<TagsInputProps> = {}) => render(<TagsInput aria-label="Skills" {...props} />)
const field = () => document.querySelector("[data-slot='tags-input-field']") as HTMLInputElement
const tagsShown = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='tags-input-tag']")).map((row) => row.dataset.tag)
const tagNode = (tag: string) => document.querySelector(`[data-tag='${tag}']`) as HTMLElement
const rules = { messages: DEFAULT_TAG_MESSAGES }

describe("tags math", () => {
  it("parseTags splits on commas, new lines and tabs, trims and drops blanks", () => {
    expect(parseTags(" one, two\nthree\t four ,, ")).toEqual(["one", "two", "three", "four"])
    expect(parseTags("   ")).toEqual([])
  })

  it("addTags refuses duplicates in any case, including inside the same paste", () => {
    const result = addTags(["React"], ["react", "Vue", "vue"], rules)
    expect(result.tags).toEqual(["React", "Vue"])
    expect(result.errors).toHaveLength(2)
  })

  it("addTags stops at max and asks validate last, without changing the input array", () => {
    const current = ["a"] as const
    const result = addTags(current, ["bb", "c", "d"], { ...rules, max: 2, validate: (tag) => (tag.length > 1 ? "Too long" : null) })
    expect(result.tags).toEqual(["a", "c"])
    expect(result.errors).toEqual(["Too long", "Only 2 tags can be added."])
    expect(current).toEqual(["a"])
  })

  it("filterSuggestions matches anywhere and hides what is already chosen", () => {
    expect(filterSuggestions(["React", "Preact", "Vue"], "rea", ["preact"])).toEqual(["React"])
    expect(filterSuggestions(["React", "Vue"], "", [])).toEqual(["React", "Vue"])
  })
})

describe("TagsInput", () => {
  it("holds its width in a narrow parent, because an open grid track would grow to fit one long line of tags", () => {
    const { container } = render(<TagsInput aria-label="Filters" variant="compact" defaultValue={["bug", "design"]} />)
    expect(container.querySelector("[data-slot='tags-input']")).toHaveClass("grid-cols-[minmax(0,1fr)]")
  })

  it("wraps the field to a new line before its placeholder is cut off", () => {
    const { container } = render(<TagsInput aria-label="Keywords" variant="inline" placeholder="Add a keyword" />)
    expect(container.querySelector("[data-slot='tags-input-field']")).toHaveClass("min-w-24")
  })

  it.each<TagsInputVariant>(["plain", "inline", "stacked", "compact"])("%s marks itself and adds on Enter", async (variant) => {
    const user = setup()
    const onValueChange = vi.fn()
    renderTags({ variant, onValueChange })
    expect(document.querySelector("[data-slot='tags-input']")).toHaveAttribute("data-variant", variant)
    await user.type(field(), "design{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(["design"])
    expect(field()).toHaveValue("")
    expect(tagsShown()).toEqual(["design"])
  })

  it("the variants differ in structure: only stacked has an Add button and its list outside the field", () => {
    const stacked = renderTags({ variant: "stacked", defaultValue: ["a"] })
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled()
    expect(document.querySelector("[data-slot='tags-input-frame']")).toBeNull()
    stacked.unmount()
    renderTags({ variant: "plain", defaultValue: ["a"] })
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull()
    expect(document.querySelector("[data-slot='tags-input-frame']")).toContainElement(tagNode("a"))
  })

  it("a comma adds too, by key and when a phone keyboard only sends the text", async () => {
    const user = setup()
    renderTags()
    await user.type(field(), "one,")
    expect(tagsShown()).toEqual(["one"])
    expect(field()).toHaveValue("")
    fireEvent.change(field(), { target: { value: "two," } })
    expect(tagsShown()).toEqual(["one", "two"])
  })

  it("Enter during IME composition does not add; it is accepting a syllable", () => {
    renderTags()
    fireEvent.change(field(), { target: { value: "디자" } })
    fireEvent.keyDown(field(), { key: "Enter", isComposing: true })
    expect(tagsShown()).toEqual([])
    expect(field()).toHaveValue("디자")
  })

  it("an empty field lets Enter through so the form can submit", () => {
    renderTags()
    const notPrevented = fireEvent.keyDown(field(), { key: "Enter" })
    expect(notPrevented).toBe(true)
  })

  it("pasting several adds them all and reports what could not be added", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderTags({ onValueChange, defaultValue: ["one"], max: 3 })
    await user.click(field())
    await user.paste("two, three, four, one")
    expect(onValueChange).toHaveBeenLastCalledWith(["one", "two", "three"])
    expect(screen.getByRole("alert")).toHaveTextContent("Only 3 tags can be added.")
    expect(field()).toHaveValue("")
  })

  it("pasting one word just puts it in the field", async () => {
    const user = setup()
    renderTags()
    await user.click(field())
    await user.paste("single")
    expect(field()).toHaveValue("single")
    expect(tagsShown()).toEqual([])
  })

  it("Backspace in an empty field removes the last tag; with text it edits the text", async () => {
    const user = setup()
    renderTags({ defaultValue: ["one", "two"] })
    await user.type(field(), "x{Backspace}")
    expect(tagsShown()).toEqual(["one", "two"])
    await user.keyboard("{Backspace}")
    expect(tagsShown()).toEqual(["one"])
    expect(document.querySelector("[aria-live='polite']")).toHaveTextContent("Removed two")
  })

  it("arrows walk from the field through the tags and back", async () => {
    const user = setup()
    renderTags({ defaultValue: ["one", "two"] })
    await user.click(field())
    await user.keyboard("{ArrowLeft}")
    expect(tagNode("two")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(tagNode("one")).toHaveFocus()
    await user.keyboard("{ArrowRight}{ArrowRight}")
    expect(field()).toHaveFocus()
  })

  it("ArrowLeft stays in the text while the caret has somewhere to go", async () => {
    const user = setup()
    renderTags({ defaultValue: ["one"] })
    await user.type(field(), "ab")
    await user.keyboard("{ArrowLeft}")
    expect(field()).toHaveFocus()
  })

  it("Backspace on a focused tag removes it and focus lands on its neighbour, then the field", async () => {
    const user = setup()
    renderTags({ defaultValue: ["one", "two"] })
    await user.click(field())
    await user.keyboard("{ArrowLeft}{Backspace}")
    expect(tagsShown()).toEqual(["one"])
    expect(tagNode("one")).toHaveFocus()
    await user.keyboard("{Delete}")
    expect(tagsShown()).toEqual([])
    expect(field()).toHaveFocus()
  })

  it("the remove button works and keeps out of the tab order", async () => {
    const user = setup()
    renderTags({ defaultValue: ["one"] })
    const remove = screen.getByRole("button", { name: "Remove one" })
    expect(remove).toHaveAttribute("tabindex", "-1")
    await user.click(remove)
    expect(tagsShown()).toEqual([])
    expect(field()).toHaveFocus()
  })

  it("max counts up and refuses more, duplicates say so, and a refused word stays to be fixed", async () => {
    const user = setup()
    renderTags({ max: 2, defaultValue: ["one"] })
    expect(screen.getByText("1 of 2")).toBeInTheDocument()
    await user.type(field(), "ONE{Enter}")
    expect(screen.getByRole("alert")).toHaveTextContent("ONE is already added.")
    expect(field()).toHaveValue("ONE")
    expect(field()).toHaveAttribute("aria-invalid", "true")
    await user.clear(field())
    expect(screen.queryByRole("alert")).toBeNull()
    await user.type(field(), "two{Enter}three{Enter}")
    expect(tagsShown()).toEqual(["one", "two"])
    expect(screen.getByRole("alert")).toHaveTextContent("Only 2 tags can be added.")
  })

  it("validate refuses with its own sentence and the field points at it", async () => {
    const user = setup()
    renderTags({ validate: (tag) => (tag.includes("@") ? null : "Enter an email address.") })
    await user.type(field(), "nope{Enter}")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Enter an email address.")
    expect(field().getAttribute("aria-describedby")).toBe(alert.id)
    expect(tagsShown()).toEqual([])
  })

  it("suggestions are a combobox: typing filters, arrows move, Enter takes the active one", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderTags({ suggestions: ["React", "Redux", "Vue"], onValueChange })
    const box = screen.getByRole("combobox", { name: "Skills" })
    await user.click(box)
    await user.keyboard("re")
    const list = screen.getByRole("listbox")
    expect(box).toHaveAttribute("aria-controls", list.id)
    expect(within(list).getAllByRole("option")).toHaveLength(2)
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(document.getElementById(box.getAttribute("aria-activedescendant") ?? "")).toHaveTextContent("Redux")
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(["Redux"])
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("free text is still allowed with suggestions, and Escape closes the list and keeps the text", async () => {
    const user = setup()
    renderTags({ suggestions: ["React"] })
    await user.click(field())
    await user.keyboard("re{Escape}")
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(field()).toHaveValue("re")
    await user.keyboard("{Enter}")
    expect(tagsShown()).toEqual(["re"])
  })

  it("a press on a suggestion adds it and keeps focus in the field", async () => {
    const user = setup()
    renderTags({ suggestions: ["Vue"] })
    await user.click(field())
    await user.click(screen.getByRole("option", { name: "Vue" }))
    expect(tagsShown()).toEqual(["Vue"])
    expect(field()).toHaveFocus()
  })

  it("disabled blocks the field and offers no way to remove", () => {
    renderTags({ disabled: true, defaultValue: ["one"] })
    expect(field()).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Remove one" })).toBeNull()
    expect(tagNode("one")).not.toHaveAttribute("tabindex")
  })

  it("posts each tag with the form", () => {
    renderTags({ name: "skills", defaultValue: ["one", "two"] })
    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='hidden'][name='skills']")
    expect(Array.from(inputs).map((input) => input.value)).toEqual(["one", "two"])
  })

  it("controlled value wins until the owner changes it", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderTags({ value: ["one"], onValueChange })
    await user.type(field(), "two{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(["one", "two"])
    expect(tagsShown()).toEqual(["one"])
  })

  it("pop marks the effect and removed tags still leave the list", async () => {
    const user = setup()
    renderTags({ effect: "pop", defaultValue: ["one", "two"] })
    expect(document.querySelector("[data-slot='tags-input']")).toHaveAttribute("data-effect", "pop")
    await user.click(screen.getByRole("button", { name: "Remove two" }))
    await vi.waitFor(() => expect(tagsShown()).toEqual(["one"]))
  })
})
