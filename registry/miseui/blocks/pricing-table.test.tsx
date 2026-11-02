import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PricingTable, type PricingPlan } from "./pricing-table"

const billingSwitch = () => screen.getByRole("switch", { name: "Bill yearly" })
const recommendedCard = () => document.querySelector('[data-recommended="true"]') as HTMLElement

const PLANS: readonly PricingPlan[] = [
  { id: "a", name: "Free", description: "Try it.", monthly: 0, yearly: 0, cta: "Start free", features: [{ label: "Seats", value: "1" }] },
  { id: "b", name: "Team", description: "For teams.", monthly: 30, yearly: 24, cta: "Start trial", recommended: true, features: [{ label: "Seats", value: true }] },
  { id: "c", name: "Scale", description: "For more.", monthly: 80, yearly: 60, cta: "Choose Scale", features: [{ label: "Seats", value: false }] },
]

describe("PricingTable", () => {
  it("changes every price when the billing toggle flips", async () => {
    render(<PricingTable plans={PLANS} />)
    expect(screen.getByText("$24")).toBeInTheDocument()
    expect(screen.getByText("$288 billed yearly")).toBeInTheDocument()
    await userEvent.click(billingSwitch())
    expect(billingSwitch()).not.toBeChecked()
    expect(screen.queryByText("$24")).not.toBeInTheDocument()
    expect(screen.getAllByText("Billed monthly")).toHaveLength(2)
  })

  it("anchors yearly prices against the crossed-out monthly price, and only there", async () => {
    render(<PricingTable plans={PLANS} />)
    const anchor = within(recommendedCard()).getByTestId("anchor-price")
    expect(anchor.tagName).toBe("S")
    expect(anchor).toHaveTextContent("$30")
    await userEvent.click(billingSwitch())
    expect(screen.queryByTestId("anchor-price")).not.toBeInTheDocument()
  })

  it("does not cross anything out on a free plan", () => {
    render(<PricingTable plans={PLANS} />)
    expect(screen.getAllByTestId("anchor-price")).toHaveLength(2)
    expect(screen.getByText("No card needed")).toBeInTheDocument()
  })

  it("marks exactly one plan as recommended and gives it the only accent button", () => {
    render(<PricingTable plans={PLANS} />)
    expect(screen.getAllByText("Recommended")).toHaveLength(1)
    const card = within(recommendedCard())
    expect(card.getByRole("heading", { name: "Team" })).toBeInTheDocument()
    expect(card.getByRole("button", { name: "Start trial" })).toHaveAttribute("data-variant", "mise")
    expect(screen.getByRole("button", { name: "Start free" })).toHaveAttribute("data-variant", "outline")
    expect(screen.getByRole("button", { name: "Choose Scale" })).toHaveAttribute("data-variant", "outline")
  })

  it("derives the saving from the real prices", () => {
    render(<PricingTable plans={PLANS} />)
    expect(screen.getByText("Save up to 25%")).toBeInTheDocument()
  })

  it("tells onSelect which plan and billing period were chosen", async () => {
    const onSelect = vi.fn()
    render(<PricingTable plans={PLANS} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole("button", { name: "Start trial" }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("b", "yearly")
    await userEvent.click(billingSwitch())
    await userEvent.click(screen.getByRole("button", { name: "Choose Scale" }))
    expect(onSelect).toHaveBeenLastCalledWith("c", "monthly")
  })

  it("follows a controlled billing prop and reports changes instead of overriding it", async () => {
    const onBillingChange = vi.fn()
    render(<PricingTable plans={PLANS} billing="monthly" onBillingChange={onBillingChange} />)
    await userEvent.click(billingSwitch())
    expect(onBillingChange).toHaveBeenCalledExactlyOnceWith("yearly")
    expect(billingSwitch()).not.toBeChecked()
  })

  it("makes yes and no rows readable to a screen reader", () => {
    render(<PricingTable plans={PLANS} />)
    expect(within(screen.getByRole("list", { name: "Team features" })).getByText("Included")).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Scale features" })).getByText("Not included")).toBeInTheDocument()
  })

  it("holds every button while a checkout opens, and shows a failure", () => {
    render(<PricingTable plans={PLANS} pendingPlanId="b" error="Checkout did not open. Try again." />)
    expect(screen.getByRole("button", { name: "Start trial" })).toHaveAttribute("aria-busy", "true")
    screen.getAllByRole("button").forEach((button) => expect(button).toBeDisabled())
    expect(screen.getByRole("alert")).toHaveTextContent("Checkout did not open. Try again.")
  })

  it("marks the customer's current plan instead of selling it again", () => {
    render(<PricingTable plans={PLANS} currentPlanId="a" />)
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Start free" })).not.toBeInTheDocument()
  })

  it("keeps the recommended plan still by default and runs the beam only when asked", () => {
    const { rerender } = render(<PricingTable plans={PLANS} />)
    expect(screen.queryByTestId("beam-layer")).not.toBeInTheDocument()
    rerender(<PricingTable plans={PLANS} beam />)
    expect(screen.getAllByTestId("beam-layer")).toHaveLength(1)
  })

  it("says so when there are no plans, and answers to its container", () => {
    const { container } = render(<PricingTable plans={[]} />)
    expect(screen.getByText(/not available right now/)).toBeInTheDocument()
    expect(screen.queryByRole("switch")).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="pricing-table"]')).toHaveClass("@container")
  })
})
