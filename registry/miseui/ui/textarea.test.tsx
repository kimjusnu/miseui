import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Textarea } from "./textarea"

describe("Textarea", () => {
  it("accepts multi-line typing and reports changes", async () => {
    const onChange = vi.fn()
    render(<Textarea aria-label="Notes" onChange={onChange} />)
    const textarea = screen.getByRole("textbox", { name: "Notes" })
    await userEvent.type(textarea, "one{Enter}two")
    expect(textarea).toHaveValue("one\ntwo")
    expect(onChange).toHaveBeenCalled()
  })

  it("ignores typing while disabled", async () => {
    render(<Textarea aria-label="Notes" disabled />)
    const textarea = screen.getByRole("textbox", { name: "Notes" })
    await userEvent.type(textarea, "hi")
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveValue("")
  })

  it("exposes the invalid state to assistive tech and styling", () => {
    render(<Textarea aria-label="Notes" aria-invalid />)
    const textarea = screen.getByRole("textbox", { name: "Notes" })
    expect(textarea).toBeInvalid()
    expect(textarea).toHaveClass("aria-invalid:border-destructive")
  })

  it("renders a textarea element with its slot", () => {
    render(<Textarea aria-label="Notes" placeholder="Say more" />)
    const textarea = screen.getByPlaceholderText("Say more")
    expect(textarea.tagName).toBe("TEXTAREA")
    expect(textarea).toHaveAttribute("data-slot", "textarea")
  })
})
