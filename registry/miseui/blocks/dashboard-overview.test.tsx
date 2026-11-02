import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DashboardOverview } from "./dashboard-overview"

const METRICS = [
  {
    id: "signups",
    label: "Signups",
    value: "412",
    series: [
      { label: "Mon", value: 10 },
      { label: "Tue", value: 30 },
      { label: "Wed", value: 20 },
    ],
  },
  { id: "a", label: "Activated", value: "201" },
  { id: "b", label: "Paying", value: "58" },
]

const linePath = (container: HTMLElement) =>
  container.querySelector('[data-testid="chart-line"]')?.getAttribute("d") ?? ""

describe("DashboardOverview", () => {
  it("renders a complete sample screen with no props", () => {
    render(<DashboardOverview />)
    expect(screen.getByText("$48,216", { selector: "p" })).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Needs your attention" })).toBeInTheDocument()
    expect(screen.getByText(/moved to Team/)).toBeInTheDocument()
  })

  it("draws the chart path from the data, one segment per reading", () => {
    const { container } = render(<DashboardOverview metrics={METRICS} />)
    const path = linePath(container)
    expect(path.match(/[ML]/g)).toHaveLength(3)
    // The highest reading is the middle point, so its y is the smallest of the three.
    const ys = path.split(/[ML]/).filter(Boolean).map((pair) => Number(pair.trim().split(" ")[1]))
    expect(ys[1]).toBeLessThan(ys[2])
    expect(ys[2]).toBeLessThan(ys[0])
  })

  it("keeps a flat series on screen instead of dividing by zero", () => {
    const flat = [{ ...METRICS[0], series: [{ label: "Mon", value: 5 }, { label: "Tue", value: 5 }] }]
    const { container } = render(<DashboardOverview metrics={flat} />)
    expect(linePath(container)).not.toContain("NaN")
  })

  it("names the chart for assistive tech and offers the numbers as a table", () => {
    render(<DashboardOverview metrics={METRICS} />)
    const chart = screen.getByRole("figure", { name: /Signups, from 10 on Mon to 20 on Wed/ })
    expect(within(chart).getAllByRole("row")).toHaveLength(3)
  })

  it("reads out the nearest point under the pointer, and clears when it leaves", () => {
    render(<DashboardOverview metrics={METRICS} />)
    const plot = screen.getByTestId("chart-plot")
    vi.spyOn(plot, "getBoundingClientRect").mockReturnValue({ left: 0, width: 300 } as DOMRect)
    fireEvent.pointerMove(plot, { clientX: 140 })
    expect(screen.getByTestId("chart-readout")).toHaveTextContent("30Tue")
    fireEvent.pointerLeave(plot)
    expect(screen.queryByTestId("chart-readout")).not.toBeInTheDocument()
  })

  it("shows wave skeletons while pending, and no numbers or chart", () => {
    const { container } = render(<DashboardOverview metrics={METRICS} pending />)
    expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"][data-effect="wave"]').length).toBeGreaterThan(0)
    expect(screen.queryByText("412")).not.toBeInTheDocument()
    expect(linePath(container)).toBe("")
    expect(screen.getByRole("tab", { name: "7 days" })).toBeDisabled()
  })

  it("renders the empty state when there are no metrics and fires its action", async () => {
    const onEmptyAction = vi.fn()
    render(<DashboardOverview metrics={[]} onEmptyAction={onEmptyAction} />)
    expect(screen.getByRole("heading", { name: "No numbers to show yet" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Connect billing" }))
    expect(onEmptyAction).toHaveBeenCalledOnce()
  })

  it("shows an error with a retry instead of stale numbers", async () => {
    const onRetry = vi.fn()
    render(<DashboardOverview metrics={METRICS} error="The billing service timed out." onRetry={onRetry} />)
    expect(screen.getByRole("alert")).toHaveTextContent("The billing service timed out.")
    expect(screen.queryByText("412")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("never leaks sample activity or attention into real data", () => {
    render(<DashboardOverview metrics={METRICS} />)
    expect(screen.queryByText(/moved to Team/)).not.toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Needs your attention" })).not.toBeInTheDocument()
    expect(screen.getByText("Nothing has happened in this period.")).toBeInTheDocument()
  })

  it("switches range: the sample chart changes and the callback fires", async () => {
    const onRangeChange = vi.fn()
    const { container } = render(<DashboardOverview onRangeChange={onRangeChange} />)
    const before = linePath(container)
    expect(screen.getByRole("heading", { name: "Overview. Last 30 days." })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("tab", { name: "7 days" }))
    expect(screen.getByRole("heading", { name: "Overview. Last 7 days." })).toBeInTheDocument()
    expect(onRangeChange).toHaveBeenCalledWith("7d")
    expect(linePath(container)).not.toBe(before)
    expect(linePath(container).match(/[ML]/g)).toHaveLength(7)
  })

  it("lets the attention item be put off, and fires its action", async () => {
    const onAction = vi.fn()
    const attention = { title: "Domain expires soon", description: "Renew by Friday.", actionLabel: "Renew", onAction }
    render(<DashboardOverview metrics={METRICS} attention={attention} />)
    await userEvent.click(screen.getByRole("button", { name: "Renew" }))
    expect(onAction).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole("button", { name: "Later" }))
    expect(screen.queryByText("Domain expires soon")).not.toBeInTheDocument()
  })

  it("keeps at most three secondary metrics, so the first number stays first", () => {
    const many = [...METRICS, { id: "c", label: "Third", value: "1" }, { id: "d", label: "Fourth", value: "2" }]
    render(<DashboardOverview metrics={many} />)
    expect(screen.getByText("Third")).toBeInTheDocument()
    expect(screen.queryByText("Fourth")).not.toBeInTheDocument()
  })

  it("marks the chosen nav item as the current page", async () => {
    const onNavigate = vi.fn()
    render(<DashboardOverview onNavigate={onNavigate} />)
    await userEvent.click(screen.getByRole("button", { name: "Invoices" }))
    expect(onNavigate).toHaveBeenCalledWith("invoices")
    expect(screen.getByRole("button", { name: "Invoices" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "Overview" })).not.toHaveAttribute("aria-current")
  })

  it("responds to its container, not the viewport", () => {
    const { container } = render(<DashboardOverview />)
    expect(container.querySelector('[data-slot="dashboard-overview"]')).toHaveClass("@container")
  })
})
