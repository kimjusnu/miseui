import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PricingTable, type PricingPlan } from "./pricing-table"
import { seatTotals } from "./pricing-table-seats"

const billingSwitch = () => screen.getByRole("switch", { name: "Bill yearly" })
const total = () => screen.getByTestId("seat-total")

const SEAT_PLAN: readonly PricingPlan[] = [
  {
    id: "only",
    name: "Paperline",
    description: "Everything.",
    monthly: 12,
    yearly: 10,
    cta: "Start trial",
    features: [
      { label: "Reminders", value: true },
      { label: "Seats", value: "Unlimited" },
      { label: "Hidden", value: false },
    ],
  },
]

describe("PricingTable single", () => {
  it("works the sums out from the seat price", () => {
    expect(seatTotals(SEAT_PLAN[0], "yearly", 5)).toEqual({ perSeat: 10, perMonth: 50, anchor: 60, billedYearly: 600, yearlySaving: 120 })
    const monthly = seatTotals(SEAT_PLAN[0], "monthly", 5)
    expect(monthly.perMonth).toBe(60)
    expect(monthly.anchor).toBeUndefined()
    expect(monthly.yearlySaving).toBe(0)
  })

  it("changes the total when the billing switch flips, and says what gets charged", async () => {
    render(<PricingTable variant="single" plans={SEAT_PLAN} />)
    expect(total()).toHaveTextContent("$50")
    expect(screen.getByText("5 seats at $10, $600 billed yearly")).toBeInTheDocument()
    expect(screen.getByText("You save $120 a year.")).toBeInTheDocument()
    expect(screen.getByTestId("anchor-price")).toHaveTextContent("$60")
    await userEvent.click(billingSwitch())
    expect(total()).toHaveTextContent("$60")
    expect(screen.getByText("5 seats at $12, billed monthly")).toBeInTheDocument()
    expect(screen.queryByText(/You save/)).not.toBeInTheDocument()
    expect(screen.queryByTestId("anchor-price")).not.toBeInTheDocument()
  })

  it("changes the total with the seat buttons, and stops at the lower bound", async () => {
    render(<PricingTable variant="single" plans={SEAT_PLAN} defaultSeats={1} />)
    expect(screen.getByText("1 seat at $10, $120 billed yearly")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove a seat" })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Add a seat" }))
    expect(total()).toHaveTextContent("$20")
    expect(screen.getByRole("button", { name: "Remove a seat" })).toBeEnabled()
  })

  it("changes the total from the keyboard and keeps a typed count inside the limits", async () => {
    render(<PricingTable variant="single" plans={SEAT_PLAN} maxSeats={10} />)
    const field = screen.getByRole("spinbutton", { name: "Seats" })
    await userEvent.click(field)
    await userEvent.keyboard("{ArrowUp}")
    expect(total()).toHaveTextContent("$60")
    await userEvent.clear(field)
    await userEvent.type(field, "99")
    await userEvent.tab()
    expect(field).toHaveValue("10")
    expect(total()).toHaveTextContent("$100")
  })

  it("keeps the last good count when the field is left empty", async () => {
    render(<PricingTable variant="single" plans={SEAT_PLAN} />)
    const field = screen.getByRole("spinbutton", { name: "Seats" })
    await userEvent.clear(field)
    await userEvent.tab()
    expect(total()).toHaveTextContent("$50")
    expect(field).toHaveValue("5")
  })

  it("hands the seat count to onSelect, and reports changes to the owner", async () => {
    const onSelect = vi.fn()
    const onSeatsChange = vi.fn()
    render(<PricingTable variant="single" plans={SEAT_PLAN} defaultSeats={2} onSelect={onSelect} onSeatsChange={onSeatsChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Add a seat" }))
    expect(onSeatsChange).toHaveBeenCalledExactlyOnceWith(3)
    await userEvent.click(screen.getByRole("button", { name: "Start trial" }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("only", "yearly", 3)
  })

  it("follows a controlled seat count", async () => {
    const onSeatsChange = vi.fn()
    render(<PricingTable variant="single" plans={SEAT_PLAN} seats={4} onSeatsChange={onSeatsChange} />)
    await userEvent.click(screen.getByRole("button", { name: "Add a seat" }))
    expect(onSeatsChange).toHaveBeenCalledExactlyOnceWith(5)
    expect(total()).toHaveTextContent("$40")
  })

  it("lists only what is included, and picks the recommended plan out of several", () => {
    const { rerender } = render(<PricingTable variant="single" plans={SEAT_PLAN} />)
    const list = within(screen.getByRole("list", { name: "Paperline includes" }))
    expect(list.getAllByRole("listitem")).toHaveLength(2)
    expect(list.queryByText("Hidden")).not.toBeInTheDocument()
    expect(list.getByText("Unlimited")).toBeInTheDocument()
    rerender(<PricingTable variant="single" plans={[SEAT_PLAN[0], { ...SEAT_PLAN[0], id: "pick", name: "Picked", recommended: true }]} />)
    expect(screen.getByRole("list", { name: "Picked includes" })).toBeInTheDocument()
  })

  it("says exactly what one plan saves, not up to", () => {
    render(<PricingTable variant="single" plans={SEAT_PLAN} />)
    expect(screen.getByText("Save 17%")).toBeInTheDocument()
  })

  it("holds the button while checkout opens, shows a failure, and marks the current plan", () => {
    const { rerender } = render(<PricingTable variant="single" plans={SEAT_PLAN} pendingPlanId="only" error="Checkout did not open." />)
    expect(screen.getByRole("button", { name: "Start trial" })).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("button", { name: "Start trial" })).toBeDisabled()
    expect(screen.getByRole("alert")).toHaveTextContent("Checkout did not open.")
    rerender(<PricingTable variant="single" plans={SEAT_PLAN} currentPlanId="only" />)
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled()
  })

  it("says so when there is no plan", () => {
    render(<PricingTable variant="single" plans={[]} />)
    expect(screen.getByText(/not available right now/)).toBeInTheDocument()
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
  })
})
