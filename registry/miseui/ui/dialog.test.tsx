import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

function renderDialog() {
  return render(
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  )
}

// Radix disables pointer events on the page behind a modal; user-event would refuse to click otherwise.
const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

describe("Dialog", () => {
  it("opens from the trigger and is labelled by its title and description", async () => {
    const user = setup()
    renderDialog()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("aria-labelledby", screen.getByText("Delete project").id)
    expect(dialog).toHaveAttribute("aria-describedby", screen.getByText("This cannot be undone.").id)
  })

  it("closes with Escape", async () => {
    const user = setup()
    renderDialog()
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("closes from the built-in corner button", async () => {
    const user = setup()
    renderDialog()
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    await user.click(screen.getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("closes from a DialogClose placed in the footer", async () => {
    const user = setup()
    renderDialog()
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("can drop the corner button when the footer already offers a way out", async () => {
    const user = setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false} aria-describedby={undefined}>
          <DialogTitle>Plain</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument()
  })
})
