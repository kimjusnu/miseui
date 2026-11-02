import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Steps, stepState, type StepsProps, type StepsVariant } from "./steps"

const VARIANTS: readonly StepsVariant[] = ["horizontal", "vertical", "compact", "numbered"]
const STEPS = [{ title: "Cart" }, { title: "Shipping", description: "Where it should go" }, { title: "Payment" }, { title: "Review" }]

function Checkout(props: Partial<StepsProps>) {
  return <Steps aria-label="Checkout" steps={STEPS} current={1} {...props} />
}

const items = () => within(screen.getByRole("navigation", { name: "Checkout" })).getAllByRole("listitem")

describe("stepState", () => {
  it("derives the state from the position", () => {
    expect(stepState(0, 2)).toBe("done")
    expect(stepState(2, 2)).toBe("current")
    expect(stepState(3, 2)).toBe("upcoming")
  })

  it("lets an error win over the position", () => {
    expect(stepState(0, 2, true)).toBe("error")
    expect(stepState(2, 2, true)).toBe("error")
  })
})

describe("Steps", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("is a named ordered list with aria-current on exactly one step", () => {
      const { container } = render(<Checkout variant={variant} />)
      expect(screen.getByRole("navigation", { name: "Checkout" })).toHaveAttribute("data-variant", variant)
      expect(container.querySelector("ol")).not.toBeNull()
      expect(items()).toHaveLength(4)
      const current = items().filter((item) => item.getAttribute("aria-current") === "step")
      expect(current).toHaveLength(1)
      expect(current[0]).toBe(items()[1])
      expect(current[0]).toHaveTextContent("Shipping")
    })

    it("tells assistive tech what is done and what failed", () => {
      render(<Checkout variant={variant} steps={[{ title: "Cart" }, { title: "Payment", error: true }, { title: "Review" }]} current={1} />)
      expect(items()[0]).toHaveTextContent("Completed: Cart")
      expect(items()[1]).toHaveTextContent("Error: Payment")
      expect(items()[1]).not.toHaveAttribute("aria-current")
    })

    it("has no current step once everything is done", () => {
      render(<Checkout variant={variant} current={4} />)
      expect(items().filter((item) => item.hasAttribute("aria-current"))).toHaveLength(0)
    })
  })

  it("has a different structure per variant", () => {
    const horizontal = render(<Checkout variant="horizontal" />)
    expect(horizontal.container.querySelectorAll("[data-slot='steps-marker']")).toHaveLength(4)
    expect(horizontal.container.querySelectorAll("[data-slot='steps-connector']")).toHaveLength(3)
    expect(screen.queryByText("Where it should go")).not.toBeInTheDocument()
    horizontal.unmount()

    const vertical = render(<Checkout variant="vertical" />)
    expect(vertical.container.querySelectorAll("[data-slot='steps-connector']")).toHaveLength(3)
    expect(screen.getByText("Where it should go")).toBeInTheDocument()
    vertical.unmount()

    const compact = render(<Checkout variant="compact" />)
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument()
    expect(compact.container.querySelectorAll("[data-slot='steps-segment']")).toHaveLength(4)
    expect(compact.container.querySelector("[data-slot='steps-marker']")).toBeNull()
    compact.unmount()

    const numbered = render(<Checkout variant="numbered" />)
    expect(numbered.container.querySelectorAll("[data-slot='steps-number']")).toHaveLength(4)
    expect(numbered.container.querySelector("[data-slot='steps-connector']")).toBeNull()
  })

  it("fills only the line behind the current step", () => {
    const { container } = render(<Checkout variant="vertical" current={2} />)
    const filled = Array.from(container.querySelectorAll("[data-slot='steps-connector']")).map((node) => node.getAttribute("data-filled"))
    expect(filled).toEqual(["true", "true", "false"])
  })

  it("marks each state on the marker, with a check for done and a number otherwise", () => {
    const { container } = render(<Checkout variant="vertical" steps={[{ title: "A" }, { title: "B" }, { title: "C", error: true }, { title: "D" }]} current={1} />)
    const markers = Array.from(container.querySelectorAll<HTMLElement>("[data-slot='steps-marker']"))
    expect(markers.map((marker) => marker.dataset.state)).toEqual(["done", "current", "error", "upcoming"])
    expect(markers[0].querySelector("svg")).not.toBeNull()
    expect(markers[1]).toHaveTextContent("2")
    expect(markers[1]).toHaveClass("bg-mise")
    expect(markers[0]).not.toHaveClass("bg-mise")
    expect(markers[2]).toHaveClass("bg-destructive", "text-white", "dark:text-background")
  })

  it("lets only finished steps be selected, by mouse or keyboard", async () => {
    const user = userEvent.setup()
    const onStepSelect = vi.fn()
    render(<Checkout variant="vertical" current={2} onStepSelect={onStepSelect} />)
    expect(screen.getAllByRole("button")).toHaveLength(2)
    expect(screen.queryByRole("button", { name: /Review/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Cart/ }))
    expect(onStepSelect).toHaveBeenLastCalledWith(0)
    screen.getByRole("button", { name: /Shipping/ }).focus()
    await user.keyboard("{Enter}")
    expect(onStepSelect).toHaveBeenLastCalledWith(1)
  })

  it("says the count in your language", () => {
    render(<Checkout variant="compact" labels={{ count: (position, total) => `${position}/${total} 단계` }} />)
    expect(screen.getByText("2/4 단계")).toBeInTheDocument()
  })

  it("keeps the compact bar valid past the last step", () => {
    render(<Checkout variant="compact" current={9} />)
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument()
    expect(screen.getAllByText("Review").length).toBeGreaterThan(0)
  })

  it("marks the draw effect and moves the line when progress changes", () => {
    const { container, rerender } = render(<Checkout effect="draw" current={0} />)
    expect(screen.getByRole("navigation")).toHaveAttribute("data-effect", "draw")
    expect(container.querySelector("[data-slot='steps-connector']")).toHaveAttribute("data-filled", "false")
    rerender(<Checkout effect="draw" current={1} />)
    expect(container.querySelector("[data-slot='steps-connector']")).toHaveAttribute("data-filled", "true")
  })
})
