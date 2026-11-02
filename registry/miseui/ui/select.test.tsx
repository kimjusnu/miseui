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
