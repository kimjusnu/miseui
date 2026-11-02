import { render, screen } from "@testing-library/react"
import { Skeleton } from "./skeleton"

describe("Skeleton", () => {
  it("is hidden from assistive technology", () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true")
  })

  it("pulses by default and merges custom classes", () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-32" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveClass("animate-pulse", "bg-accent", "h-4", "w-32")
  })

  it("lets a custom radius win over the default", () => {
    render(<Skeleton data-testid="skeleton" className="rounded-full" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveClass("rounded-full")
    expect(skeleton).not.toHaveClass("rounded-md")
  })

  it("exposes a data-slot hook and forwards div props", () => {
    render(<Skeleton data-testid="skeleton" title="Loading" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveAttribute("data-slot", "skeleton")
    expect(skeleton).toHaveAttribute("title", "Loading")
  })
})
