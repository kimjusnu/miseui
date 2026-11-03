import { createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PanelStack, nearestPanel, wheelStep, type PanelStackPanel } from "./panel-stack"

const PANELS: readonly PanelStackPanel[] = [
  { title: "The problem", kicker: "Start here", content: <p>Half of new teams never invited anyone.</p> },
  { title: "The approach", content: <input aria-label="Note" /> },
  { title: "The result", content: <p>Two out of three teams now invite someone.</p> },
]

const PANEL_WIDTH = 300

/** jsdom has no layout: panels report their position, and scrolling the track fires what a browser would. */
function layOut() {
  const track = document.querySelector("[data-slot='panel-stack-track']") as HTMLElement
  document.querySelectorAll<HTMLElement>("[data-slot='panel-stack-panel']").forEach((panel, index) => {
    Object.defineProperty(panel, "offsetLeft", { configurable: true, value: index * PANEL_WIDTH })
  })
  const scrollTo = vi.fn(({ left }: ScrollToOptions) => {
    track.scrollLeft = left ?? 0
    fireEvent.scroll(track)
  })
  track.scrollTo = scrollTo as unknown as typeof track.scrollTo
  return { track, scrollTo }
}

const count = () => document.querySelector("[data-slot='panel-stack-count']")

describe("PanelStack", () => {
  it("shows every panel in a named group and starts on the first", () => {
    render(<PanelStack panels={PANELS} label="Case study" />)
    expect(screen.getByRole("group", { name: "Case study" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "1 of 3: The problem" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "The result" })).toBeInTheDocument()
    expect(count()).toHaveTextContent("01 / 03")
    expect(screen.getByRole("button", { name: "Previous panel" })).toBeDisabled()
  })

  it("steps with the buttons, scrolls to the panel and announces it", async () => {
    render(<PanelStack panels={PANELS} />)
    const { scrollTo } = layOut()
    await userEvent.click(screen.getByRole("button", { name: "Next panel" }))
    expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: "smooth" })
    expect(count()).toHaveTextContent("02 / 03")
    expect(screen.getByText("2 of 3: The approach", { selector: "[aria-live]" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Next panel" }))
    expect(screen.getByRole("button", { name: "Next panel" })).toBeDisabled()
  })

  it("follows a swipe: the count comes from where the track has scrolled", () => {
    render(<PanelStack panels={PANELS} />)
    const { track } = layOut()
    track.scrollLeft = 590
    fireEvent.scroll(track)
    expect(count()).toHaveTextContent("03 / 03")
  })

  it("moves with the arrow keys, but not while someone types", async () => {
    render(<PanelStack panels={PANELS} />)
    layOut()
    screen.getByRole("group").focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(count()).toHaveTextContent("02 / 03")
    await userEvent.click(screen.getByRole("textbox", { name: "Note" }))
    await userEvent.keyboard("{ArrowRight}")
    expect(count()).toHaveTextContent("02 / 03")
    screen.getByRole("group").focus()
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(count()).toHaveTextContent("01 / 03")
  })

  it("draws a different stack for each variant", () => {
    const { rerender } = render(<PanelStack panels={PANELS} variant="deck" />)
    const firstPanel = () => document.querySelector("[data-slot='panel-stack-panel']") as HTMLElement
    expect(firstPanel().className).toContain("w-full")
    expect(firstPanel().className).toContain("border-y")

    rerender(<PanelStack panels={PANELS} variant="peek" />)
    expect(firstPanel().className).toContain("w-[85%]")
    expect(firstPanel().className).toContain("rounded-lg")

    rerender(<PanelStack panels={PANELS} variant="overlay" trigger={<button type="button">Open</button>} />)
    expect(firstPanel()).toBeNull()
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument()
  })

  it("opens over the page as a dialog and comes back with focus on the trigger", async () => {
    const onOpenChange = vi.fn()
    render(<PanelStack panels={PANELS} variant="overlay" label="Case study" trigger={<button type="button">Open</button>} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog", { name: "Case study" })
    expect(dialog).toBeInTheDocument()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole("heading", { name: "The problem" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus()
  })

  it("closes the overlay with Escape", async () => {
    render(<PanelStack panels={PANELS} variant="overlay" defaultOpen />)
    await screen.findByRole("dialog")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 })
  })

  it("turns one panel per wheel gesture with the wheel effect, and lets go at the last", () => {
    render(<PanelStack panels={PANELS} effect="wheel" />)
    const { track } = layOut()
    const wheel = createEvent.wheel(track, { deltaY: 100, bubbles: true, cancelable: true })
    fireEvent(track, wheel)
    expect(wheel.defaultPrevented).toBe(true)
    expect(count()).toHaveTextContent("02 / 03")
    const second = createEvent.wheel(track, { deltaY: 100, bubbles: true, cancelable: true })
    fireEvent(track, second)
    expect(second.defaultPrevented).toBe(true)
    expect(count()).toHaveTextContent("02 / 03")
    track.scrollLeft = 600
    fireEvent.scroll(track)
    const last = createEvent.wheel(track, { deltaY: 100, bubbles: true, cancelable: true })
    fireEvent(track, last)
    expect(last.defaultPrevented).toBe(false)
  })

  it("leaves the wheel alone without the effect", () => {
    render(<PanelStack panels={PANELS} />)
    const { track } = layOut()
    const wheel = createEvent.wheel(track, { deltaY: 100, bubbles: true, cancelable: true })
    fireEvent(track, wheel)
    expect(wheel.defaultPrevented).toBe(false)
    expect(count()).toHaveTextContent("01 / 03")
  })

  it("decides what a wheel event should do", () => {
    const base = { deltaX: 0, deltaY: 60, index: 1, count: 3, innerScroll: false }
    expect(wheelStep(base)).toBe(1)
    expect(wheelStep({ ...base, deltaY: -60 })).toBe(-1)
    expect(wheelStep({ ...base, deltaY: 3 })).toBe(0)
    expect(wheelStep({ ...base, deltaX: 80 })).toBeNull()
    expect(wheelStep({ ...base, innerScroll: true })).toBeNull()
    expect(wheelStep({ ...base, index: 2 })).toBeNull()
    expect(wheelStep({ ...base, index: 0, deltaY: -60 })).toBeNull()
  })

  it("finds the nearest panel from a scroll position, in either direction", () => {
    expect(nearestPanel(0, [0, 300, 600])).toBe(0)
    expect(nearestPanel(160, [0, 300, 600])).toBe(1)
    expect(nearestPanel(-590, [0, -300, -600])).toBe(2)
  })
})
