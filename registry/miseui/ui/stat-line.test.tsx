import { render, screen, waitFor, within } from "@testing-library/react"
import { StatLine, type StatLineItem } from "./stat-line"

const state = vi.hoisted(() => ({ reduced: false, inView: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

beforeEach(() => {
  state.reduced = false
  state.inView = false
})

const ITEMS: readonly StatLineItem[] = [
  { label: "Page load", value: 1.4, from: 3.2, unit: "s" },
  { label: "Monthly visits", value: 12800 },
  { label: "Median session", value: "4m 12s" },
]

const root = () => document.querySelector("[data-slot='stat-line']") as HTMLElement
const items = () => Array.from(root().querySelectorAll<HTMLElement>("[data-slot='stat-line-item']"))

describe("StatLine", () => {
  it("is a description list that pairs each label with its value", () => {
    render(<StatLine items={ITEMS} locale="en-US" />)
    expect(root().querySelector("dl")).not.toBeNull()
    expect(screen.getByText("Monthly visits").tagName).toBe("DT")
    expect(within(items()[1]).getByRole("definition")).toHaveTextContent("12,800")
    expect(within(items()[2]).getByRole("definition")).toHaveTextContent("4m 12s")
  })

  it("draws the old value in front and reads the change as a sentence", () => {
    render(<StatLine items={ITEMS} locale="en-US" />)
    const from = items()[0].querySelector("[data-slot='stat-line-from']") as HTMLElement
    expect(from).toHaveTextContent("3.2to")
    expect(items()[0].querySelector("[data-slot='stat-line-unit']")).toHaveTextContent("s")
    expect(items()[1].querySelector("[data-slot='stat-line-from']")).toBeNull()
  })

  it("arranges the figures differently for each variant", () => {
    const { rerender } = render(<StatLine items={ITEMS} variant="divided" />)
    expect(root().querySelector("dl")?.className).toContain("grid-cols-2")
    // Three figures fit one row from 320 px. Waiting for 384 left one alone on a second row in a two-column page.
    expect(root().querySelector("dl")?.className).toContain("@xs:grid-flow-col")
    expect(items()[1].className).toContain("border-s")

    rerender(<StatLine items={ITEMS} variant="run" />)
    expect(root().querySelector("dl")?.className).toContain("flex-wrap")
    expect(items()[0].querySelector("dd")?.className).toContain("order-first")

    rerender(<StatLine items={ITEMS} variant="lead" />)
    expect(items()[0].className).toContain("first:col-span-full")
    expect(items()[0].querySelector("dd")?.className).toContain("cqi,72px")
    expect(items()[1].querySelector("dd")?.className).toContain("cqi,28px")
  })

  it("counts numbers from the old value once seen and leaves text alone", async () => {
    const { rerender } = render(<StatLine items={ITEMS} effect="count-up" locale="en-US" format={(value) => value.toFixed(1)} />)
    const counting = () => items()[0].querySelector("[data-slot='stat-line-count-value']") as HTMLElement
    expect(counting()).toHaveTextContent("3.2")
    // Assistive tech gets the final number from the start, not the moving one.
    expect(within(items()[0]).getByText("1.4", { selector: ".sr-only" })).toBeInTheDocument()
    expect(items()[2].querySelector("[data-slot='stat-line-count']")).toBeNull()
    state.inView = true
    rerender(<StatLine items={ITEMS} effect="count-up" locale="en-US" format={(value) => value.toFixed(1)} />)
    await waitFor(() => expect(counting().textContent).not.toBe("3.2"), { timeout: 3000 })
  })

  it("shows the final figures at once when motion is off", () => {
    state.reduced = true
    render(<StatLine items={ITEMS} effect="count-up" locale="en-US" />)
    expect(root().querySelector("[data-slot='stat-line-count']")).toBeNull()
    expect(within(items()[1]).getByRole("definition")).toHaveTextContent("12,800")
  })

  it("follows the locale and accepts a formatter", () => {
    const { rerender } = render(<StatLine items={[{ label: "Revenue", value: 1500000 }]} locale="de-DE" />)
    expect(screen.getByRole("definition")).toHaveTextContent("1.500.000")
    rerender(<StatLine items={[{ label: "Revenue", value: 1500000 }]} format={(value) => `$${value / 1000000}M`} />)
    expect(screen.getByRole("definition")).toHaveTextContent("$1.5M")
  })
})
