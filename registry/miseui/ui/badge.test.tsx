import { render, screen } from "@testing-library/react"
import { Badge } from "./badge"

describe("Badge", () => {
  it("renders its text with the badge slot", () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText("New")
    expect(badge).toHaveAttribute("data-slot", "badge")
    expect(badge.tagName).toBe("SPAN")
  })

  it("falls back to the default variant", () => {
    render(<Badge>Draft</Badge>)
    expect(screen.getByText("Draft")).toHaveAttribute("data-variant", "default")
  })

  it("exposes the chosen variant as a data attribute and class", () => {
    render(<Badge variant="mise">Beta</Badge>)
    const badge = screen.getByText("Beta")
    expect(badge).toHaveAttribute("data-variant", "mise")
    expect(badge).toHaveClass("bg-mise")
  })

  it("renders the child element when asChild is set", () => {
    render(
      <Badge asChild variant="outline">
        <a href="/changelog">Changelog</a>
      </Badge>,
    )
    const link = screen.getByRole("link", { name: "Changelog" })
    expect(link).toHaveAttribute("data-slot", "badge")
    expect(link).toHaveAttribute("data-variant", "outline")
  })
})
