import { fireEvent, render, screen } from "@testing-library/react"
import { BlockPreview } from "./block-preview"

const DESIGNS = [
  { name: "split", principle: "Serial position", use: "When there is a product to show." },
  { name: "minimal", principle: "Focus", use: "When there is nothing to show yet." },
]

function renderPreview(designs?: typeof DESIGNS) {
  return render(
    <BlockPreview name="landing-hero" designs={designs}>
      {(variant) => <p data-testid="demo">{variant ?? "none"}</p>}
    </BlockPreview>,
  )
}

describe("BlockPreview variants", () => {
  it("starts on the first design, which is what a block renders without a prop", () => {
    renderPreview(DESIGNS)
    expect(screen.getByTestId("demo")).toHaveTextContent("split")
    expect(screen.getByRole("button", { name: "split" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "minimal" })).toHaveAttribute("aria-pressed", "false")
  })

  it("passes the chosen design to the block", () => {
    renderPreview(DESIGNS)
    fireEvent.click(screen.getByRole("button", { name: "minimal" }))
    expect(screen.getByTestId("demo")).toHaveTextContent("minimal")
    expect(screen.getByRole("button", { name: "minimal" })).toHaveAttribute("aria-pressed", "true")
  })

  it("opens the design on screen in the full-screen tab, not always the first one", () => {
    renderPreview(DESIGNS)
    const link = screen.getByRole("link", { name: /full screen/i })
    expect(link).toHaveAttribute("href", "/preview/landing-hero")
    fireEvent.click(screen.getByRole("button", { name: "minimal" }))
    expect(link).toHaveAttribute("href", "/preview/landing-hero?variant=minimal")
  })

  it("shows no switcher for a block with one design", () => {
    renderPreview()
    expect(screen.getByTestId("demo")).toHaveTextContent("none")
    expect(screen.queryByRole("group", { name: "Design" })).not.toBeInTheDocument()
  })
})
