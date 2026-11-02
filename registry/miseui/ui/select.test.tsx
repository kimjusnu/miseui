import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectEffect,
} from "./select"

// jsdom lacks the layout APIs Radix Select touches while opening and focusing items.
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// Radix disables pointer events on the page while the list is open; user-event would refuse to click otherwise.
const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

function renderSelect(onValueChange: (value: string) => void = vi.fn()) {
  return render(
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>,
  )
}

describe("Select", () => {
  it("shows the placeholder until a value is chosen", () => {
    renderSelect()
    const trigger = screen.getByRole("combobox", { name: "Fruit" })
    expect(trigger).toHaveTextContent("Pick a fruit")
    expect(trigger).toHaveAttribute("data-placeholder")
    expect(trigger).toHaveAttribute("data-slot", "select-trigger")
  })

  it("opens on click and lists the options", async () => {
    const user = setup()
    renderSelect()
    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(3)
    expect(screen.getByText("Fruits")).toBeInTheDocument()
  })

  it("reports the chosen value and shows it in the trigger", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderSelect(onValueChange)
    const trigger = screen.getByRole("combobox", { name: "Fruit" })
    await user.click(trigger)
    await user.click(await screen.findByRole("option", { name: "Banana" }))
    expect(onValueChange).toHaveBeenCalledWith("banana")
    await waitFor(() => expect(trigger).toHaveTextContent("Banana"))
    expect(trigger).not.toHaveAttribute("data-placeholder")
  })

  function renderEffect(effect: SelectEffect | undefined, onValueChange: (value: string) => void = vi.fn()) {
    return render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent effect={effect}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>,
    )
  }

  const HIGHLIGHT = "[data-slot='select-highlight']"
  const highlightedRows = () =>
    screen.getAllByRole("option").filter((option) => option.querySelector(HIGHLIGHT) !== null)

  it("materialize grows from the trigger's origin, with a mirrored exit", async () => {
    const user = setup()
    renderEffect("materialize")
    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    const surface = (await screen.findByRole("listbox")).closest("[data-slot='select-content']")
    expect(surface).toHaveAttribute("data-effect", "materialize")
    expect(surface).toHaveClass("origin-(--radix-select-content-transform-origin)")
    expect(surface).toHaveClass("data-[state=open]:animate-in", "fade-in-0", "zoom-in-90", "blur-in-sm")
    expect(surface).toHaveClass("data-[state=closed]:animate-out", "fade-out-0", "zoom-out-90", "blur-out-sm")
    expect(surface).toHaveClass("motion-reduce:zoom-in-100", "[@media(prefers-reduced-transparency:reduce)]:blur-in-0")
  })

  it("materialize draws no highlight of its own", async () => {
    const user = setup()
    renderEffect("materialize")
    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    await screen.findByRole("listbox")
    await waitFor(() => expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus())
    expect(document.querySelector(HIGHLIGHT)).toBeNull()
  })

  it("spring keeps one highlight on the focused row as the arrow keys move", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEffect("spring", onValueChange)
    await user.tab()
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus())
    expect(highlightedRows().map((row) => row.textContent)).toEqual(["Apple"])
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(highlightedRows().map((row) => row.textContent)).toEqual(["Banana"]))
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith("banana")
  })

  it("spring keeps typeahead working, and clears the item's own focus background", async () => {
    const user = setup()
    renderEffect("spring")
    await user.tab()
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus())
    await user.keyboard("c")
    await waitFor(() => expect(screen.getByRole("option", { name: "Cherry" })).toHaveFocus())
    expect(highlightedRows().map((row) => row.textContent)).toEqual(["Cherry"])
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveClass("focus:bg-transparent")
    expect(screen.getByRole("option", { name: "Cherry" })).not.toHaveClass("focus:bg-accent")
  })

  it("spring follows the pointer, as it hovers a row", async () => {
    const user = setup()
    renderEffect("spring")
    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    await user.hover(await screen.findByRole("option", { name: "Cherry" }))
    await waitFor(() => expect(highlightedRows().map((row) => row.textContent)).toEqual(["Cherry"]))
  })

  it("spring drops the shared-layout slide under reduced motion but keeps the highlight", async () => {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const fresh = await import("./select")
    vi.doUnmock("motion/react")
    const user = setup()
    render(
      <fresh.Select>
        <fresh.SelectTrigger aria-label="Fruit">
          <fresh.SelectValue placeholder="Pick" />
        </fresh.SelectTrigger>
        <fresh.SelectContent effect="spring">
          <fresh.SelectItem value="apple">Apple</fresh.SelectItem>
        </fresh.SelectContent>
      </fresh.Select>,
    )
    await user.tab()
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus())
    expect(document.querySelector(HIGHLIGHT)).toHaveAttribute("data-reduced", "true")
  })

  it("renders no effect markers without the prop", async () => {
    const user = setup()
    renderEffect(undefined)
    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    const surface = (await screen.findByRole("listbox")).closest("[data-slot='select-content']")
    await waitFor(() => expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus())
    expect(surface).not.toHaveAttribute("data-effect")
    expect(surface).toHaveClass("data-[state=open]:zoom-in-95")
    expect(document.querySelector(HIGHLIGHT)).toBeNull()
  })

  it("can be driven with the keyboard alone", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderSelect(onValueChange)
    await user.tab()
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    await screen.findByRole("listbox")
    // With nothing selected yet, the first option takes focus as the list opens.
    await waitFor(() => expect(screen.getByRole("option", { name: "Apple" })).toHaveFocus())
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(screen.getByRole("option", { name: "Banana" })).toHaveFocus())
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith("banana")
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
  })
})
