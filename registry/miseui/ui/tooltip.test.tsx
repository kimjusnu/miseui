import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

/** jsdom reports every rect at (0, 0), so a pointer must be moved explicitly to leave the hover grace area. */
const FAR_AWAY = { clientX: 500, clientY: 500 }

// jsdom has no ResizeObserver; Radix measures the arrow with it.
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

function renderTooltip() {
  return render(
    <>
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>
      <p>Elsewhere</p>
    </>,
  )
}

describe("Tooltip", () => {
  it("stays hidden until the trigger is hovered", async () => {
    const user = userEvent.setup()
    renderTooltip()
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    await user.hover(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Saves the draft")
  })

  it("disappears once the pointer moves somewhere else", async () => {
    const user = userEvent.setup()
    renderTooltip()
    const trigger = screen.getByRole("button", { name: "Save" })
    await user.hover(trigger)
    await screen.findByRole("tooltip")
    // Content stays hoverable, so the tooltip only closes once the pointer is clearly outside the grace area.
    await user.unhover(trigger)
    await user.pointer({ target: screen.getByText("Elsewhere"), coords: FAR_AWAY })
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument())
  })

  it("opens on keyboard focus so it works without a mouse", async () => {
    const user = userEvent.setup()
    renderTooltip()
    await user.tab()
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Saves the draft")
  })

  it("materialize grows from the trigger's origin, with scale, blur and opacity on both enter and exit", async () => {
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent effect="materialize">Saves the draft</TooltipContent>
      </Tooltip>,
    )
    await user.hover(screen.getByRole("button", { name: "Save" }))
    await screen.findByRole("tooltip")
    const surface = document.querySelector("[data-slot='tooltip-content']")
    expect(surface).toHaveAttribute("data-effect", "materialize")
    expect(surface).toHaveClass("origin-(--radix-tooltip-content-transform-origin)")
    expect(surface).toHaveClass("animate-in", "fade-in-0", "zoom-in-75", "blur-in-xs")
    expect(surface).toHaveClass("data-[state=closed]:animate-out", "fade-out-0", "zoom-out-75", "blur-out-xs")
  })

  it("materialize runs its enter unconditionally, because tooltip states are never plain open", async () => {
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent effect="materialize">Saves the draft</TooltipContent>
      </Tooltip>,
    )
    await user.hover(screen.getByRole("button", { name: "Save" }))
    await screen.findByRole("tooltip")
    const surface = document.querySelector("[data-slot='tooltip-content']")
    expect(surface?.getAttribute("data-state")).toMatch(/^(delayed|instant)-open$/)
    expect(surface?.className).not.toContain("data-[state=open]:animate-in")
  })

  it("materialize cross-fades only under reduced motion and drops the blur under reduced transparency", async () => {
    const user = userEvent.setup()
    render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent effect="materialize">Saves the draft</TooltipContent>
      </Tooltip>,
    )
    await user.hover(screen.getByRole("button", { name: "Save" }))
    await screen.findByRole("tooltip")
    const surface = document.querySelector("[data-slot='tooltip-content']")
    expect(surface).toHaveClass("motion-reduce:zoom-in-100", "motion-reduce:blur-in-0", "motion-reduce:blur-out-0")
    expect(surface).toHaveClass("[@media(prefers-reduced-transparency:reduce)]:blur-in-0")
  })

  it("keeps the plain entrance without the prop", async () => {
    const user = userEvent.setup()
    renderTooltip()
    await user.hover(screen.getByRole("button", { name: "Save" }))
    await screen.findByRole("tooltip")
    const surface = document.querySelector("[data-slot='tooltip-content']")
    expect(surface).not.toHaveAttribute("data-effect")
    expect(surface).toHaveClass("zoom-in-95")
    expect(surface).not.toHaveClass("blur-in-xs")
  })

  it("marks the trigger with a data-slot hook", () => {
    renderTooltip()
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-slot", "tooltip-trigger")
  })
})
