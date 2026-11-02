import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Checkbox } from "./checkbox"

const indicatorOf = (element: HTMLElement) => element.querySelector("[data-slot='checkbox-indicator']")

const strokeOf = (box: HTMLElement, part: "check" | "dash") =>
  box.querySelector<SVGPathElement>(`[data-slot='checkbox-${part}']`)
/** motion draws pathLength through the dash array, so its first length is how much of the stroke is showing. */
const drawnLength = (path: SVGPathElement | null) => Number.parseFloat(path?.getAttribute("stroke-dasharray") ?? "0")

describe("Checkbox effect=draw", () => {
  it("marks the root and draws the check stroke to full length when ticked", async () => {
    render(<Checkbox aria-label="Accept terms" effect="draw" />)
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(box).toHaveAttribute("data-effect", "draw")
    expect(strokeOf(box, "check")).toHaveAttribute("data-drawn", "false")
    expect(drawnLength(strokeOf(box, "check"))).toBe(0)
    await userEvent.click(box)
    expect(box).toHaveAttribute("aria-checked", "true")
    expect(strokeOf(box, "check")).toHaveAttribute("data-drawn", "true")
    await waitFor(() => expect(drawnLength(strokeOf(box, "check"))).toBeCloseTo(1, 1))
  })

  it("keeps the stroke mounted while unticking, so it can retract", async () => {
    render(<Checkbox aria-label="Accept terms" effect="draw" defaultChecked />)
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(drawnLength(strokeOf(box, "check"))).toBe(1)
    await userEvent.click(box)
    expect(box).toHaveAttribute("aria-checked", "false")
    expect(strokeOf(box, "check")).toHaveAttribute("data-drawn", "false")
    await waitFor(() => expect(drawnLength(strokeOf(box, "check"))).toBeCloseTo(0, 1))
  })

  it("draws a dash for indeterminate, and reports aria-checked mixed", () => {
    render(<Checkbox aria-label="Select all" effect="draw" checked="indeterminate" />)
    const box = screen.getByRole("checkbox", { name: "Select all" })
    expect(box).toHaveAttribute("aria-checked", "mixed")
    expect(strokeOf(box, "dash")).toHaveAttribute("data-drawn", "true")
    expect(strokeOf(box, "check")).toHaveAttribute("data-drawn", "false")
    expect(box).toHaveClass("data-[state=indeterminate]:bg-mise")
  })

  it("follows the owner when controlled, and stays inert while disabled", async () => {
    const onCheckedChange = vi.fn()
    const { rerender } = render(
      <Checkbox aria-label="Accept terms" effect="draw" checked={false} onCheckedChange={onCheckedChange} />,
    )
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    await userEvent.click(box)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(strokeOf(box, "check")).toHaveAttribute("data-drawn", "false")
    rerender(<Checkbox aria-label="Accept terms" effect="draw" checked={false} disabled onCheckedChange={onCheckedChange} />)
    await userEvent.click(box)
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
  })

  it("toggles with Space and keeps the check rendered under reduced motion", async () => {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const { Checkbox: FreshCheckbox } = await import("./checkbox")
    vi.doUnmock("motion/react")
    render(<FreshCheckbox aria-label="Accept terms" effect="draw" />)
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    await userEvent.tab()
    await userEvent.keyboard(" ")
    expect(box).toHaveAttribute("aria-checked", "true")
    await waitFor(() => expect(drawnLength(strokeOf(box, "check"))).toBe(1))
  })
})

describe("Checkbox", () => {
  it("toggles aria-checked on each click", async () => {
    render(<Checkbox aria-label="Accept terms" />)
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(box).toHaveAttribute("aria-checked", "false")
    await userEvent.click(box)
    expect(box).toHaveAttribute("aria-checked", "true")
    await userEvent.click(box)
    expect(box).toHaveAttribute("aria-checked", "false")
  })

  it("reports the next value when controlled and leaves the state to the owner", async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Accept terms" checked={false} onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    await userEvent.click(box)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(box).toHaveAttribute("aria-checked", "false")
  })

  it("does not change while disabled", async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Accept terms" disabled onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    await userEvent.click(box)
    expect(box).toBeDisabled()
    expect(box).toHaveAttribute("aria-checked", "false")
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it("shows the check mark only while checked", () => {
    const { rerender } = render(<Checkbox aria-label="Accept terms" checked={false} />)
    const box = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(indicatorOf(box)).toBeNull()
    rerender(<Checkbox aria-label="Accept terms" checked />)
    expect(indicatorOf(box)).not.toBeNull()
    expect(box).toHaveAttribute("data-state", "checked")
  })
})
