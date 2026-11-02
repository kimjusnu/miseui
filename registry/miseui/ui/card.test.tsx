import { render, screen } from "@testing-library/react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

function renderFullCard() {
  return render(
    <Card data-testid="card">
      <CardHeader>
        <CardTitle>Project</CardTitle>
        <CardDescription>Three open tasks</CardDescription>
        <CardAction>
          <button type="button">Edit</button>
        </CardAction>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>,
  )
}

describe("Card", () => {
  it("marks every piece with its own slot", () => {
    renderFullCard()
    expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card")
    expect(screen.getByText("Project")).toHaveAttribute("data-slot", "card-title")
    expect(screen.getByText("Three open tasks")).toHaveAttribute("data-slot", "card-description")
    expect(screen.getByRole("button", { name: "Edit" }).parentElement).toHaveAttribute(
      "data-slot",
      "card-action",
    )
    expect(screen.getByText("Body")).toHaveAttribute("data-slot", "card-content")
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer")
  })

  it("keeps header, content and footer inside the card region", () => {
    renderFullCard()
    const card = screen.getByTestId("card")
    expect(card).toContainElement(screen.getByText("Project"))
    expect(card).toContainElement(screen.getByText("Body"))
    expect(card).toContainElement(screen.getByText("Footer"))
    expect(screen.getByText("Project").closest("[data-slot='card-header']")).not.toBeNull()
  })

  it("merges a custom className instead of appending a conflicting one", () => {
    render(
      <Card data-testid="card" className="p-0">
        Tight
      </Card>,
    )
    const card = screen.getByTestId("card")
    expect(card).toHaveClass("p-0", "rounded-xl")
    expect(card).not.toHaveClass("py-6")
  })

  it("forwards native attributes so the region can be named", () => {
    render(
      <Card role="region" aria-label="Billing">
        <CardContent>Plan</CardContent>
      </Card>,
    )
    expect(screen.getByRole("region", { name: "Billing" })).toHaveTextContent("Plan")
  })
})
