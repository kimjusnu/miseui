import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LandingHero, type LandingHeroVariant } from "./landing-hero"

/** Tags and classes, not ids: useId differs between two renders of the same markup. */
function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="landing-hero"]') as HTMLElement

describe("LandingHero variants", () => {
  it("renders the split layout with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<LandingHero />)
    expect(root(plain)).toHaveAttribute("data-variant", "split")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<LandingHero variant={unknown as LandingHeroVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "split")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants, not only in colour", () => {
    const seen = (["split", "centered", "overlap", "minimal"] as const).map((variant) => {
      const { container } = render(<LandingHero variant={variant} />)
      return shape(root(container)).join("|")
    })
    expect(new Set(seen).size).toBe(4)
  })

  it("keeps one h1, the same copy props and both actions on every variant with a product", async () => {
    for (const variant of ["centered", "overlap"] as const) {
      const onPrimary = vi.fn()
      const { unmount } = render(
        <LandingHero
          variant={variant}
          headline="First."
          headlineQuiet="Second."
          primaryAction={{ label: "Start", onClick: onPrimary }}
          secondaryAction={{ label: "More", href: "/more" }}
        />,
      )
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
      expect(screen.getByRole("heading", { name: "First. Second." })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "More" })).toHaveAttribute("href", "/more")
      await userEvent.click(screen.getByRole("button", { name: /start/i }))
      expect(onPrimary).toHaveBeenCalledOnce()
      unmount()
    }
  })

  it("answers to its container on every variant", () => {
    for (const variant of ["centered", "overlap", "minimal"] as const) {
      const { container, unmount } = render(<LandingHero variant={variant} />)
      expect(root(container)).toHaveClass("@container")
      expect(root(container)).toHaveAttribute("data-variant", variant)
      unmount()
    }
  })
})

describe("LandingHero centered", () => {
  it("lights the line of the transcript a task came from when the task is pressed", async () => {
    const { container } = render(<LandingHero variant="centered" />)
    const said = () => Array.from(container.querySelectorAll('[data-said="true"]')).map((line) => line.textContent)
    expect(said()).toEqual([expect.stringContaining("Priya")])
    await userEvent.click(screen.getByRole("button", { name: /Draft the customer email/ }))
    expect(said()).toEqual([expect.stringContaining("Tomas")])
    expect(screen.getByRole("button", { name: /Draft the customer email/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /Send the revised tiers/ })).toHaveAttribute("aria-pressed", "false")
  })

  it("moves between tasks with the keyboard", async () => {
    const { container } = render(<LandingHero variant="centered" />)
    screen.getByRole("button", { name: /Send the revised tiers/ }).focus()
    await userEvent.tab()
    await userEvent.keyboard("{Enter}")
    expect(container.querySelector('[data-said="true"]')).toHaveTextContent("Tomas")
  })

  it("takes your own preview, and null leaves the text alone", () => {
    const { container, rerender } = render(<LandingHero variant="centered" preview={<div>My product</div>} />)
    expect(screen.getByText("My product")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="landing-hero-plate"]')).not.toBeInTheDocument()
    rerender(<LandingHero variant="centered" preview={null} />)
    expect(screen.queryByText("My product")).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="landing-hero-plate"]')).not.toBeInTheDocument()
  })
})

describe("LandingHero overlap", () => {
  it("lays the front fragment over the back one, and hides sample product from assistive tech", () => {
    render(<LandingHero variant="overlap" />)
    const back = screen.getByTestId("fragment-back")
    const front = screen.getByTestId("fragment-front")
    expect(back.compareDocumentPosition(front) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(front.parentElement).toHaveClass("-mt-12", "z-10")
    expect(back).toHaveAttribute("aria-hidden", "true")
    expect(front).toHaveAttribute("aria-hidden", "true")
  })

  it("takes your own two fragments", () => {
    render(<LandingHero variant="overlap" fragments={[<p key="a">Input</p>, <p key="b">Output</p>]} />)
    expect(screen.getByText("Input")).toBeInTheDocument()
    expect(screen.getByText("Output")).toBeInTheDocument()
    expect(screen.queryByTestId("fragment-back")).not.toBeInTheDocument()
  })
})

describe("LandingHero minimal", () => {
  it("is type and one action, with no product even if one is passed", () => {
    const { container } = render(<LandingHero variant="minimal" preview={<div>My product</div>} />)
    expect(screen.queryByText("My product")).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="thinking-orb"]')).not.toBeInTheDocument()
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByRole("button", { name: /get early access/i })).toBeInTheDocument()
    expect(root(container)).not.toHaveAttribute("preview")
  })

  it("still takes a second action when passed one", () => {
    render(<LandingHero variant="minimal" secondaryAction={{ label: "Read the plan", href: "/plan" }} />)
    expect(screen.getByRole("link", { name: "Read the plan" })).toBeInTheDocument()
  })
})
