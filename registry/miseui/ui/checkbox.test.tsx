import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Checkbox } from "./checkbox"

const indicatorOf = (element: HTMLElement) => element.querySelector("[data-slot='checkbox-indicator']")

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
