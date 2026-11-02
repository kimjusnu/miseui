import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Combobox, type ComboboxOption, type ComboboxProps, type ComboboxVariant } from "./combobox"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

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
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const OPTIONS: readonly ComboboxOption[] = [
  { value: "seoul", label: "Seoul", description: "Korea", group: "Asia", media: <span data-testid="media-seoul" /> },
  { value: "tokyo", label: "Tokyo", description: "Japan", group: "Asia" },
  { value: "oslo", label: "Oslo", description: "Norway", group: "Europe", disabled: true },
  { value: "lisbon", label: "Lisbon", description: "Portugal", group: "Europe" },
]

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const trigger = (name = "City") => screen.getByRole("button", { name })
const search = () => screen.getByRole("combobox")
const option = (name: RegExp | string) => screen.getByRole("option", { name })
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement

const renderCombobox = (props: Partial<ComboboxProps> = {}) => {
  const merged = { "aria-label": "City", options: OPTIONS, placeholder: "Pick a city", ...props } as ComboboxProps
  return render(<Combobox {...merged} />)
}

async function open(user: ReturnType<typeof setup>) {
  await user.click(trigger())
  return screen.findByRole("listbox")
}

const active = () => {
  const id = search().getAttribute("aria-activedescendant")
  return id ? document.getElementById(id) : null
}

describe("Combobox", () => {
  describe.each<ComboboxVariant>(["plain", "avatar", "grouped"])("variant=%s", (variant) => {
    it("marks the variant and picks one option, closing the list and showing it in the trigger", async () => {
      const user = setup()
      const onValueChange = vi.fn()
      renderCombobox({ variant, onValueChange })
      expect(slot("combobox")).toHaveAttribute("data-variant", variant)
      await open(user)
      await user.click(option(/Tokyo/))
      expect(onValueChange).toHaveBeenCalledWith("tokyo")
      await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
      expect(slot("combobox-trigger")).toHaveTextContent("Tokyo")
    })
  })

  it("adds the chosen value to the trigger name, or it would never be announced", () => {
    render(<Combobox aria-label="City" defaultValue="tokyo" options={OPTIONS} />)
    expect(screen.getByRole("button", { name: "City, Tokyo" })).toBeInTheDocument()
  })

  it("does the same when a Field names the trigger with aria-labelledby", () => {
    render(
      <>
        <span id="city-label">Home city</span>
        <Combobox aria-labelledby="city-label" defaultValue="tokyo" options={OPTIONS} />
      </>,
    )
    expect(screen.getByRole("button", { name: "Home city Tokyo" })).toBeInTheDocument()
  })

  it("Backspace in an empty search does nothing where no chips show what would go", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    render(<Combobox aria-label="City" multiple defaultValue={["seoul"]} options={OPTIONS} onValueChange={onValueChange} />)
    await user.click(screen.getByRole("button", { name: "City, Seoul" }))
    await screen.findByRole("listbox")
    await user.keyboard("{Backspace}")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("wires the search input as a combobox that controls the listbox", async () => {
    const user = setup()
    renderCombobox()
    const list = await open(user)
    expect(search()).toHaveAttribute("aria-expanded", "true")
    expect(search()).toHaveAttribute("aria-controls", list.id)
    expect(search()).toHaveAttribute("aria-autocomplete", "list")
    expect(search()).toHaveFocus()
  })

  it("arrow keys move aria-activedescendant, wrap, and skip disabled options; focus stays in the input", async () => {
    const user = setup()
    renderCombobox()
    await open(user)
    expect(active()).toHaveTextContent("Seoul")
    await user.keyboard("{ArrowDown}")
    expect(active()).toHaveTextContent("Tokyo")
    await user.keyboard("{ArrowDown}")
    expect(active()).toHaveTextContent("Lisbon")
    await user.keyboard("{ArrowDown}")
    expect(active()).toHaveTextContent("Seoul")
    await user.keyboard("{ArrowUp}")
    expect(active()).toHaveTextContent("Lisbon")
    expect(search()).toHaveFocus()
  })

  it("Enter chooses the active option; Escape closes without choosing and returns focus", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderCombobox({ onValueChange })
    await open(user)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    expect(onValueChange).not.toHaveBeenCalled()
    expect(trigger()).toHaveFocus()
    await open(user)
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onValueChange).toHaveBeenCalledWith("tokyo")
  })

  it("disabled options cannot be picked with the pointer", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderCombobox({ onValueChange })
    await open(user)
    expect(option(/Oslo/)).toHaveAttribute("aria-disabled", "true")
    await user.click(option(/Oslo/))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("filters as you type, matches the description too, and shows an empty state", async () => {
    const user = setup()
    renderCombobox({ emptyText: "No city found." })
    await open(user)
    await user.keyboard("nor")
    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(option(/Oslo/)).toBeInTheDocument()
    await user.keyboard("wayland")
    expect(screen.queryAllByRole("option")).toHaveLength(0)
    expect(screen.getByRole("status")).toHaveTextContent("No city found.")
    expect(search()).not.toHaveAttribute("aria-activedescendant")
  })

  it("onSearch hands filtering to the owner and reports every query, then resets on close", async () => {
    const user = setup()
    const onSearch = vi.fn()
    renderCombobox({ onSearch })
    await open(user)
    await user.keyboard("xy")
    expect(onSearch).toHaveBeenLastCalledWith("xy")
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length)
    await user.keyboard("{Escape}")
    expect(onSearch).toHaveBeenLastCalledWith("")
  })

  it("loading marks the list busy and announces it, without hiding results already there", async () => {
    const user = setup()
    renderCombobox({ loading: true, loadingText: "Searching cities" })
    await open(user)
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("status")).toHaveTextContent("Searching cities")
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length)
  })

  it("loading replaces the empty message, because no result is not yet known", async () => {
    const user = setup()
    renderCombobox({ options: [], loading: true, emptyText: "Nothing here" })
    await open(user)
    expect(screen.queryByText("Nothing here")).toBeNull()
  })

  it("keeps the chosen label when async results no longer contain it", async () => {
    const user = setup()
    const { rerender } = render(<Combobox aria-label="City" options={OPTIONS} onSearch={() => {}} />)
    await open(user)
    await user.click(option(/Lisbon/))
    rerender(<Combobox aria-label="City" options={[]} onSearch={() => {}} />)
    expect(slot("combobox-trigger")).toHaveTextContent("Lisbon")
  })

  it("avatar draws media and description in each row", async () => {
    const user = setup()
    renderCombobox({ variant: "avatar" })
    await open(user)
    const row = option(/Seoul/)
    expect(within(row).getByTestId("media-seoul")).toBeInTheDocument()
    expect(within(row).getByText("Korea")).toBeInTheDocument()
  })

  it("plain leaves media and description out", async () => {
    const user = setup()
    renderCombobox({ variant: "plain" })
    await open(user)
    expect(within(option(/Seoul/)).queryByTestId("media-seoul")).toBeNull()
    expect(within(option(/Seoul/)).queryByText("Korea")).toBeNull()
  })

  it("grouped draws named section headers around the options, in keyboard order", async () => {
    const user = setup()
    renderCombobox({ variant: "grouped" })
    await open(user)
    const groups = screen.getAllByRole("group")
    expect(groups.map((group) => group.getAttribute("aria-labelledby"))).toHaveLength(2)
    expect(screen.getByRole("group", { name: "Asia" })).toContainElement(option(/Tokyo/))
    expect(screen.getByRole("group", { name: "Europe" })).toContainElement(option(/Lisbon/))
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(active()).toHaveTextContent("Lisbon")
  })

  it("multiple keeps the list open, toggles each option and reports the whole array", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderCombobox({ multiple: true, onValueChange })
    await open(user)
    await user.click(option(/Seoul/))
    await user.click(option(/Tokyo/))
    expect(onValueChange).toHaveBeenLastCalledWith(["seoul", "tokyo"])
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true")
    expect(option(/Seoul/)).toHaveAttribute("aria-selected", "true")
    await user.click(option(/Seoul/))
    expect(onValueChange).toHaveBeenLastCalledWith(["tokyo"])
  })

  it("tags shows chips with their own remove buttons outside the trigger button", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderCombobox({ variant: "tags", multiple: true, defaultValue: ["seoul", "tokyo"], onValueChange })
    const remove = screen.getByRole("button", { name: "Remove Seoul" })
    expect(slot("combobox-trigger")).not.toContainElement(remove)
    await user.click(remove)
    expect(onValueChange).toHaveBeenLastCalledWith(["tokyo"])
    expect(screen.queryByRole("button", { name: "Remove Seoul" })).toBeNull()
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("tags: Backspace in an empty search removes the last chip", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderCombobox({ variant: "tags", multiple: true, defaultValue: ["seoul", "tokyo"], onValueChange })
    await user.click(slot("combobox-trigger"))
    await screen.findByRole("listbox")
    await user.keyboard("{Backspace}")
    expect(onValueChange).toHaveBeenLastCalledWith(["seoul"])
  })

  it("spring draws one highlight in the active row and carries it with the keyboard", async () => {
    const user = setup()
    renderCombobox({ effect: "spring" })
    await open(user)
    expect(document.querySelectorAll("[data-slot='combobox-highlight']")).toHaveLength(1)
    expect(option(/Seoul/).querySelector("[data-slot='combobox-highlight']")).not.toBeNull()
    await user.keyboard("{ArrowDown}")
    expect(document.querySelectorAll("[data-slot='combobox-highlight']")).toHaveLength(1)
    expect(option(/Tokyo/).querySelector("[data-slot='combobox-highlight']")).not.toBeNull()
  })

  it("spring keeps the highlight but drops the flight under reduced motion", async () => {
    setReducedMotion(true)
    const user = setup()
    renderCombobox({ effect: "spring" })
    await open(user)
    expect(slot("combobox-highlight")).toHaveAttribute("data-reduced", "true")
  })

  it("materialize passes through to the popover", async () => {
    const user = setup()
    renderCombobox({ effect: "materialize" })
    await open(user)
    expect(slot("popover-content")).toHaveAttribute("data-effect", "materialize")
    expect(slot("combobox")).toHaveAttribute("data-effect", "materialize")
  })

  it("posts the value to a form through hidden inputs", () => {
    render(<Combobox aria-label="City" name="city" multiple defaultValue={["seoul", "tokyo"]} options={OPTIONS} />)
    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='hidden'][name='city']")
    expect(Array.from(inputs).map((input) => input.value)).toEqual(["seoul", "tokyo"])
  })

  it("does not open when disabled", async () => {
    const user = setup()
    renderCombobox({ disabled: true })
    expect(trigger()).toBeDisabled()
    await user.click(trigger())
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})
