import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, vi } from "vitest"
import { FeatureBento, type BentoFeature, type FeatureBentoVariant } from "./feature-bento"

// jsdom has no WebGL. Returning null is what a real browser does without it, and the metal falls back.
const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null)
afterAll(() => getContext.mockRestore())

/** Tags and classes, not ids: useId differs between two renders of the same markup. */
function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="feature-bento"]') as HTMLElement
const cells = (container: HTMLElement) => container.querySelectorAll('[data-slot="feature-bento-cell"]')
const rows = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-slot="feature-bento-row"]'))

const FEATURES: readonly BentoFeature[] = [
  { id: "a", title: "Alpha", description: "First", span: 4, visual: <span>Live A</span> },
  { id: "b", title: "Beta", description: "Second", span: 2 },
  { id: "c", title: "Gamma", description: "Third", span: 6, tone: "dark", visual: <span>Live C</span> },
]

describe("FeatureBento variants", () => {
  it("renders the grid with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<FeatureBento features={FEATURES} />)
    expect(root(plain)).toHaveAttribute("data-variant", "bento")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<FeatureBento variant={unknown as FeatureBentoVariant} features={FEATURES} />)
      expect(root(container)).toHaveAttribute("data-variant", "bento")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants with the same features", () => {
    const { container: bento } = render(<FeatureBento variant="bento" features={FEATURES} />)
    const { container: asRows } = render(<FeatureBento variant="rows" features={FEATURES} />)
    const { container: tabs } = render(<FeatureBento variant="tabs" features={FEATURES} />)
    expect(cells(bento)).toHaveLength(3)
    expect(cells(asRows)).toHaveLength(0)
    expect(rows(asRows)).toHaveLength(3)
    expect(cells(tabs)).toHaveLength(0)
    expect(tabs.querySelectorAll('[role="tab"]')).toHaveLength(3)
  })

  it("keeps variant-only props off the DOM and shows nothing to choose with no features", () => {
    const { container } = render(<FeatureBento variant="tabs" features={[]} defaultFeatureId="a" />)
    expect(root(container)).not.toHaveAttribute("defaultfeatureid")
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
  })
})

describe("FeatureBento rows", () => {
  it("alternates the picture side, and only when side by side", () => {
    const { container } = render(<FeatureBento variant="rows" features={[FEATURES[0], { ...FEATURES[0], id: "x" }, { ...FEATURES[0], id: "y" }]} />)
    const plates = rows(container).map((row) => row.lastElementChild)
    expect(plates[0]).not.toHaveClass("@3xl:order-first")
    expect(plates[1]).toHaveClass("@3xl:order-first")
    expect(plates[2]).not.toHaveClass("@3xl:order-first")
    expect(plates[1]).not.toHaveClass("order-first")
  })

  it("gives each row a real heading with its text in the quieter tone, and spans a row with no picture", () => {
    render(<FeatureBento variant="rows" features={FEATURES} />)
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3)
    expect(screen.getByText("Second")).toHaveClass("text-muted-foreground")
    expect(screen.getByRole("heading", { name: "Beta" }).parentElement).toHaveClass("@3xl:col-span-2")
    expect(screen.getByRole("heading", { name: "Alpha" }).parentElement).not.toHaveClass("@3xl:col-span-2")
  })

  it("has working sample pictures, with the accent only on the beam", async () => {
    const { container } = render(<FeatureBento variant="rows" />)
    expect(container.querySelectorAll('[data-effect="beam"]')).toHaveLength(1)
    await userEvent.click(screen.getByRole("button", { name: "Send the summary" }))
    expect(screen.getByRole("button", { name: "Sent to all three" })).toBeDisabled()
    expect(screen.getAllByLabelText("Delivered")).toHaveLength(3)
  })
})

describe("FeatureBento tabs", () => {
  it("drives one panel from the list", async () => {
    render(<FeatureBento variant="tabs" features={FEATURES} />)
    expect(screen.getByRole("tab", { name: /Alpha/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1)
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Live A")
    await userEvent.click(screen.getByRole("tab", { name: /Beta/ }))
    expect(screen.getByRole("tab", { name: /Beta/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1)
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Second")
    expect(screen.queryByText("Live A")).not.toBeInTheDocument()
  })

  it("moves through the list with the arrow keys", async () => {
    render(<FeatureBento variant="tabs" features={FEATURES} />)
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical")
    await userEvent.click(screen.getByRole("tab", { name: /Alpha/ }))
    await userEvent.keyboard("{ArrowDown}")
    expect(await screen.findByRole("tab", { name: /Beta/, selected: true })).toHaveFocus()
    await userEvent.keyboard("{ArrowUp}")
    expect(await screen.findByRole("tab", { name: /Alpha/, selected: true })).toHaveFocus()
  })

  it("opens the feature it is told to", () => {
    render(<FeatureBento variant="tabs" features={FEATURES} defaultFeatureId="c" />)
    expect(screen.getByRole("tab", { name: /Gamma/ })).toHaveAttribute("aria-selected", "true")
  })

  it("puts the panel above the list while stacked, and keeps tab rows 40 px", () => {
    render(<FeatureBento variant="tabs" features={FEATURES} />)
    expect(screen.getByRole("tabpanel").parentElement).toHaveClass("order-first", "@3xl:order-none")
    expect(screen.getByRole("tab", { name: /Alpha/ })).toHaveClass("min-h-10")
  })

  it("has a sample panel that merges and splits the threads when pressed", async () => {
    const { container } = render(<FeatureBento variant="tabs" defaultFeatureId="threads" />)
    const morph = container.querySelector('[data-slot="gooey-morph"]')
    expect(morph).toHaveAttribute("data-merged", "false")
    await userEvent.click(screen.getByRole("button", { name: "Merge the threads" }))
    expect(morph).toHaveAttribute("data-merged", "true")
    expect(screen.getByTestId("merged-record")).toHaveTextContent(/Drop the \$9 tier/)
    await userEvent.click(screen.getByRole("button", { name: "Split by speaker" }))
    expect(screen.queryByTestId("merged-record")).not.toBeInTheDocument()
  })
})
