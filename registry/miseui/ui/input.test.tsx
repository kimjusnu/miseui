import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Input } from "./input"

describe("Input", () => {
  it("accepts typing and reports every change", async () => {
    const onChange = vi.fn()
    render(<Input aria-label="Email" onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: "Email" })
    await userEvent.type(input, "hi")
    expect(input).toHaveValue("hi")
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it("ignores typing while disabled", async () => {
    const onChange = vi.fn()
    render(<Input aria-label="Email" disabled onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: "Email" })
    await userEvent.type(input, "hi")
    expect(input).toBeDisabled()
    expect(input).toHaveValue("")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("exposes the invalid state to assistive tech and styling", () => {
    render(<Input aria-label="Email" aria-invalid />)
    const input = screen.getByRole("textbox", { name: "Email" })
    expect(input).toBeInvalid()
    expect(input).toHaveClass("aria-invalid:border-destructive")
  })

  it("keeps the native type and the input slot", () => {
    render(<Input aria-label="Email" type="email" />)
    const input = screen.getByRole("textbox", { name: "Email" })
    expect(input).toHaveAttribute("type", "email")
    expect(input).toHaveAttribute("data-slot", "input")
  })
})
