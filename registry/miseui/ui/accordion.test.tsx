import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, type AccordionVariant } from "./accordion"

type RowsProps = React.ComponentProps<typeof Accordion>

function Rows(props: RowsProps) {
  return (
    <Accordion data-testid="root" {...props}>
      <AccordionItem value="refunds" data-testid="item">
        <AccordionTrigger>Refunds</AccordionTrigger>
        <AccordionContent>
          Refunds land in five days. <a href="#policy">Read the policy</a>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="seats">
        <AccordionTrigger>Seats</AccordionTrigger>
        <AccordionContent>Add seats at any time.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="legacy" disabled>
        <AccordionTrigger>Legacy plans</AccordionTrigger>
        <AccordionContent>No longer sold.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const trigger = (name: string) => screen.getByRole("button", { name })

describe("Accordion selection", () => {
  it("keeps one row open in single mode and lets the open row close", async () => {
    const user = userEvent.setup()
    render(<Rows />)
    await user.click(trigger("Refunds"))
    expect(trigger("Refunds")).toHaveAttribute("aria-expanded", "true")
    await user.click(trigger("Seats"))
    expect(trigger("Refunds")).toHaveAttribute("aria-expanded", "false")
    expect(trigger("Seats")).toHaveAttribute("aria-expanded", "true")
    await user.click(trigger("Seats"))
    expect(trigger("Seats")).toHaveAttribute("aria-expanded", "false")
  })

  it("keeps several rows open in multiple mode and reports the list", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rows type="multiple" defaultValue={["refunds"]} onValueChange={onValueChange} />)
    await user.click(trigger("Seats"))
    expect(trigger("Refunds")).toHaveAttribute("aria-expanded", "true")
    expect(trigger("Seats")).toHaveAttribute("aria-expanded", "true")
    expect(onValueChange).toHaveBeenLastCalledWith(["refunds", "seats"])
  })

  it("follows a controlled value, not the click", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Rows value="refunds" onValueChange={onValueChange} />)
    await user.click(trigger("Seats"))
    expect(onValueChange).toHaveBeenCalledWith("seats")
    expect(trigger("Refunds")).toHaveAttribute("aria-expanded", "true")
    expect(trigger("Seats")).toHaveAttribute("aria-expanded", "false")
  })
})

describe("Accordion keyboard", () => {
  it("moves with arrows, skips the disabled row, toggles with Enter", async () => {
    const user = userEvent.setup()
    render(<Rows />)
    await user.tab()
    expect(trigger("Refunds")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(trigger("Seats")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(trigger("Refunds")).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(trigger("Refunds")).toHaveAttribute("aria-expanded", "true")
    expect(trigger("Legacy plans")).toBeDisabled()
  })
})

describe("Accordion variants", () => {
  const expected: Record<AccordionVariant, { root?: string; item?: string; trigger?: string; icon: string }> = {
    plain: { item: "border-b", icon: "chevron" },
    card: { root: "rounded-lg", icon: "chevron" },
    separated: { item: "rounded-lg", root: "grid", icon: "chevron" },
    flush: { trigger: "text-lg", icon: "plus" },
  }

  it.each(Object.keys(expected) as AccordionVariant[])("%s has its own structure", (variant) => {
    render(<Rows variant={variant} />)
    const want = expected[variant]
    const root = screen.getByTestId("root")
    expect(root).toHaveAttribute("data-variant", variant)
    if (want.root) expect(root).toHaveClass(want.root)
    if (want.item) expect(screen.getByTestId("item")).toHaveClass(want.item)
    if (want.trigger) expect(trigger("Refunds")).toHaveClass(want.trigger)
    expect(within(root).getAllByRole("button")[0].querySelector("[data-slot='accordion-icon']")).toHaveAttribute(
      "data-icon",
      want.icon,
    )
  })

  it("lets the icon prop override the default for a variant", () => {
    render(<Rows variant="flush" icon="chevron" />)
    expect(trigger("Refunds").querySelector("[data-slot='accordion-icon']")).toHaveAttribute("data-icon", "chevron")
  })
})

describe("Accordion spring effect", () => {
  it("keeps closed panels mounted but inert, so hidden links stay out of the tab order", async () => {
    const user = userEvent.setup()
    render(<Rows effect="spring" />)
    expect(screen.getByTestId("root")).toHaveAttribute("data-effect", "spring")
    const link = screen.getByRole("link", { name: "Read the policy", hidden: true })
    const panel = link.closest("[data-slot='accordion-content']")
    expect(panel).toHaveAttribute("inert")
    await user.click(trigger("Refunds"))
    expect(panel).not.toHaveAttribute("inert")
  })

  it("unmounts closed panels without the effect", () => {
    render(<Rows />)
    expect(screen.queryByRole("link", { name: "Read the policy", hidden: true })).toBeNull()
  })

  it("keeps the region labelled by its trigger when open", async () => {
    const user = userEvent.setup()
    render(<Rows effect="spring" />)
    await user.click(trigger("Refunds"))
    expect(screen.getByRole("region", { name: "Refunds" })).toBeInTheDocument()
  })
})
