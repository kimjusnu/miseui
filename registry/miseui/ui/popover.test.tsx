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

  function renderMaterialize() {
    return render(
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent effect="materialize">Filter options</PopoverContent>
      </Popover>,
    )
  }

  it("materialize grows from the trigger's origin, with a mirrored exit", async () => {
    const user = userEvent.setup()
    renderMaterialize()
    await user.click(screen.getByRole("button", { name: "Filters" }))
    const surface = await screen.findByRole("dialog")
    expect(surface).toHaveAttribute("data-effect", "materialize")
    expect(surface).toHaveClass("origin-(--radix-popover-content-transform-origin)")
    expect(surface).toHaveClass("data-[state=open]:animate-in", "fade-in-0", "zoom-in-90", "blur-in-sm")
    expect(surface).toHaveClass("data-[state=closed]:animate-out", "fade-out-0", "zoom-out-90", "blur-out-sm")
  })

  it("materialize cross-fades only under reduced motion and drops the blur under reduced transparency", async () => {
    const user = userEvent.setup()
    renderMaterialize()
    await user.click(screen.getByRole("button", { name: "Filters" }))
    const surface = await screen.findByRole("dialog")
    expect(surface).toHaveClass("motion-reduce:zoom-in-100", "motion-reduce:zoom-out-100", "motion-reduce:blur-in-0")
    expect(surface).toHaveClass("[@media(prefers-reduced-transparency:reduce)]:blur-out-0")
  })

  it("materialize still closes with Escape and returns focus", async () => {
    const user = userEvent.setup()
    renderMaterialize()
    const trigger = screen.getByRole("button", { name: "Filters" })
    await user.click(trigger)
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it("keeps the plain entrance without the prop", async () => {
    const user = userEvent.setup()
    renderPopover()
    await user.click(screen.getByRole("button", { name: "Filters" }))
    const surface = await screen.findByRole("dialog")
    expect(surface).not.toHaveAttribute("data-effect")
    expect(surface).toHaveClass("data-[state=open]:zoom-in-95")
    expect(surface).not.toHaveClass("blur-in-sm")
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
