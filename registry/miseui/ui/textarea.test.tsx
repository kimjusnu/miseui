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

describe("Textarea effect=glow", () => {
  it("blooms a mise ring and halo on focus, growing through the base box-shadow transition", () => {
    render(<Textarea aria-label="Field" effect="glow" />)
    const field = screen.getByRole("textbox", { name: "Field" })
    expect(field).toHaveAttribute("data-effect", "glow")
    expect(field).toHaveClass("focus-visible:border-mise", "focus-visible:ring-mise/35", "focus-visible:ring-4")
    expect(field).not.toHaveClass("focus-visible:ring-ring/50")
    expect(field.className).toContain("focus-visible:shadow-[0_0_28px_4px_color-mix(in_oklab,var(--mise)_45%,transparent)]")
  })

  it("keeps errors red, drops the transition under reduced motion and the halo under reduced transparency", () => {
    render(<Textarea aria-label="Field" effect="glow" aria-invalid />)
    expect(screen.getByRole("textbox", { name: "Field" })).toHaveClass(
      "aria-invalid:focus-visible:ring-destructive/30",
      "aria-invalid:focus-visible:shadow-none",
      "motion-reduce:transition-none",
      "[@media(prefers-reduced-transparency:reduce)]:focus-visible:shadow-none",
    )
  })

  it("adds no wrapper", () => {
    const { container } = render(<Textarea aria-label="Field" effect="glow" />)
    expect(screen.getByRole("textbox", { name: "Field" }).parentElement).toBe(container)
  })
})

describe("Textarea effect=ai", () => {
  it("swaps the plain placeholder for a shimmering one while pending, and back", () => {
    const { rerender } = render(<Textarea aria-label="Field" effect="ai" placeholder="Drafting a title" />)
    const field = screen.getByRole("textbox", { name: "Field" })
    expect(screen.queryByTestId("textarea-shimmer")).not.toBeInTheDocument()
    expect(field).not.toHaveClass("placeholder:text-transparent")
    expect(field).not.toHaveAttribute("aria-busy")

    rerender(<Textarea aria-label="Field" effect="ai" placeholder="Drafting a title" pending />)
    expect(screen.getByRole("textbox", { name: "Field" })).toBe(field)
    expect(screen.getByTestId("shimmer-band")).toHaveTextContent("Drafting a title")
    expect(field).toHaveClass("placeholder:text-transparent", "peer")
    expect(field).toHaveAttribute("aria-busy", "true")
    expect(field).toHaveAttribute("placeholder", "Drafting a title")

    rerender(<Textarea aria-label="Field" effect="ai" placeholder="Drafting a title" />)
    expect(screen.queryByTestId("textarea-shimmer")).not.toBeInTheDocument()
    expect(field).not.toHaveClass("placeholder:text-transparent")
  })

  it("keeps the overlay out of the way: hidden from assistive tech, no pointer, gone once text is typed", () => {
    render(<Textarea aria-label="Field" effect="ai" placeholder="Drafting" pending />)
    const overlay = screen.getByTestId("textarea-shimmer")
    expect(overlay).toHaveAttribute("aria-hidden", "true")
    expect(overlay).toHaveClass("pointer-events-none", "hidden")
    expect(overlay.className).toContain("peer-placeholder-shown:")
  })

  it("keeps the same field element and typed text across pending", async () => {
    const { rerender } = render(<Textarea aria-label="Field" effect="ai" placeholder="Drafting" />)
    const field = screen.getByRole("textbox", { name: "Field" })
    await userEvent.type(field, "hi")
    rerender(<Textarea aria-label="Field" effect="ai" placeholder="Drafting" pending />)
    expect(screen.getByRole("textbox", { name: "Field" })).toBe(field)
    expect(field).toHaveValue("hi")
  })

  it("does not leak pending to the DOM, and ignores it without the effect", () => {
    const { container } = render(<Textarea aria-label="Field" placeholder="Plain" pending />)
    const field = screen.getByRole("textbox", { name: "Field" })
    expect(field).not.toHaveAttribute("pending")
    expect(field).not.toHaveAttribute("aria-busy")
    expect(field.parentElement).toBe(container)
    expect(screen.queryByTestId("shimmer-band")).not.toBeInTheDocument()
  })

  it("has nothing to shimmer without a placeholder", () => {
    render(<Textarea aria-label="Field" effect="ai" pending />)
    expect(screen.queryByTestId("textarea-shimmer")).not.toBeInTheDocument()
  })
})
