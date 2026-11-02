import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Switch } from "./switch"

describe("Switch", () => {
  it("toggles aria-checked on click", async () => {
    render(<Switch aria-label="Wi-Fi" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    expect(control).toHaveAttribute("aria-checked", "false")
    await userEvent.click(control)
    expect(control).toHaveAttribute("aria-checked", "true")
    expect(control).toHaveAttribute("data-state", "checked")
  })

  it("toggles with the Space key once focused", async () => {
    render(<Switch aria-label="Wi-Fi" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.tab()
    expect(control).toHaveFocus()
    await userEvent.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "true")
    await userEvent.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "false")
  })

  it("reports the next value when controlled and leaves the state to the owner", async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Wi-Fi" checked onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.click(control)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    expect(control).toHaveAttribute("aria-checked", "true")
  })

  it("does not change while disabled", async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Wi-Fi" disabled onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.click(control)
    expect(control).toBeDisabled()
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
