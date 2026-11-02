import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

// jsdom has no ResizeObserver; Radix positions the panel with it.
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function renderPopover() {
  return render(
    <>
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent>Filter options</PopoverContent>
      </Popover>
      <button type="button">Outside</button>
    </>,
  )
}

describe("Popover", () => {
  it("opens from the trigger and closes on a second click", async () => {
    const user = userEvent.setup()
    renderPopover()
    const trigger = screen.getByRole("button", { name: "Filters" })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.click(trigger)
    expect(await screen.findByRole("dialog")).toHaveTextContent("Filter options")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    await user.click(trigger)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("closes when the user clicks outside", async () => {
    const user = userEvent.setup()
    renderPopover()
    await user.click(screen.getByRole("button", { name: "Filters" }))
    await screen.findByRole("dialog")
    await user.click(screen.getByRole("button", { name: "Outside" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("closes with Escape and hands focus back to the trigger", async () => {
    const user = userEvent.setup()
    renderPopover()
    const trigger = screen.getByRole("button", { name: "Filters" })
    await user.click(trigger)
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it("exposes data-slot hooks on trigger and content", async () => {
    const user = userEvent.setup()
    renderPopover()
    const trigger = screen.getByRole("button", { name: "Filters" })
    expect(trigger).toHaveAttribute("data-slot", "popover-trigger")
    await user.click(trigger)
    expect(await screen.findByRole("dialog")).toHaveAttribute("data-slot", "popover-content")
  })
})
