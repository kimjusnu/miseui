import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Search } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupSelect,
  type InputGroupProps,
  type InputGroupVariant,
} from "./input-group"

const VARIANTS: readonly InputGroupVariant[] = ["attached", "inset", "stacked", "inline"]

function Budget(props: InputGroupProps) {
  return (
    <InputGroup label="Monthly budget" data-testid="root" {...props}>
      <InputGroupAddon data-testid="prefix">$</InputGroupAddon>
      <InputGroupInput placeholder="0.00" />
      <InputGroupSelect aria-label="Currency" defaultValue="usd">
        <option value="usd">USD</option>
        <option value="krw">KRW</option>
      </InputGroupSelect>
      <InputGroupButton>Apply</InputGroupButton>
    </InputGroup>
  )
}

const field = () => screen.getByRole("textbox", { name: "Monthly budget" })

describe("InputGroup naming", () => {
  it.each(VARIANTS)("%s gives the input a name", (variant) => {
    render(<Budget variant={variant} />)
    expect(field()).toBeInTheDocument()
  })

  it("draws a real label only in stacked and inline", () => {
    const { rerender, container } = render(<Budget variant="stacked" />)
    const label = container.querySelector("label")
    expect(label).toHaveAttribute("for", field().id)
    rerender(<Budget variant="attached" />)
    expect(container.querySelector("label")).toBeNull()
  })

  it("lets an aria-label on the input win", () => {
    render(
      <InputGroup label="Group">
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    )
    expect(screen.getByRole("textbox", { name: "Amount" })).toBeInTheDocument()
  })
})

describe("InputGroup focus", () => {
  it("clicking an addon or the empty field focuses the input", async () => {
    const user = userEvent.setup()
    render(<Budget />)
    await user.click(screen.getByTestId("prefix"))
    expect(field()).toHaveFocus()
  })

  it("keeps the ring on the root for input and select alike, and none on the input", () => {
    render(<Budget />)
    const root = screen.getByTestId("root")
    expect(root.className).toContain("has-[input:focus-visible,select:focus-visible]:ring-[3px]")
    expect(field().className).not.toContain("focus-visible:ring")
    expect(field()).toHaveClass("outline-none")
  })

  it("does not take focus away from a control that was clicked", async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <InputGroup label="Code">
        <InputGroupInput />
        <InputGroupButton onClick={onApply}>Apply</InputGroupButton>
      </InputGroup>,
    )
    const apply = screen.getByRole("button", { name: "Apply" })
    await user.click(apply)
    expect(apply).toHaveFocus()
    expect(onApply).toHaveBeenCalledTimes(1)
  })

  it("orders the tab stops as they read", async () => {
    const user = userEvent.setup()
    render(<Budget />)
    await user.tab()
    expect(field()).toHaveFocus()
    await user.tab()
    expect(screen.getByRole("combobox", { name: "Currency" })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole("button", { name: "Apply" })).toHaveFocus()
  })
})

describe("InputGroup controls", () => {
  it("types, selects and keeps the value", async () => {
    const user = userEvent.setup()
    render(<Budget />)
    await user.type(field(), "120")
    expect(field()).toHaveValue("120")
    await user.selectOptions(screen.getByRole("combobox", { name: "Currency" }), "krw")
    expect(screen.getByRole("combobox", { name: "Currency" })).toHaveValue("krw")
  })

  it("disables everything from the root", () => {
    render(<Budget disabled />)
    expect(field()).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Currency" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()
  })

  it("shows the error on the shared border", () => {
    render(
      <InputGroup label="Code" data-testid="root">
        <InputGroupInput aria-invalid="true" />
      </InputGroup>,
    )
    expect(screen.getByTestId("root").className).toContain("has-[[aria-invalid=true]]:border-destructive")
  })

  it("keeps room for the placeholder", () => {
    render(<Budget />)
    expect(field()).toHaveClass("min-w-24")
  })

  it("accepts an icon addon and a primary button", () => {
    render(
      <InputGroup label="Search" variant="inset">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput />
        <InputGroupButton primary>Go</InputGroupButton>
      </InputGroup>,
    )
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("bg-mise", "text-mise-foreground")
  })
})

describe("InputGroup variants", () => {
  const expected: Record<InputGroupVariant, { root: string; addon?: string; hasRow: boolean }> = {
    attached: { root: "divide-x", addon: "bg-foreground/[0.04]", hasRow: false },
    inset: { root: "gap-2", hasRow: false },
    stacked: { root: "gap-1", hasRow: true },
    inline: { root: "bg-foreground/[0.05]", hasRow: true },
  }

  it.each(VARIANTS)("%s lays the field out its own way", (variant) => {
    const { container } = render(<Budget variant={variant} />)
    const root = screen.getByTestId("root")
    const want = expected[variant]
    expect(root).toHaveAttribute("data-variant", variant)
    expect(root).toHaveClass(want.root)
    if (want.addon) expect(screen.getByTestId("prefix")).toHaveClass(want.addon)
    else expect(screen.getByTestId("prefix")).not.toHaveClass("bg-foreground/[0.04]")
    expect(Boolean(container.querySelector("[data-slot='input-group-row']"))).toBe(want.hasRow)
  })

  it("aligns the value to the right only on the inline row", () => {
    const { rerender } = render(<Budget variant="inline" />)
    expect(field()).toHaveClass("text-right")
    rerender(<Budget variant="stacked" />)
    expect(field()).not.toHaveClass("text-right")
  })
})
