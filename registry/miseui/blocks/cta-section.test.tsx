import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CtaSection, type CtaSectionVariant } from "./cta-section"

function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="cta-section"]') as HTMLElement
const ALL = ["plate", "split", "banner"] as const

describe("CtaSection", () => {
  it("renders plate with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<CtaSection />)
    expect(root(plain)).toHaveAttribute("data-variant", "plate")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<CtaSection variant={unknown as CtaSectionVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "plate")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants, not only in colour", () => {
    const seen = ALL.map((variant) => {
      const { container } = render(<CtaSection variant={variant} />)
      return shape(root(container)).join("|")
    })
    expect(new Set(seen).size).toBe(3)
  })

  it("keeps one heading in two tones on every variant, and the owner props off the DOM node", () => {
    for (const variant of ALL) {
      const { container, unmount } = render(<CtaSection variant={variant} headline="Start." headlineQuiet="It is quick." fragment={null} note={null} />)
      const heading = screen.getByRole("heading", { level: 2 })
      expect(heading).toHaveTextContent("Start. It is quick.")
      expect(heading.querySelector("span")).toHaveTextContent("It is quick.")
      expect(root(container)).not.toHaveAttribute("fragment")
      expect(root(container)).not.toHaveAttribute("note")
      unmount()
    }
  })

  it("makes the primary action a real link with href and a button without, on every variant", async () => {
    for (const variant of ALL) {
      const onClick = vi.fn()
      const { rerender, unmount } = render(<CtaSection variant={variant} primaryAction={{ label: "Start", onClick }} />)
      await userEvent.click(screen.getByRole("button", { name: "Start" }))
      expect(onClick).toHaveBeenCalledOnce()
      rerender(<CtaSection variant={variant} primaryAction={{ label: "Start", href: "/signup" }} />)
      expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/signup")
      unmount()
    }
  })

  it("uses the accent once at most on each variant", () => {
    for (const variant of ALL) {
      const { container, unmount } = render(<CtaSection variant={variant} />)
      const accents = container.querySelectorAll('[data-variant="mise"], [class*="bg-mise"]')
      expect(accents).toHaveLength(1)
      unmount()
    }
  })

  describe("plate", () => {
    it("offers two actions and a line on what it does not cost", () => {
      render(<CtaSection />)
      expect(screen.getByRole("button", { name: "Try it on your next call" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "See a sample summary" })).toBeInTheDocument()
      expect(screen.getByText(/no card needed/i)).toBeInTheDocument()
    })

    it("drops the second action and the note on null", () => {
      render(<CtaSection secondaryAction={null} note={null} />)
      expect(screen.getAllByRole("button")).toHaveLength(1)
      expect(screen.queryByText(/no card needed/i)).not.toBeInTheDocument()
    })
  })

  describe("split", () => {
    it("shows a fragment that says it is a sample, and takes the owner's instead", () => {
      const { rerender } = render(<CtaSection variant="split" />)
      expect(screen.getByRole("figure")).toHaveTextContent("Sample")
      rerender(<CtaSection variant="split" fragment={<p>My product</p>} />)
      expect(screen.getByText("My product")).toBeInTheDocument()
      expect(screen.queryByRole("figure")).not.toBeInTheDocument()
    })

    it("collapses to the text alone with a null fragment", () => {
      const { container } = render(<CtaSection variant="split" fragment={null} />)
      expect(screen.queryByRole("figure")).not.toBeInTheDocument()
      expect(container.innerHTML).not.toContain("minmax(0,1fr)_minmax(0,1fr)")
    })
  })

  describe("banner", () => {
    it("is one sentence and one action, and stacks instead of truncating", () => {
      const { container } = render(<CtaSection variant="banner" />)
      expect(screen.getAllByRole("button")).toHaveLength(1)
      expect(screen.queryByText(/it listens/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/no card needed/i)).not.toBeInTheDocument()
      const row = container.querySelector('[data-slot="cta-section-banner"]') as HTMLElement
      expect(row.className).toContain("flex-col")
      expect(row.className).toContain("@2xl:flex-row")
      expect(container.innerHTML).not.toContain("truncate")
    })

    it("has a press target of 40 px at any pointer", () => {
      render(<CtaSection variant="banner" />)
      expect(screen.getByRole("button").className).toContain("h-10")
    })
  })
})
