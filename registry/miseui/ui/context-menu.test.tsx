import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Copy, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuQuickItem,
  ContextMenuQuickRow,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  type ContextMenuEffect,
  type ContextMenuVariant,
} from "./context-menu"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
})

afterAll(() => vi.unstubAllGlobals())

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

interface AppProps {
  variant?: ContextMenuVariant
  effect?: ContextMenuEffect
  onRename?: () => void
  onGrid?: (checked: boolean) => void
  disabled?: boolean
}

function App({ variant, effect, onRename, onGrid, disabled }: AppProps) {
  // Menu contents unmount on close, so anything that must outlive one opening is held out here.
  const [sort, setSort] = useState("name")
  return (
    <ContextMenu variant={variant} effect={effect}>
      <ContextMenuTrigger disabled={disabled}>Q3 forecast</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuQuickRow>
          <ContextMenuQuickItem aria-label="Copy link">
            <Copy />
          </ContextMenuQuickItem>
        </ContextMenuQuickRow>
        <ContextMenuGroup>
          <ContextMenuLabel>File</ContextMenuLabel>
          <ContextMenuItem onSelect={onRename} icon={<Copy />}>
            Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled>Revert</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Archive</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuCheckboxItem defaultChecked={false} onCheckedChange={onGrid}>
            Show grid
          </ContextMenuCheckboxItem>
          <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
            <ContextMenuRadioItem value="name">By name</ContextMenuRadioItem>
            <ContextMenuRadioItem value="date">By date</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuItem tone="destructive" icon={<Trash2 />}>
            Delete
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const openMenu = () => fireEvent.contextMenu(screen.getByText("Q3 forecast"), { clientX: 40, clientY: 40 })

describe("ContextMenu", () => {
  it("opens on the context menu event and runs an item", async () => {
    const user = setup()
    const onRename = vi.fn()
    render(<App onRename={onRename} />)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    openMenu()
    await user.click(await screen.findByRole("menuitem", { name: /Rename/ }))
    expect(onRename).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
  })

  it("keeps the trigger reachable by keyboard, and out of reach when disabled", () => {
    const { rerender } = render(<App />)
    expect(screen.getByText("Q3 forecast")).toHaveAttribute("tabindex", "0")
    rerender(<App disabled />)
    expect(screen.getByText("Q3 forecast")).not.toHaveAttribute("tabindex")
    openMenu()
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("opens after a long press on touch and not after a short tap", () => {
    vi.useFakeTimers()
    try {
      render(<App />)
      const trigger = screen.getByText("Q3 forecast")
      fireEvent.pointerDown(trigger, { pointerType: "touch", clientX: 10, clientY: 10 })
      act(() => vi.advanceTimersByTime(100))
      fireEvent.pointerUp(trigger, { pointerType: "touch" })
      act(() => vi.advanceTimersByTime(1000))
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
      fireEvent.pointerDown(trigger, { pointerType: "touch", clientX: 10, clientY: 10 })
      act(() => vi.advanceTimersByTime(800))
      expect(screen.getByRole("menu")).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it("moves with arrow keys, skips disabled items and opens a sub menu", async () => {
    const user = setup()
    render(<App />)
    openMenu()
    await screen.findByRole("menu")
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "Move to" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeInTheDocument()
  })

  it("toggles checkbox items and moves the radio selection", async () => {
    const user = setup()
    const onGrid = vi.fn()
    render(<App onGrid={onGrid} />)
    openMenu()
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Show grid" }))
    expect(onGrid).toHaveBeenCalledWith(true)
    openMenu()
    expect(await screen.findByRole("menuitemradio", { name: "By name" })).toHaveAttribute("aria-checked", "true")
    await user.click(screen.getByRole("menuitemradio", { name: "By date" }))
    openMenu()
    expect(await screen.findByRole("menuitemradio", { name: "By date" })).toHaveAttribute("aria-checked", "true")
  })

  it("makes the variants differ in structure", async () => {
    const shape = async (variant: ContextMenuVariant) => {
      const { unmount } = render(<App variant={variant} />)
      openMenu()
      const menu = await screen.findByRole("menu")
      const result = {
        separators: menu.querySelectorAll("[data-slot='context-menu-separator']").length,
        iconSlots: menu.querySelectorAll("[data-slot='context-menu-icon']").length,
        panelPadding: menu.className.includes("p-1"),
      }
      unmount()
      return result
    }
    expect(await shape("plain")).toEqual({ separators: 1, iconSlots: 2, panelPadding: true })
    expect(await shape("compact")).toEqual({ separators: 1, iconSlots: 0, panelPadding: true })
    expect(await shape("grouped")).toEqual({ separators: 0, iconSlots: 2, panelPadding: false })
    expect(await shape("icon")).toEqual({ separators: 1, iconSlots: 4, panelPadding: true })
  })

  it("names icon-only quick actions for assistive tech", async () => {
    render(<App variant="icon" />)
    openMenu()
    expect(await screen.findByRole("menuitem", { name: "Copy link" })).toBeInTheDocument()
  })

  it("marks destructive rows and passes materialize to the panel", async () => {
    render(<App effect="materialize" />)
    openMenu()
    const menu = await screen.findByRole("menu")
    expect(menu).toHaveAttribute("data-effect", "materialize")
    expect(menu.className).toContain("blur-in-sm")
    expect(menu.className).toContain("origin-(--radix-context-menu-content-transform-origin)")
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-tone", "destructive")
  })
})
