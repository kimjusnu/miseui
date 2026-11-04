import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DashboardOverview, type DashboardVariant } from "./dashboard-overview"

const METRICS = [
  { id: "signups", label: "Signups", value: "412", series: [{ label: "Mon", value: 10 }, { label: "Tue", value: 30 }] },
  { id: "activated", label: "Activated", value: "201", series: [{ label: "Mon", value: 4 }, { label: "Tue", value: 9 }] },
  { id: "paying", label: "Paying", value: "58" },
]
const WORK = [
  { id: "1", customer: "Northgate Studio", status: "Late", statusTone: "warning" as const, amount: "$900", amountValue: 900, due: "Nov 1", actionLabel: "Remind" },
  { id: "2", customer: "Halden Freight", status: "Declined", statusTone: "danger" as const, amount: "$50", amountValue: 50, due: "Nov 2", actionLabel: "Retry" },
]
const root = (container: HTMLElement) => container.querySelector('[data-slot="dashboard-overview"]')
/** Every row renders twice in jsdom: as a table row and as a card, one hidden by a container query. */
const table = () => within(screen.getByRole("table"))

describe("DashboardOverview variants", () => {
  it("renders overview without the prop and for an unknown value", () => {
    const { container, rerender } = render(<DashboardOverview />)
    expect(root(container)).toHaveAttribute("data-variant", "overview")
    const markup = container.innerHTML
    rerender(<DashboardOverview variant={"nonsense" as DashboardVariant} />)
    expect(container.innerHTML).toBe(markup)
  })

  it("differs in structure, not only in colour", () => {
    const { rerender, container } = render(<DashboardOverview variant="overview" />)
    expect(container.querySelector('[data-slot="area-chart"]')).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Metric on the chart" })).not.toBeInTheDocument()
    expect(screen.queryByRole("table", { name: "Payments to chase" })).not.toBeInTheDocument()
    rerender(<DashboardOverview variant="analytics" />)
    expect(container.querySelector('[data-slot="area-chart"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Metric on the chart" })).toBeInTheDocument()
    rerender(<DashboardOverview variant="table" />)
    expect(container.querySelector('[data-slot="chart"]')).not.toBeInTheDocument()
    expect(screen.getByRole("table", { name: "Payments to chase" })).toBeInTheDocument()
    expect(screen.getByLabelText("Key numbers")).toBeInTheDocument()
  })

  describe("analytics", () => {
    it("redraws the one chart for the metric chosen above it", async () => {
      render(<DashboardOverview variant="analytics" metrics={METRICS} />)
      const signups = screen.getByRole("button", { name: /Signups/ })
      expect(signups).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByRole("group", { name: "Signups" })).toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: /Activated/ }))
      expect(screen.getByRole("group", { name: "Activated" })).toBeInTheDocument()
      expect(screen.queryByRole("group", { name: "Signups" })).not.toBeInTheDocument()
      expect(signups).toHaveAttribute("aria-pressed", "false")
    })

    it("keeps a metric with no series as a plain figure, not a dead button", () => {
      render(<DashboardOverview variant="analytics" metrics={METRICS} />)
      expect(screen.getByText("Paying")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Paying/ })).not.toBeInTheDocument()
    })

    it("keeps the chosen metric across a range change, with new data", async () => {
      render(<DashboardOverview variant="analytics" />)
      await userEvent.click(screen.getByRole("button", { name: /Trial to paid/ }))
      await userEvent.click(screen.getByRole("tab", { name: "7 days" }))
      expect(screen.getByRole("button", { name: /Trial to paid/ })).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByRole("button", { name: /Trial to paid/ })).toHaveTextContent("24.1%")
      expect(screen.getByRole("group", { name: "Trial to paid" })).toBeInTheDocument()
    })

    it("keeps the nav a top bar, so the chart gets the whole width", () => {
      const { container } = render(<DashboardOverview variant="analytics" />)
      expect(root(container)?.firstElementChild).not.toHaveClass("@3xl:flex-row")
      expect(screen.getByRole("navigation", { name: "Main" })).not.toHaveClass("@3xl:flex-col")
    })

    it("has its own loading, error and empty screens", () => {
      const { rerender } = render(<DashboardOverview variant="analytics" pending />)
      expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeInTheDocument()
      rerender(<DashboardOverview variant="analytics" error="Timed out." />)
      expect(screen.getByRole("alert")).toHaveTextContent("Timed out.")
      rerender(<DashboardOverview variant="analytics" metrics={[]} />)
      expect(screen.getByRole("heading", { name: "No numbers to show yet" })).toBeInTheDocument()
    })
  })

  describe("table", () => {
    it("shows every number as one line and leads with the list", () => {
      render(<DashboardOverview variant="table" metrics={METRICS} workItems={WORK} />)
      const numbers = screen.getByLabelText("Key numbers")
      expect(within(numbers).getByText("412")).toBeInTheDocument()
      expect(within(numbers).getByText("Paying")).toBeInTheDocument()
      expect(table().getByText("Northgate Studio")).toBeInTheDocument()
    })

    it("marks a row handled, offers undo on the same button, and reports both", async () => {
      const onWorkAction = vi.fn()
      render(<DashboardOverview variant="table" metrics={METRICS} workItems={WORK} onWorkAction={onWorkAction} />)
      const button = table().getByRole("button", { name: "Remind: Northgate Studio" })
      await userEvent.click(button)
      expect(onWorkAction).toHaveBeenLastCalledWith(WORK[0], true)
      expect(button).toHaveAccessibleName("Undo: Northgate Studio")
      expect(button).toHaveFocus()
      expect(table().getByText("Handled")).toBeInTheDocument()
      await userEvent.click(button)
      expect(onWorkAction).toHaveBeenLastCalledWith(WORK[0], false)
      expect(table().queryByText("Handled")).not.toBeInTheDocument()
    })

    it("sorts amounts as numbers, not as text", async () => {
      render(<DashboardOverview variant="table" metrics={METRICS} workItems={WORK} />)
      await userEvent.click(table().getByRole("button", { name: /Amount/ }))
      const rows = table().getAllByRole("row").slice(1)
      expect(rows[0]).toHaveTextContent("Halden Freight")
    })

    it("filters the list from its own box", async () => {
      render(<DashboardOverview variant="table" metrics={METRICS} workItems={WORK} />)
      await userEvent.type(screen.getByRole("searchbox", { name: "Filter this list" }), "halden")
      expect(table().queryByText("Northgate Studio")).not.toBeInTheDocument()
      expect(table().getByText("Halden Freight")).toBeInTheDocument()
    })

    it("says so when nothing needs a person, and never leaks the sample list into real data", () => {
      render(<DashboardOverview variant="table" metrics={METRICS} />)
      expect(table().getByText("Nothing needs you right now.")).toBeInTheDocument()
      expect(screen.queryByText("Pell Street Studio")).not.toBeInTheDocument()
    })

    it("shows the attention item only when one was really passed", () => {
      const attention = { title: "Domain expires soon", description: "Renew by Friday.", actionLabel: "Renew" }
      const { rerender } = render(<DashboardOverview variant="table" />)
      expect(screen.queryByRole("region", { name: "Needs your attention" })).not.toBeInTheDocument()
      rerender(<DashboardOverview variant="table" attention={attention} />)
      expect(screen.getByRole("region", { name: "Needs your attention" })).toHaveTextContent("Domain expires soon")
    })

    it("names the page after the work", () => {
      render(<DashboardOverview variant="table" workTitle="Invoices to send" />)
      expect(screen.getByRole("heading", { name: "Invoices to send. Last 30 days." })).toBeInTheDocument()
      expect(screen.getByRole("table", { name: "Invoices to send" })).toBeInTheDocument()
    })

    it("has its own loading and error screens, with no stale rows", () => {
      const { rerender } = render(<DashboardOverview variant="table" workItems={WORK} metrics={METRICS} pending />)
      expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeInTheDocument()
      expect(screen.queryByText("Northgate Studio")).not.toBeInTheDocument()
      rerender(<DashboardOverview variant="table" workItems={WORK} metrics={METRICS} error="Timed out." />)
      expect(screen.getByRole("alert")).toHaveTextContent("Timed out.")
      expect(screen.queryByText("Northgate Studio")).not.toBeInTheDocument()
    })
  })
})
