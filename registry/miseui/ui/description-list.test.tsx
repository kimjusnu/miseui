import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DescriptionItem, DescriptionList, type DescriptionListVariant } from "./description-list"

const VARIANTS: readonly DescriptionListVariant[] = ["stacked", "columns", "inline", "card"]

function Invoice({ variant, onCopy }: { variant?: DescriptionListVariant; onCopy?: () => void }) {
  return (
    <DescriptionList variant={variant} data-testid="root">
      <DescriptionItem label="Invoice" data-testid="item" action={<button onClick={onCopy}>Copy invoice number</button>}>
        INV-2041
      </DescriptionItem>
      <DescriptionItem label="Status">Paid</DescriptionItem>
    </DescriptionList>
  )
}

describe("DescriptionList semantics", () => {
  it("is a real dl with one term and one definition per item, in order", () => {
    const { container } = render(<Invoice />)
    expect(container.querySelector("dl")).toBe(screen.getByTestId("root"))
    const terms = screen.getAllByRole("term")
    const details = screen.getAllByRole("definition")
    expect(terms.map((term) => term.textContent)).toEqual(["Invoice", "Status"])
    expect(details).toHaveLength(2)
    expect(terms[0].nextElementSibling).toBe(details[0])
  })

  it("groups each pair in a div, which is the only wrapper a dl allows", () => {
    render(<Invoice />)
    const item = screen.getByTestId("item")
    expect(item.tagName).toBe("DIV")
    expect(item.parentElement).toBe(screen.getByTestId("root"))
  })
})

describe("DescriptionItem action", () => {
  it("puts the control beside the value and keeps it reachable and working", async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    render(<Invoice onCopy={onCopy} />)
    const detail = screen.getAllByRole("definition")[0]
    const action = within(detail).getByRole("button", { name: "Copy invoice number" })
    await user.tab()
    expect(action).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  it("stays quiet until hover or focus, but always shows on touch", () => {
    render(<Invoice />)
    const slot = screen.getByRole("button", { name: "Copy invoice number" }).parentElement
    expect(slot).toHaveClass("opacity-0", "group-hover/item:opacity-100", "focus-within:opacity-100", "pointer-coarse:opacity-100")
  })

  it("renders no slot without an action", () => {
    render(<Invoice />)
    expect(screen.getAllByRole("definition")[1].querySelector("[data-slot='description-action']")).toBeNull()
  })
})

describe("DescriptionList long values", () => {
  it("wraps a value with no break points instead of widening the list", () => {
    render(
      <DescriptionList>
        <DescriptionItem label="Webhook">https://hooks.example.com/services/T00000000/B00000000/averylongtokenwithnospaces</DescriptionItem>
      </DescriptionList>,
    )
    const value = screen.getByText(/averylongtoken/)
    expect(value).toHaveClass("min-w-0", "wrap-anywhere")
    expect(value.parentElement).toHaveClass("min-w-0")
  })
})

describe("DescriptionList variants", () => {
  const expected: Record<DescriptionListVariant, { root: string; item: string }> = {
    stacked: { root: "divide-y", item: "py-3" },
    columns: { root: "grid-cols-2", item: "content-start" },
    inline: { root: "gap-2", item: "justify-between" },
    card: { root: "gap-2", item: "rounded-lg" },
  }

  it.each(VARIANTS)("%s lays the pairs out its own way", (variant) => {
    render(<Invoice variant={variant} />)
    const root = screen.getByTestId("root")
    expect(root).toHaveAttribute("data-variant", variant)
    expect(root).toHaveClass(expected[variant].root)
    expect(screen.getByTestId("item")).toHaveClass(expected[variant].item)
  })

  it("right-aligns the value only when it shares a line with the label", () => {
    const { rerender } = render(<Invoice variant="inline" />)
    expect(screen.getAllByRole("definition")[0]).toHaveClass("text-right")
    rerender(<Invoice variant="stacked" />)
    expect(screen.getAllByRole("definition")[0]).not.toHaveClass("text-right")
  })
})
