import { render, screen } from "@testing-library/react"
import { Separator } from "./separator"

const parts = (element: HTMLElement, part: string) => element.querySelectorAll(`[data-part="${part}"]`)

describe("Separator semantics", () => {
  it("exposes a separator role, with the vertical orientation announced", () => {
    render(<Separator orientation="vertical" />)
    const rule = screen.getByRole("separator")
    expect(rule).toHaveAttribute("aria-orientation", "vertical")
    expect(rule).toHaveAttribute("data-slot", "separator")
  })

  it("leaves the accessibility tree when decorative", () => {
    render(<Separator decorative data-testid="rule" />)
    expect(screen.queryByRole("separator")).not.toBeInTheDocument()
    expect(screen.getByTestId("rule")).toHaveAttribute("role", "none")
  })

  it("names a label separator from its text, since separator children are presentational", () => {
    render(<Separator variant="label">Or continue with email</Separator>)
    expect(screen.getByRole("separator", { name: "Or continue with email" })).toBeInTheDocument()
  })

  it("prefers an explicit name when the label is not text", () => {
    render(
      <Separator variant="label" aria-label="Older messages">
        <svg />
      </Separator>,
    )
    expect(screen.getByRole("separator", { name: "Older messages" })).toBeInTheDocument()
  })
})

describe("Separator designs", () => {
  it("draws each rule with a different structure", () => {
    const { rerender } = render(<Separator />)
    const rule = () => screen.getByRole("separator")
    expect(rule()).toHaveClass("h-px", "bg-border")
    rerender(<Separator variant="dashed" />)
    expect(rule()).toHaveClass("border-t", "border-dashed")
    expect(rule()).not.toHaveClass("bg-border")
    rerender(<Separator variant="gradient" />)
    expect(rule()).toHaveClass("bg-linear-to-r", "via-border")
    rerender(<Separator variant="label">Today</Separator>)
    expect(parts(rule(), "rule")).toHaveLength(2)
    expect(rule()).toHaveAttribute("data-variant", "label")
  })

  it("label drops the rule on the side it is aligned to", () => {
    const { rerender } = render(
      <Separator variant="label" align="start">
        Today
      </Separator>,
    )
    const rule = screen.getByRole("separator")
    expect(parts(rule, "rule")).toHaveLength(1)
    expect(rule.firstElementChild).toHaveAttribute("data-part", "label")
    rerender(
      <Separator variant="label" align="end">
        Today
      </Separator>,
    )
    expect(rule.lastElementChild).toHaveAttribute("data-part", "label")
  })

  it("turns every design on its axis", () => {
    const { rerender } = render(<Separator orientation="vertical" />)
    const rule = () => screen.getByRole("separator")
    expect(rule()).toHaveClass("w-px", "self-stretch")
    rerender(<Separator orientation="vertical" variant="dashed" />)
    expect(rule()).toHaveClass("border-l")
    rerender(<Separator orientation="vertical" variant="gradient" />)
    expect(rule()).toHaveClass("bg-linear-to-b")
    rerender(
      <Separator orientation="vertical" variant="label">
        Or
      </Separator>,
    )
    expect(rule()).toHaveClass("flex-col")
  })

  it("does not render stray children inside a plain rule", () => {
    render(<Separator>Ignored</Separator>)
    expect(screen.getByRole("separator")).toBeEmptyDOMElement()
  })
})
