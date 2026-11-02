import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EmptyState } from "./empty-state"

describe("EmptyState", () => {
  it("offers a primary action and fires it", async () => {
    const onAction = vi.fn()
    render(<EmptyState actionLabel="New report" onAction={onAction} />)
    await userEvent.click(screen.getByRole("button", { name: /new report/i }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it("reports which starter was chosen", async () => {
    const onStarter = vi.fn()
    render(<EmptyState onStarter={onStarter} />)
    await userEvent.click(screen.getByRole("button", { name: /record a meeting/i }))
    expect(onStarter).toHaveBeenCalledWith("meeting")
  })

  it("hides the list when there are no starters", () => {
    render(<EmptyState starters={[]} />)
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("responds to its container, not the viewport, so it fits any layout", () => {
    const { container } = render(<EmptyState />)
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveClass("@container")
  })
})
