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
  type DialogEffect,
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

  async function openWith(effect: DialogEffect | undefined) {
    const user = setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent effect={effect} aria-describedby={undefined}>
          <DialogTitle>Plain</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    await user.click(screen.getByRole("button", { name: "Open" }))
    const surface = await screen.findByRole("dialog")
    return { user, surface, overlay: document.querySelector("[data-slot='dialog-overlay']") }
  }

  it("scrim-blur reaches the overlay through DialogContent and deepens its blur", async () => {
    const { surface, overlay } = await openWith("scrim-blur")
    expect(surface).toHaveAttribute("data-effect", "scrim-blur")
    expect(overlay).toHaveAttribute("data-effect", "scrim-blur")
    expect(overlay).toHaveClass("backdrop-blur-xl", "backdrop-brightness-75", "backdrop-saturate-50")
    expect(overlay).not.toHaveClass("backdrop-blur-sm")
  })

  it("scrim-blur ramps the blur from zero and gives way to a solid scrim under reduced transparency", async () => {
    const { overlay } = await openWith("scrim-blur")
    expect(overlay).toHaveClass("starting:backdrop-blur-[0px]", "data-[state=closed]:backdrop-blur-[0px]")
    expect(overlay).toHaveClass("motion-reduce:transition-none")
    expect(overlay).toHaveClass("[@media(prefers-reduced-transparency:reduce)]:backdrop-filter-none")
  })

  it("materialize brings the surface into focus with a mirrored exit and a plain overlay", async () => {
    const { surface, overlay } = await openWith("materialize")
    expect(surface).toHaveAttribute("data-effect", "materialize")
    expect(surface).toHaveClass("data-[state=open]:animate-in", "fade-in-0", "zoom-in-90", "blur-in-md")
    expect(surface).toHaveClass("data-[state=closed]:animate-out", "fade-out-0", "zoom-out-90", "blur-out-md")
    expect(surface).toHaveClass("motion-reduce:zoom-in-100", "motion-reduce:blur-in-0")
    expect(overlay).toHaveClass("backdrop-blur-sm")
  })

  it.each<DialogEffect>(["materialize", "scrim-blur"])("%s keeps Escape and focus containment working", async (effect) => {
    const { user, surface } = await openWith(effect)
    expect(surface).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus()
  })

  it("keeps the plain surface and overlay without the prop", async () => {
    const { surface, overlay } = await openWith(undefined)
    expect(surface).not.toHaveAttribute("data-effect")
    expect(overlay).not.toHaveAttribute("data-effect")
    expect(surface).toHaveClass("data-[state=open]:zoom-in-95")
    expect(overlay).toHaveClass("backdrop-blur-sm")
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
