import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, vi } from "vitest"
import { FeatureBento, type BentoFeature } from "./feature-bento"

// jsdom has no WebGL. Returning null is what a real browser does without it, and the metal falls back.
const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null)
afterAll(() => getContext.mockRestore())

const cells = (container: HTMLElement) => container.querySelectorAll('[data-slot="feature-bento-cell"]')

const FEATURES: readonly BentoFeature[] = [
  { id: "a", title: "Alpha", description: "First", span: 4, visual: <span>Live A</span> },
  { id: "b", title: "Beta", description: "Second", span: 2 },
  { id: "c", title: "Gamma", description: "Third", span: 6, tone: "dark" },
]

describe("FeatureBento", () => {
  it("renders exactly one cell per feature", () => {
    const { container } = render(<FeatureBento features={FEATURES} />)
    expect(cells(container)).toHaveLength(3)
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
  })

  it("renders no empty grid when there are no features", () => {
    const { container } = render(<FeatureBento features={[]} />)
    expect(cells(container)).toHaveLength(0)
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("maps each span to its column count, one row under the breakpoint", () => {
    const { container } = render(<FeatureBento features={FEATURES} />)
    const [a, b, c] = Array.from(cells(container))
    expect(a).toHaveClass("@2xl:col-span-4")
    expect(b).toHaveClass("@2xl:col-span-2")
    expect(c).toHaveClass("@2xl:col-span-6")
    expect(container.querySelector("ul")).toHaveClass("grid-cols-1", "@2xl:grid-cols-6")
  })

  it("defaults to a rhythm where every row adds up to six columns", () => {
    const { container } = render(<FeatureBento />)
    const spans = Array.from(cells(container)).map((cell) => Number(cell.getAttribute("data-span")))
    expect(spans.reduce((sum, span) => sum + span, 0) % 6).toBe(0)
    expect(new Set(spans).size).toBeGreaterThan(1)
  })

  it("puts a visual in the slot and sets a cell without one in larger type", () => {
    const { container } = render(<FeatureBento features={FEATURES} />)
    expect(screen.getByText("Live A")).toBeInTheDocument()
    expect(screen.getAllByTestId("feature-bento-visual")).toHaveLength(1)
    expect(screen.getByRole("heading", { name: "Beta" }).parentElement).toHaveClass("text-display")
    expect(screen.getByRole("heading", { name: "Alpha" }).parentElement).toHaveClass("text-[15px]")
    expect(screen.getByText("Second")).toHaveClass("text-muted-foreground")
    expect(cells(container)[2]).toHaveClass("dark")
    expect(cells(container)[0]).not.toHaveClass("dark")
  })

  it("carries at least three live kit effects in the default grid", () => {
    const { container } = render(<FeatureBento />)
    expect(container.querySelector('[data-slot="card"][data-effect="beam"], [data-slot="beam-border"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="thinking-orb"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="gooey-morph"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="liquid-metal"]')).toBeInTheDocument()
  })

  it("keeps the accent on the beam: the other visuals are repointed at the ink", () => {
    const { container } = render(<FeatureBento />)
    const neutral = (slot: string) =>
      container.querySelector(`[data-slot="${slot}"]`)?.closest<HTMLElement>('[style*="--mise"]')?.style.getPropertyValue("--mise")
    expect(neutral("thinking-orb")).toBe("var(--foreground)")
    expect(neutral("gooey-morph")).toBe("var(--foreground)")
  })

  it("sets the section title in two tones inside one heading, and mixes dark panels into the default grid", () => {
    const { container } = render(<FeatureBento title="First." titleQuiet="Second." />)
    expect(screen.getByRole("heading", { level: 2, name: "First. Second." })).toBeInTheDocument()
    const darkCells = Array.from(cells(container)).filter((cell) => cell.classList.contains("dark"))
    expect(darkCells.length).toBeGreaterThanOrEqual(1)
    expect(darkCells.length).toBeLessThanOrEqual(2)
  })

  it("layers a real card behind the lead visual", () => {
    render(<FeatureBento />)
    expect(screen.getByTestId("bento-back-card")).toHaveAttribute("data-slot", "card")
  })

  it("merges the threads when pressed, and splits them back", async () => {
    const { container } = render(<FeatureBento />)
    const morph = container.querySelector('[data-slot="gooey-morph"]')
    expect(morph).toHaveAttribute("data-merged", "false")
    await userEvent.click(screen.getByRole("button", { name: "Merge the threads" }))
    expect(morph).toHaveAttribute("data-merged", "true")
    await userEvent.click(screen.getByRole("button", { name: "Split by speaker" }))
    expect(morph).toHaveAttribute("data-merged", "false")
  })

  it("confirms the send action in place", async () => {
    render(<FeatureBento />)
    await userEvent.click(screen.getByRole("button", { name: "Send to #pricing" }))
    expect(screen.getByRole("button", { name: "Sent to #pricing" })).toBeInTheDocument()
    expect(screen.getByText("Delivered to 5 people")).toBeInTheDocument()
  })

  it("responds to its container, not the viewport", () => {
    const { container } = render(<FeatureBento />)
    expect(container.querySelector('[data-slot="feature-bento"]')).toHaveClass("@container")
  })
})
