import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerProps,
  type DrawerSide,
} from "./drawer"

function Example(props: DrawerProps) {
  return (
    <>
      <button type="button">Page action</button>
      <Drawer {...props}>
        <DrawerTrigger>Open filters</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Narrow the list of invoices.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <input aria-label="Customer" />
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose>Apply</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

async function open(props: DrawerProps = {}) {
  const user = userEvent.setup()
  render(<Example {...props} />)
  await user.click(screen.getByRole("button", { name: "Open filters" }))
  return { user, panel: await screen.findByRole("dialog", { name: "Filters" }) }
}

const overlay = () => document.querySelector("[data-slot='drawer-overlay']")

describe("Drawer behaviour", () => {
  it("opens with a title and description, and closes on Escape", async () => {
    const { user, panel } = await open()
    expect(panel).toHaveAccessibleDescription("Narrow the list of invoices.")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("traps focus inside a modal variant", async () => {
    const { user, panel } = await open({ variant: "plain" })
    expect(panel.contains(document.activeElement)).toBe(true)
    for (let press = 0; press < 5; press += 1) {
      await user.tab()
      expect(panel.contains(document.activeElement)).toBe(true)
    }
  })

  it("returns focus to the trigger after closing", async () => {
    const { user } = await open()
    await user.click(screen.getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Open filters", hidden: true })).toHaveFocus())
  })

  it("reports changes and follows a controlled value", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Example open onOpenChange={onOpenChange} />)
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it.each<DrawerSide>(["left", "right", "top", "bottom"])("anchors to the %s edge", async (side) => {
    const { panel } = await open({ side })
    expect(panel).toHaveAttribute("data-side", side)
    expect(panel.className).toContain(`slide-in-from-${side}`)
  })
})

describe("Drawer variants", () => {
  it("plain sits flush against the edge with a scrim", async () => {
    const { panel } = await open({ variant: "plain" })
    expect(panel).toHaveAttribute("data-variant", "plain")
    expect(panel).toHaveClass("inset-y-0", "border-l")
    expect(overlay()).not.toBeNull()
  })

  it("floating is inset from the edges with a radius", async () => {
    const { panel } = await open({ variant: "floating" })
    expect(panel).toHaveClass("inset-y-2", "right-2", "rounded-xl")
    expect(overlay()).not.toBeNull()
  })

  it("split has no scrim, leaves the page usable and survives a click outside", async () => {
    const onPage = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <button type="button" onClick={onPage}>
          Keep working
        </button>
        <Drawer variant="split">
          <DrawerTrigger>Open notes</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Notes</DrawerTitle>
            <DrawerDescription>Beside the page.</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </>,
    )
    await user.click(screen.getByRole("button", { name: "Open notes" }))
    expect(overlay()).toBeNull()
    await user.click(screen.getByRole("button", { name: "Keep working" }))
    expect(onPage).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("dialog", { name: "Notes" })).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("sheet is forced to the bottom and carries a grab handle", async () => {
    const { panel } = await open({ variant: "sheet", side: "left" })
    expect(panel).toHaveAttribute("data-side", "bottom")
    expect(panel.querySelector("[data-slot='drawer-handle']")).not.toBeNull()
  })

  it("only sheet has a handle", async () => {
    const { panel } = await open({ variant: "floating" })
    expect(panel.querySelector("[data-slot='drawer-handle']")).toBeNull()
  })
})

describe("Drawer push effect", () => {
  it("drives the panel and the scrim through CSS, so Radix Presence can hold the exit", async () => {
    const { panel } = await open({ effect: "push" })
    expect(panel).toHaveAttribute("data-effect", "push")
    expect(panel).toHaveAttribute("data-state", "open")
    expect(panel.className).toContain("data-[state=closed]:animate-out")
    expect(panel.className).toContain("blur-in-sm")
    expect(panel.className).toContain("motion-reduce:blur-in-0")
    expect(overlay()?.className).toContain("backdrop-brightness-75")
  })

  it("plain panels do not blur", async () => {
    const { panel } = await open()
    expect(panel.className).not.toContain("blur-in-sm")
  })
})
