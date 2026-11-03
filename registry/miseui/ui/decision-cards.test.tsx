import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DecisionCards, type DecisionItem } from "./decision-cards"

const ITEMS: readonly DecisionItem[] = [
  {
    title: "Where should search run?",
    chosen: "In the database",
    rejected: ["A hosted search service", "A separate index"],
    reason: "The catalogue has eight thousand rows, and one more system to keep in step was not worth it.",
  },
  {
    title: "How do people sign in?",
    chosen: "Email links",
    rejected: "Passwords",
    reason: "Most resets happened at checkout, the worst moment to lose someone.",
  },
]

const root = () => document.querySelector("[data-slot='decision-cards']") as HTMLElement
const slots = (name: string) => root().querySelectorAll(`[data-slot='decision-cards-${name}']`)

describe("DecisionCards", () => {
  it("is an ordered list with a heading per decision", () => {
    render(<DecisionCards items={ITEMS} />)
    expect(screen.getByRole("list").tagName).toBe("OL")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(screen.getByRole("heading", { name: "How do people sign in?" })).toBeInTheDocument()
    expect(screen.getByText("Email links")).toBeInTheDocument()
    expect(screen.getByText(/Most resets happened/)).toBeInTheDocument()
  })

  it("builds a different structure for each variant", () => {
    const { rerender } = render(<DecisionCards items={ITEMS} variant="split" />)
    expect(slots("options")).toHaveLength(2)
    expect(root().querySelector("del")).toBeNull()

    rerender(<DecisionCards items={ITEMS} variant="diff" />)
    expect(slots("diff")).toHaveLength(2)
    expect(root().querySelectorAll("del")).toHaveLength(3)
    expect(root().querySelectorAll("ins")).toHaveLength(2)
    expect(slots("options")).toHaveLength(0)

    rerender(<DecisionCards items={ITEMS} variant="ledger" />)
    expect(slots("sentence")[0]).toHaveTextContent("In the database over A hosted search service, A separate index")
    expect(root().querySelector("del")).toBeNull()
  })

  it("names the rejected lines for assistive tech in the diff, since the strike is not read aloud", () => {
    render(<DecisionCards items={ITEMS.slice(1)} variant="diff" labels={{ rejected: "Dropped", chosen: "Picked" }} />)
    const lines = within(root())
    expect(lines.getByText("Dropped:", { exact: false })).toHaveClass("sr-only")
    expect(lines.getByText("Picked:", { exact: false })).toHaveClass("sr-only")
  })

  it("folds the reason behind a button with the disclose effect", async () => {
    render(<DecisionCards items={ITEMS} effect="disclose" />)
    const [first] = screen.getAllByRole("button", { name: "Why" })
    const panel = document.getElementById(first.getAttribute("aria-controls") ?? "") as HTMLElement
    expect(first).toHaveAttribute("aria-expanded", "false")
    expect(panel).toHaveAttribute("inert")
    await userEvent.click(first)
    expect(first).toHaveAttribute("aria-expanded", "true")
    expect(panel).not.toHaveAttribute("inert")
    expect(screen.getAllByRole("button", { name: "Why" })[1]).toHaveAttribute("aria-expanded", "false")
  })

  it("opens and closes a reason from the keyboard", async () => {
    render(<DecisionCards items={ITEMS.slice(0, 1)} effect="disclose" variant="ledger" labels={{ reason: "Reason" }} />)
    await userEvent.tab()
    const button = screen.getByRole("button", { name: "Reason" })
    expect(button).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(button).toHaveAttribute("aria-expanded", "true")
    await userEvent.keyboard(" ")
    expect(button).toHaveAttribute("aria-expanded", "false")
  })

  it("shows every reason with no button by default", () => {
    render(<DecisionCards items={ITEMS} variant="diff" />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(slots("reason")).toHaveLength(2)
  })
})
