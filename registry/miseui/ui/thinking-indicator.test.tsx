import { render, screen } from "@testing-library/react"
import { ThinkingIndicator } from "./thinking-indicator"

describe("ThinkingIndicator", () => {
  it("announces the default label for its state", () => {
    render(<ThinkingIndicator state="searching" />)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveAttribute("data-state", "searching")
    expect(status).toHaveTextContent("Searching…")
  })

  it("uses a custom label when given", () => {
    render(<ThinkingIndicator label="Reading 3 files…" />)
    expect(screen.getByRole("status")).toHaveTextContent("Reading 3 files…")
  })

  it("renders three dots while active and none when done", () => {
    const { rerender } = render(<ThinkingIndicator state="thinking" />)
    expect(screen.getAllByTestId("thinking-dot")).toHaveLength(3)
    rerender(<ThinkingIndicator state="done" />)
    expect(screen.queryAllByTestId("thinking-dot")).toHaveLength(0)
    expect(screen.getByRole("status")).toHaveTextContent("Done")
  })

  it("marks the error state so styling and assistive tech can react", () => {
    render(<ThinkingIndicator state="error" />)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("data-state", "error")
    expect(status).toHaveTextContent("Something went wrong")
  })
})
