import { render, screen, waitFor } from "@testing-library/react"
import { StatsSection, type StatsSectionStat, type StatsSectionVariant } from "./stats-section"

const state = vi.hoisted(() => ({ reduced: false, inView: true }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

beforeEach(() => {
  state.reduced = false
  state.inView = true
})

function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="stats-section"]') as HTMLElement
const ALL = ["row", "plate", "split"] as const

const OWN_STATS: readonly StatsSectionStat[] = [
  { id: "a", value: 12500, prefix: "$", label: "Raised", detail: "Audited in March." },
  { id: "b", value: 99.5, suffix: "%", label: "Uptime" },
  { id: "c", value: 40, label: "Countries" },
]

const shownValues = (container: HTMLElement) => Array.from(container.querySelectorAll("[data-slot='count-up-value']")).map((node) => node.textContent)

describe("StatsSection", () => {
  it("renders row with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<StatsSection locale="en-US" />)
    expect(root(plain)).toHaveAttribute("data-variant", "row")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<StatsSection locale="en-US" variant={unknown as StatsSectionVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "row")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants, not only in colour", () => {
    const seen = ALL.map((variant) => {
      const { container } = render(<StatsSection locale="en-US" variant={variant} />)
      return shape(root(container)).join("|")
    })
    expect(new Set(seen).size).toBe(3)
  })

  it("has every final number in the accessible text before it has counted, on every variant", () => {
    state.inView = false
    for (const variant of ALL) {
      const { container, unmount } = render(<StatsSection locale="en-US" variant={variant} stats={OWN_STATS} />)
      for (const text of ["$12,500", "99.5%", "40"]) {
        expect(screen.getByText(text, { selector: ".sr-only" })).toBeInTheDocument()
      }
      expect(container.querySelectorAll("[data-slot='count-up-visual'][aria-hidden='true']")).toHaveLength(3)
      expect(shownValues(container)).toEqual(["$0", "0.0%", "0"])
      unmount()
    }
  })

  it("counts up to the final value once seen", async () => {
    const { container } = render(<StatsSection locale="en-US" stats={[{ id: "a", value: 80, label: "Eighty" }]} />)
    await waitFor(() => expect(shownValues(container)).toEqual(["80"]), { timeout: 3000 })
  })

  it("shows the final value at once under reduced motion, on every variant", () => {
    state.reduced = true
    for (const variant of ALL) {
      const { container, unmount } = render(<StatsSection locale="en-US" variant={variant} stats={OWN_STATS} />)
      expect(shownValues(container)).toEqual(["$12,500", "99.5%", "40"])
      unmount()
    }
  })

  it("pairs each number with its label as a definition list", () => {
    for (const variant of ALL) {
      const { unmount } = render(<StatsSection locale="en-US" variant={variant} stats={OWN_STATS} />)
      expect(screen.getAllByRole("term").map((node) => node.textContent)).toEqual(["Raised", "Uptime", "Countries"])
      unmount()
    }
  })

  it("says the sample numbers are examples, and stops saying so for real ones", () => {
    for (const variant of ALL) {
      const { unmount, rerender } = render(<StatsSection locale="en-US" variant={variant} />)
      expect(screen.getByText(/example figures/i)).toBeVisible()
      rerender(<StatsSection locale="en-US" variant={variant} stats={OWN_STATS} />)
      expect(screen.queryByText(/example figures/i)).not.toBeInTheDocument()
      rerender(<StatsSection locale="en-US" variant={variant} stats={OWN_STATS} note="Audited in March." />)
      expect(screen.getAllByText("Audited in March.").length).toBeGreaterThan(0)
      unmount()
    }
  })

  it("renders nothing for an empty list and keeps owner props off the DOM node", () => {
    for (const variant of ALL) {
      const { container, unmount, rerender } = render(<StatsSection locale="en-US" variant={variant} stats={[]} />)
      expect(root(container)).toBeNull()
      rerender(<StatsSection locale="en-US" variant={variant} stats={OWN_STATS} note="x" />)
      expect(root(container)).not.toHaveAttribute("stats")
      expect(root(container)).not.toHaveAttribute("locale")
      unmount()
    }
  })

  it("shows a dash, not NaN, for a number that did not arrive", () => {
    render(<StatsSection locale="en-US" stats={[{ id: "a", value: Number.NaN, label: "Pending" }]} />)
    expect(screen.getByText("Not available")).toBeInTheDocument()
    expect(document.body.textContent).not.toContain("NaN")
  })

  describe("row", () => {
    it("gives every number the same weight", () => {
      const { container } = render(<StatsSection locale="en-US" stats={OWN_STATS} />)
      const sizes = Array.from(container.querySelectorAll("[data-slot='count-up']")).map((node) => node.className)
      expect(new Set(sizes).size).toBe(1)
    })
  })

  describe("plate", () => {
    it("makes the first number the largest thing on its own soft plate", () => {
      const { container } = render(<StatsSection locale="en-US" variant="plate" stats={OWN_STATS} />)
      const lead = container.querySelector('[data-slot="stats-section-lead"]') as HTMLElement
      expect(lead.className).toContain("bg-mise-soft")
      expect(lead).toHaveTextContent("Raised")
      expect(lead.querySelector("[data-slot='count-up']")?.className).toContain("cqi")
      expect(container.querySelectorAll('[class*="bg-mise"]')).toHaveLength(1)
    })

    it("does not leave an empty plate beside a single number", () => {
      const { container } = render(<StatsSection locale="en-US" variant="plate" stats={[OWN_STATS[0] as StatsSectionStat]} />)
      expect(container.querySelectorAll("dl")).toHaveLength(1)
    })
  })

  describe("split", () => {
    it("shows what each number counts and where it comes from", () => {
      render(<StatsSection locale="en-US" variant="split" stats={OWN_STATS} description="Why these matter." />)
      expect(screen.getByText("Why these matter.")).toBeInTheDocument()
      expect(screen.getByText("Audited in March.")).toBeInTheDocument()
    })

    it("skips the detail line for a stat that has none", () => {
      const { container } = render(<StatsSection locale="en-US" variant="split" stats={OWN_STATS} />)
      expect(container.querySelectorAll("dd")).toHaveLength(OWN_STATS.length + 1)
    })
  })
})
