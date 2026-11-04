import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PricingTable, type PricingPlan, type PricingTableVariant } from "./pricing-table"
import { matrixGroups, matrixValue } from "./pricing-table-matrix"

/** Tags and classes, not ids: useId differs between two renders of the same markup. */
function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="pricing-table"]') as HTMLElement
const billingSwitch = () => screen.getByRole("switch", { name: "Bill yearly" })

const PLANS: readonly PricingPlan[] = [
  { id: "a", name: "Free", description: "Try it.", monthly: 0, yearly: 0, cta: "Start free", features: [{ label: "Seats", value: "1" }] },
  { id: "b", name: "Team", description: "For teams.", monthly: 30, yearly: 24, cta: "Start trial", recommended: true, features: [{ label: "Seats", value: true }] },
  { id: "c", name: "Scale", description: "For more.", monthly: 80, yearly: 60, cta: "Choose Scale", features: [{ label: "Seats", value: false }] },
]

const GROUPED: readonly PricingPlan[] = [
  {
    id: "a",
    name: "Free",
    description: "",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      { group: "Billing", label: "Invoices", value: "20" },
      { group: "Access", label: "SAML", value: false },
    ],
  },
  {
    id: "b",
    name: "Team",
    description: "",
    monthly: 30,
    yearly: 24,
    cta: "Start trial",
    recommended: true,
    features: [
      { group: "Billing", label: "Invoices", value: "Unlimited" },
      { group: "Access", label: "SAML", value: true },
      { group: "Billing", label: "Exports", value: true },
    ],
  },
]

describe("PricingTable variants", () => {
  it("renders the cards with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<PricingTable />)
    expect(root(plain)).toHaveAttribute("data-variant", "cards")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<PricingTable variant={unknown as PricingTableVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "cards")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants", () => {
    const { container: cards } = render(<PricingTable variant="cards" />)
    const { container: comparison } = render(<PricingTable variant="comparison" />)
    const { container: single } = render(<PricingTable variant="single" />)
    expect(cards.querySelector("table")).toBeNull()
    expect(comparison.querySelector("table")).not.toBeNull()
    expect(single.querySelector("table")).toBeNull()
    expect(single.querySelector('[data-slot="number-input"]')).not.toBeNull()
    expect(cards.querySelector('[data-slot="number-input"]')).toBeNull()
    expect(comparison.querySelector('[data-slot="number-input"]')).toBeNull()
  })

  it("keeps variant-only props off the DOM", () => {
    const { container } = render(<PricingTable variant="comparison" beam defaultSeats={3} stickyTop={64} />)
    expect(root(container)).not.toHaveAttribute("beam")
    expect(root(container)).not.toHaveAttribute("defaultseats")
    expect(root(container)).not.toHaveAttribute("stickytop")
  })
})

describe("PricingTable comparison", () => {
  it("is a real table with one column per plan and rows anyone can read", () => {
    render(<PricingTable variant="comparison" plans={GROUPED} />)
    expect(screen.getByRole("columnheader", { name: /Team/ })).toHaveAttribute("abbr", "Team")
    const cells = within(screen.getByRole("row", { name: /SAML/ })).getAllByRole("cell")
    expect(cells[0]).toHaveTextContent("Not included")
    expect(cells[1]).toHaveTextContent("Included")
    expect(screen.getByRole("rowheader", { name: "SAML" })).toBeInTheDocument()
  })

  it("groups rows under their heading", () => {
    render(<PricingTable variant="comparison" plans={GROUPED} />)
    expect(screen.getByText("Billing")).toHaveAttribute("scope", "rowgroup")
    expect(screen.getByText("Access")).toHaveAttribute("scope", "rowgroup")
  })

  it("collects every row any plan mentions, in order and by group, and a missing one reads as no", () => {
    expect(matrixGroups(GROUPED)).toEqual([
      { name: "Billing", rows: ["Invoices", "Exports"] },
      { name: "Access", rows: ["SAML"] },
    ])
    expect(matrixValue(GROUPED[0], "Exports")).toBe(false)
    expect(matrixValue(GROUPED[1], "Exports")).toBe(true)
  })

  it("does not invent a heading for rows with no group", () => {
    expect(matrixGroups(PLANS)).toEqual([{ name: "", rows: ["Seats"] }])
    render(<PricingTable variant="comparison" plans={PLANS} />)
    expect(screen.getAllByRole("rowheader")).toHaveLength(1)
  })

  it("sticks the plan header, and scrolls inside itself only while narrow", () => {
    const { container } = render(<PricingTable variant="comparison" stickyTop={64} />)
    screen.getAllByRole("columnheader").forEach((cell) => expect(cell).toHaveClass("sticky", "top-0", "@3xl:top-(--pricing-sticky-top)"))
    expect(root(container).style.getPropertyValue("--pricing-sticky-top")).toBe("64px")
    const scroller = screen.getByRole("region", { name: "Plans compared feature by feature" })
    expect(scroller).toHaveClass("overflow-auto", "@3xl:overflow-visible", "max-h-[560px]", "@3xl:max-h-none")
    expect(screen.getByRole("table")).toHaveClass("@3xl:min-w-0")
    expect(screen.getByRole("table").style.getPropertyValue("--matrix-min-width")).toBe("608px")
  })

  it("changes prices with the switch and tells onSelect the billing", async () => {
    const onSelect = vi.fn()
    render(<PricingTable variant="comparison" plans={PLANS} onSelect={onSelect} />)
    expect(screen.getByText("$24")).toBeInTheDocument()
    await userEvent.click(billingSwitch())
    expect(screen.queryByText("$24")).not.toBeInTheDocument()
    expect(screen.getByText("$30")).toBeInTheDocument()
    expect(screen.queryByTestId("anchor-price")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Start trial" }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("b", "monthly")
  })

  it("gives the only accent button to the recommended plan", () => {
    render(<PricingTable variant="comparison" plans={PLANS} />)
    expect(screen.getByRole("button", { name: "Start trial" })).toHaveAttribute("data-variant", "mise")
    expect(screen.getByRole("button", { name: "Start free" })).toHaveAttribute("data-variant", "outline")
  })

  it("holds every plan button while a checkout opens, and marks the current plan", () => {
    render(<PricingTable variant="comparison" plans={PLANS} pendingPlanId="b" currentPlanId="a" error="Checkout did not open." />)
    expect(screen.getByRole("button", { name: "Start trial" })).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Choose Scale" })).toBeDisabled()
    expect(screen.getByRole("alert")).toHaveTextContent("Checkout did not open.")
  })

  it("says so when there are no plans", () => {
    render(<PricingTable variant="comparison" plans={[]} />)
    expect(screen.getByText(/not available right now/)).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})

describe("PricingTable comparison on a phone", () => {
  it("keeps the sr-only cell text inside the scroller, because it widened the whole page on a real phone", () => {
    const { container } = render(<PricingTable variant="comparison" />)
    expect(container.querySelector('[data-slot="scroll-shadow-scroller"]')).toHaveClass("relative")
  })
})
