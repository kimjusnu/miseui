import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ToolCallCard, type ToolCallStatus } from "./tool-call-card"

const STATUSES: readonly ToolCallStatus[] = ["running", "success", "error"]

describe("ToolCallCard", () => {
  it("labels the summary with the tool name and status, and exposes data-status", () => {
    const { rerender } = render(<ToolCallCard name="search_web" status="running" />)
    for (const status of STATUSES) {
      rerender(<ToolCallCard name="search_web" status={status} />)
      const summary = screen.getByLabelText(`search_web: ${status}`)
      expect(summary.closest("details")).toHaveAttribute("data-status", status)
    }
  })

  it("reveals input and output when the summary is clicked", async () => {
    const user = userEvent.setup()
    render(
      <ToolCallCard
        name="read_file"
        status="success"
        input={{ path: "README.md" }}
        output="# Mise UI"
      />,
    )
    const details = screen.getByLabelText("read_file: success").closest("details")
    expect(details).not.toHaveAttribute("open")
    expect(screen.getByText("Input")).not.toBeVisible()

    await user.click(screen.getByLabelText("read_file: success"))
    expect(details).toHaveAttribute("open")
    expect(screen.getByText("Input")).toBeVisible()
    expect(screen.getByText(/"path": "README.md"/)).toBeVisible()
    expect(screen.getByText("# Mise UI")).toBeVisible()
  })

  it("formats durations in milliseconds under a second and in seconds above", () => {
    const { rerender } = render(<ToolCallCard name="fetch" status="success" durationMs={340} />)
    expect(screen.getByText("340 ms")).toBeInTheDocument()
    rerender(<ToolCallCard name="fetch" status="success" durationMs={1234} />)
    expect(screen.getByText("1.2 s")).toBeInTheDocument()
  })

  it("omits the Output block while there is no output", () => {
    render(<ToolCallCard name="search_web" status="running" input="latest React release" defaultOpen />)
    expect(screen.getByText("Input")).toBeVisible()
    expect(screen.queryByText("Output")).not.toBeInTheDocument()
  })
})
