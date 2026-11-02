import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Label } from "./label"

describe("Label", () => {
  it("focuses the control it is bound to when clicked", async () => {
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <input id="name" />
      </>,
    )
    await userEvent.click(screen.getByText("Name"))
    expect(screen.getByRole("textbox")).toHaveFocus()
  })

  it("names the control for assistive tech", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    )
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument()
  })

  it("renders its text as a label element with the label slot", () => {
    render(<Label>Plain caption</Label>)
    const label = screen.getByText("Plain caption")
    expect(label.tagName).toBe("LABEL")
    expect(label).toHaveAttribute("data-slot", "label")
  })

  it("dims itself when the peer control is disabled", () => {
    render(<Label htmlFor="x">Caption</Label>)
    expect(screen.getByText("Caption")).toHaveClass("peer-disabled:opacity-50")
  })
})
