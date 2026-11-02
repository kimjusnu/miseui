import { render, screen } from "@testing-library/react"
import { ReasoningSteps, type ReasoningStep } from "./reasoning-steps"

const IN_PROGRESS: readonly ReasoningStep[] = [
  { id: "read", label: "Reading the question", status: "done" },
  { id: "search", label: "Searching docs", status: "active", detail: "3 sources so far" },
  { id: "write", label: "Writing the answer", status: "pending" },
]

const FINISHED: readonly ReasoningStep[] = IN_PROGRESS.map((step) => ({ ...step, status: "done" }))

describe("ReasoningSteps", () => {
  it("names the active step in the header while work is in progress", () => {
    render(<ReasoningSteps steps={IN_PROGRESS} />)
    expect(screen.getByText("3 steps · Searching docs")).toBeInTheDocument()
  })

  it("says done in the header once every step is done", () => {
    render(<ReasoningSteps steps={FINISHED} />)
    expect(screen.getByText("3 steps · done")).toBeInTheDocument()
  })

  it("prefers a custom summary over the generated one", () => {
    render(<ReasoningSteps steps={FINISHED} summary="How I got here" />)
    expect(screen.getByText("How I got here")).toBeInTheDocument()
    expect(screen.queryByText("3 steps · done")).not.toBeInTheDocument()
  })

  it("renders one list item per step with its status when expanded", () => {
    render(<ReasoningSteps steps={IN_PROGRESS} defaultOpen />)
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.getAttribute("data-status"))).toEqual(["done", "active", "pending"])
    for (const item of items) expect(item).toBeVisible()
  })

  it("shows the detail line under a step that has one", () => {
    render(<ReasoningSteps steps={IN_PROGRESS} defaultOpen />)
    expect(screen.getByText("3 sources so far")).toBeInTheDocument()
    expect(screen.getByText("Searching docs").closest("li")).toContainElement(screen.getByText("3 sources so far"))
  })
})
