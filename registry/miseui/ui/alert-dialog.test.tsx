import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogConfirmField,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  matchesConfirmation,
  type AlertDialogProps,
  type AlertDialogVariant,
} from "./alert-dialog"

const VARIANTS: readonly AlertDialogVariant[] = ["plain", "destructive", "typed", "compact"]

function Confirm({ onConfirm, ...props }: AlertDialogProps & { onConfirm?: () => void }) {
  return (
    <AlertDialog {...props}>
      <AlertDialogTrigger>Delete project</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        {props.variant === "typed" ? <AlertDialogConfirmField /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep project</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Delete project" }))
  return screen.findByRole("alertdialog")
}

describe("AlertDialog behaviour", () => {
  it("is an alertdialog named and described by its own text", async () => {
    const user = userEvent.setup()
    render(<Confirm />)
    const dialog = await open(user)
    expect(dialog).toHaveAccessibleName("Delete this project?")
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.")
  })

  it("lands focus on the safe action, so Enter cannot destroy anything", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Confirm onConfirm={onConfirm} variant="destructive" />)
    await open(user)
    expect(screen.getByRole("button", { name: "Keep project" })).toHaveFocus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup()
    render(<Confirm />)
    await open(user)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(screen.getByRole("button", { name: "Delete project" })).toHaveFocus()
  })

  it("keeps Tab inside the dialog and does not close on an outside press", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<Confirm />)
    await open(user)
    await user.tab()
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole("button", { name: "Keep project" })).toHaveFocus()
    await user.click(document.body)
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("runs the action when chosen", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Confirm onConfirm={onConfirm} />)
    await open(user)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

describe("AlertDialog typed", () => {
  it("starts in the field, unlocks only on the exact word, and Enter then confirms", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Confirm variant="typed" confirmWord="north-star" onConfirm={onConfirm} />)
    await open(user)
    const field = screen.getByRole("textbox", { name: /north-star/ })
    expect(field).toHaveFocus()
    const action = screen.getByRole("button", { name: "Delete" })
    expect(action).toBeDisabled()
    await user.keyboard("north{Enter}")
    expect(onConfirm).not.toHaveBeenCalled()
    await user.keyboard("-Star")
    expect(action).toBeDisabled()
    await user.clear(field)
    await user.keyboard("north-star")
    expect(action).toBeEnabled()
    await user.keyboard("{Enter}")
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("is locked again after reopening", async () => {
    const user = userEvent.setup()
    render(<Confirm variant="typed" confirmWord="north-star" />)
    await open(user)
    await user.keyboard("north-star")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    await open(user)
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled()
    expect(screen.getByRole("textbox")).toHaveValue("")
  })

  it("matches outer spaces away, keeps case strict and never accepts an empty word", () => {
    expect(matchesConfirmation(" north-star ", "north-star")).toBe(true)
    expect(matchesConfirmation("North-star", "north-star")).toBe(false)
    expect(matchesConfirmation("", "")).toBe(false)
  })
})

describe("AlertDialog structure", () => {
  it.each(VARIANTS)("%s is a bottom sheet on a phone and centred from sm", async (variant) => {
    const user = userEvent.setup()
    render(<Confirm variant={variant} confirmWord="delete" />)
    const dialog = await open(user)
    expect(dialog).toHaveAttribute("data-variant", variant)
    expect(dialog).toHaveClass("bottom-0", "rounded-t-xl", "sm:top-1/2", "sm:rounded-lg")
  })

  it("only destructive carries the warning mark", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Confirm variant="destructive" />)
    const dialog = await open(user)
    expect(dialog.querySelector("[data-slot='alert-dialog-mark']")).not.toBeNull()
    expect(dialog.querySelector("[data-slot='alert-dialog-header']")).toHaveClass("flex")
    unmount()
    render(<Confirm variant="plain" />)
    const plain = await open(user)
    expect(plain.querySelector("[data-slot='alert-dialog-mark']")).toBeNull()
  })

  it("compact joins two equal buttons under a hairline", async () => {
    const user = userEvent.setup()
    render(<Confirm variant="compact" />)
    const dialog = await open(user)
    expect(dialog.querySelector("[data-slot='alert-dialog-footer']")).toHaveClass("grid-cols-2", "border-t")
    expect(dialog).toHaveClass("sm:max-w-xs")
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("h-12")
  })

  it("uses the dark-safe ink on a destructive action", async () => {
    const user = userEvent.setup()
    render(<Confirm variant="destructive" />)
    await open(user)
    const action = screen.getByRole("button", { name: "Delete" })
    expect(action).toHaveClass("bg-destructive", "dark:text-background")
    expect(action).toHaveAttribute("data-tone", "destructive")
  })

  it("marks the effect", async () => {
    const user = userEvent.setup()
    render(<Confirm effect="materialize" />)
    const dialog = await open(user)
    expect(dialog).toHaveAttribute("data-effect", "materialize")
    expect(dialog).toHaveClass("blur-in-md")
  })
})
