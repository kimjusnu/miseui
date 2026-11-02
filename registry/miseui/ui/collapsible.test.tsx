import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Collapsible, CollapsibleContent, CollapsibleTrigger, type CollapsibleProps } from "./collapsible"

function Disclosure(props: CollapsibleProps) {
  return (
    <Collapsible data-testid="root" {...props}>
      <CollapsibleTrigger>Billing details</CollapsibleTrigger>
      <CollapsibleContent>
        Paid by card. <a href="#invoice">Open the invoice</a>
      </CollapsibleContent>
    </Collapsible>
  )
}

const trigger = () => screen.getByRole("button", { name: "Billing details" })
const contentOf = (link: HTMLElement) => link.closest("[data-slot='collapsible-content']")

describe("Collapsible behaviour", () => {
  it("toggles with a click and with the keyboard", async () => {
    const user = userEvent.setup()
    render(<Disclosure />)
    expect(trigger()).toHaveAttribute("aria-expanded", "false")
    await user.click(trigger())
    expect(trigger()).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("link", { name: "Open the invoice" })).toBeVisible()
    await user.keyboard("{Enter}")
    expect(trigger()).toHaveAttribute("aria-expanded", "false")
    await user.keyboard(" ")
    expect(trigger()).toHaveAttribute("aria-expanded", "true")
  })

  it("follows a controlled value, not the click", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Disclosure open={false} onOpenChange={onOpenChange} />)
    await user.click(trigger())
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(trigger()).toHaveAttribute("aria-expanded", "false")
  })

  it("respects disabled", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Disclosure disabled onOpenChange={onOpenChange} />)
    expect(trigger()).toBeDisabled()
    await user.click(trigger())
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe("Collapsible variants", () => {
  it("plain has no surface and unmounts closed content", () => {
    render(<Disclosure variant="plain" />)
    expect(screen.getByTestId("root")).not.toHaveClass("border")
    expect(screen.queryByRole("link", { name: "Open the invoice", hidden: true })).toBeNull()
  })

  it("card draws one bordered surface", () => {
    render(<Disclosure variant="card" />)
    expect(screen.getByTestId("root")).toHaveClass("rounded-lg", "border")
  })

  it("fade keeps a clipped preview, inert until opened, with a default Show more label", async () => {
    const user = userEvent.setup()
    render(
      <Collapsible variant="fade" data-testid="root">
        <CollapsibleContent collapsedHeight={64}>
          Long notes. <a href="#more">Further reading</a>
        </CollapsibleContent>
        <CollapsibleTrigger />
      </Collapsible>,
    )
    const content = contentOf(screen.getByRole("link", { name: "Further reading", hidden: true }))
    expect(content).toHaveAttribute("inert")
    expect(content).toHaveStyle({ height: "64px" })
    await user.click(screen.getByRole("button", { name: "Show more" }))
    expect(content).not.toHaveAttribute("inert")
    expect(content).not.toHaveStyle({ height: "64px" })
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument()
  })

  it("inline reads as a text link with an indented panel", async () => {
    const user = userEvent.setup()
    render(<Disclosure variant="inline" defaultOpen />)
    expect(screen.getByTestId("root")).toHaveClass("inline-flex")
    expect(trigger()).toHaveClass("flex-row-reverse")
    await user.tab()
    expect(trigger()).toHaveFocus()
    expect(screen.getByText(/Paid by card/)).toHaveClass("border-l")
  })
})

describe("Collapsible spring effect", () => {
  it("keeps closed content mounted but inert, then releases it", async () => {
    const user = userEvent.setup()
    render(<Disclosure effect="spring" />)
    expect(screen.getByTestId("root")).toHaveAttribute("data-effect", "spring")
    const content = contentOf(screen.getByRole("link", { name: "Open the invoice", hidden: true }))
    expect(content).toHaveAttribute("inert")
    await user.click(trigger())
    expect(content).not.toHaveAttribute("inert")
  })

  it("also works on the fade variant, keeping the mask for both states", () => {
    render(
      <Collapsible variant="fade" effect="spring">
        <CollapsibleContent>
          <a href="#more">Further reading</a>
        </CollapsibleContent>
        <CollapsibleTrigger />
      </Collapsible>,
    )
    const link = screen.getByRole("link", { name: "Further reading", hidden: true })
    expect(link.closest("[data-slot='collapsible-content']")).toHaveAttribute("inert")
    expect(link.closest("[class*='mask-image']")).not.toBeNull()
  })
})
