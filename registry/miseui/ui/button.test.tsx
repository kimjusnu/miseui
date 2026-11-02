import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "./button"

describe("Button", () => {
  it("renders its label and calls onClick", async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("ignores clicks while disabled", async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("renders the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/docs">Docs</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Docs" })
    expect(link).toHaveAttribute("data-slot", "button")
  })

  it("applies variant and size classes", () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    )
    const button = screen.getByRole("button", { name: "Delete" })
    expect(button).toHaveClass("bg-destructive")
    expect(button).toHaveAttribute("data-variant", "destructive")
  })
})
