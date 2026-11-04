import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EmptyState, type EmptyStateVariant } from "./empty-state"

const root = (container: HTMLElement) => container.querySelector('[data-slot="empty-state"]')

describe("EmptyState variants", () => {
  it("renders centered without the prop and for an unknown value", () => {
    const { container, rerender } = render(<EmptyState />)
    expect(root(container)).toHaveAttribute("data-variant", "centered")
    const markup = container.innerHTML
    rerender(<EmptyState variant={"nonsense" as EmptyStateVariant} />)
    expect(container.innerHTML).toBe(markup)
  })

  it("differs in structure, not only in colour", () => {
    const { container, rerender } = render(<EmptyState variant="centered" />)
    expect(screen.getByRole("button", { name: /record a meeting/i })).toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    rerender(<EmptyState variant="checklist" />)
    expect(root(container)).toHaveAttribute("data-variant", "checklist")
    expect(screen.getAllByRole("checkbox")).toHaveLength(3)
    expect(screen.queryByRole("button", { name: /record a meeting/i })).not.toBeInTheDocument()
    rerender(<EmptyState variant="sample" />)
    expect(root(container)).toHaveAttribute("data-variant", "sample")
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(screen.getByTestId("empty-state-ghost")).toBeInTheDocument()
  })

  it("does not put variant props on the DOM node", () => {
    const { container } = render(<EmptyState variant="checklist" starters={[]} onUseSample={() => undefined} />)
    expect(root(container)).not.toHaveAttribute("starters")
    expect(root(container)).not.toHaveAttribute("onUseSample")
  })

  describe("checklist", () => {
    it("marks progress when a task's button is pressed, and reports which one", async () => {
      const onTask = vi.fn()
      render(<EmptyState variant="checklist" onTask={onTask} />)
      expect(screen.getByText("0 of 3 done")).toBeInTheDocument()
      expect(screen.getByRole("progressbar", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "0")
      await userEvent.click(screen.getByRole("button", { name: "New project" }))
      expect(onTask).toHaveBeenCalledExactlyOnceWith("project")
      expect(screen.getByText("1 of 3 done")).toBeInTheDocument()
      expect(screen.getByRole("progressbar", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "1")
      expect(screen.getByRole("checkbox", { name: "Create your first project" })).toBeChecked()
    })

    it("moves focus to the next task, because the pressed button is gone", async () => {
      render(<EmptyState variant="checklist" />)
      await userEvent.click(screen.getByRole("button", { name: "New project" }))
      await waitFor(() => expect(screen.getByRole("button", { name: "Upload a PDF" })).toHaveFocus())
    })

    it("can be ticked and unticked by hand", async () => {
      const onCompletedChange = vi.fn()
      render(<EmptyState variant="checklist" onCompletedChange={onCompletedChange} />)
      const invite = screen.getByRole("checkbox", { name: "Invite one person" })
      await userEvent.click(invite)
      expect(onCompletedChange).toHaveBeenLastCalledWith(["invite"])
      expect(screen.getByText("1 of 3 done")).toBeInTheDocument()
      await userEvent.click(invite)
      expect(onCompletedChange).toHaveBeenLastCalledWith([])
      expect(screen.getByText("0 of 3 done")).toBeInTheDocument()
    })

    it("offers the way forward only after the last task", async () => {
      const onAction = vi.fn()
      render(<EmptyState variant="checklist" defaultCompleted={["project", "document"]} onAction={onAction} />)
      expect(screen.queryByRole("button", { name: "Open your project" })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: "Invite" }))
      const finish = screen.getByRole("button", { name: "Open your project" })
      await waitFor(() => expect(finish).toHaveFocus())
      await userEvent.click(finish)
      expect(onAction).toHaveBeenCalledOnce()
    })

    it("lets the owner decide when a task is done", async () => {
      const onTask = vi.fn()
      render(<EmptyState variant="checklist" completed={[]} onTask={onTask} />)
      await userEvent.click(screen.getByRole("button", { name: "New project" }))
      expect(onTask).toHaveBeenCalledWith("project")
      expect(screen.getByText("0 of 3 done")).toBeInTheDocument()
    })
  })

  describe("sample", () => {
    it("shows a ghost with no words or figures, hidden from assistive tech", () => {
      render(<EmptyState variant="sample" />)
      const ghost = screen.getByTestId("empty-state-ghost")
      expect(ghost).toHaveAttribute("aria-hidden", "true")
      expect(ghost).toHaveTextContent("")
      expect(screen.queryByRole("list", { name: "Sample projects" })).not.toBeInTheDocument()
    })

    it("fills in when asked, says it is made up, and clears back to the ghost", async () => {
      const onUseSample = vi.fn()
      const onClearSample = vi.fn()
      render(<EmptyState variant="sample" onUseSample={onUseSample} onClearSample={onClearSample} />)
      await userEvent.click(screen.getByRole("button", { name: "Use sample data" }))
      expect(onUseSample).toHaveBeenCalledOnce()
      const list = await screen.findByRole("list", { name: "Sample projects" })
      expect(within(list).getByText("Q3 board summary")).toBeInTheDocument()
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/made up/)
      expect(screen.queryByTestId("empty-state-ghost")).not.toBeInTheDocument()
      const clear = screen.getByRole("button", { name: "Clear sample data" })
      await waitFor(() => expect(clear).toHaveFocus())
      await userEvent.click(clear)
      expect(onClearSample).toHaveBeenCalledOnce()
      expect(screen.getByTestId("empty-state-ghost")).toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole("button", { name: "Use sample data" })).toHaveFocus())
    })

    it("cannot be pressed twice while loading", async () => {
      let finish = () => {}
      const onUseSample = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
      render(<EmptyState variant="sample" onUseSample={onUseSample} />)
      await userEvent.click(screen.getByRole("button", { name: "Use sample data" }))
      const loading = screen.getByRole("button", { name: "Loading sample" })
      expect(loading).toHaveAttribute("aria-disabled", "true")
      await userEvent.click(loading)
      expect(onUseSample).toHaveBeenCalledOnce()
      finish()
      expect(await screen.findByRole("list", { name: "Sample projects" })).toBeInTheDocument()
    })

    it("keeps the ghost and offers a retry when loading fails", async () => {
      const onUseSample = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined)
      render(<EmptyState variant="sample" onUseSample={onUseSample} />)
      await userEvent.click(screen.getByRole("button", { name: "Use sample data" }))
      expect(await screen.findByRole("alert")).toHaveTextContent(/did not load/)
      expect(screen.getByTestId("empty-state-ghost")).toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: "Try again" }))
      expect(await screen.findByRole("list", { name: "Sample projects" })).toBeInTheDocument()
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("starts for real from either state", async () => {
      const onAction = vi.fn()
      render(<EmptyState variant="sample" onAction={onAction} />)
      await userEvent.click(screen.getByRole("button", { name: "New project" }))
      expect(onAction).toHaveBeenCalledOnce()
    })
  })
})
