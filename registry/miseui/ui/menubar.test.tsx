import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  type MenubarProps,
  type MenubarVariant,
} from "./menubar"

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

function App({ onRename, onRuler, ...props }: MenubarProps & { onRename?: () => void; onRuler?: (checked: boolean) => void }) {
  // Menu contents unmount on close, so anything that must outlive one opening is held out here.
  const [zoom, setZoom] = useState("fit")
  return (
    <Menubar aria-label="Document" {...props}>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={onRename}>
            Rename <MenubarShortcut>F2</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>Revert</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Export</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>PDF</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem variant="destructive">Delete</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem defaultChecked={false} onCheckedChange={onRuler}>
            Ruler
          </MenubarCheckboxItem>
          <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
            <MenubarRadioItem value="fit">Fit</MenubarRadioItem>
            <MenubarRadioItem value="full">Full</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

const trigger = (name: string) => screen.getByRole("menuitem", { name })

describe("Menubar", () => {
  it("exposes a named menubar with its triggers as menu items", () => {
    render(<App />)
    expect(screen.getByRole("menubar", { name: "Document" })).toBeInTheDocument()
    expect(trigger("File")).toHaveAttribute("aria-haspopup", "menu")
    expect(trigger("View")).toHaveAttribute("aria-expanded", "false")
  })

  it("opens with a press, runs an item and closes", async () => {
    const user = setup()
    const onRename = vi.fn()
    render(<App onRename={onRename} />)
    await user.click(trigger("File"))
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true")
    await user.click(screen.getByRole("menuitem", { name: /Rename/ }))
    expect(onRename).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: /Rename/ })).not.toBeInTheDocument())
  })

  it("moves between triggers with arrow keys and opens with the keyboard", async () => {
    const user = setup()
    render(<App />)
    trigger("File").focus()
    await user.keyboard("{ArrowRight}")
    expect(trigger("View")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(trigger("File")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(await screen.findByRole("menuitem", { name: /Rename/ })).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(trigger("File")).toHaveFocus())
  })

  it("keeps a disabled item from running and skips it with the keyboard", async () => {
    const user = setup()
    render(<App />)
    await user.click(trigger("File"))
    expect(screen.getByRole("menuitem", { name: "Revert" })).toHaveAttribute("aria-disabled", "true")
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "Export" })).toHaveFocus()
  })

  it("opens a sub menu with ArrowRight", async () => {
    const user = setup()
    render(<App />)
    await user.click(trigger("File"))
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}")
    expect(await screen.findByRole("menuitem", { name: "PDF" })).toBeInTheDocument()
  })

  it("toggles checkbox items and moves the radio selection", async () => {
    const user = setup()
    const onRuler = vi.fn()
    render(<App onRuler={onRuler} />)
    await user.click(trigger("View"))
    expect(screen.getByRole("menuitemcheckbox", { name: "Ruler" })).toHaveAttribute("aria-checked", "false")
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Ruler" }))
    expect(onRuler).toHaveBeenCalledWith(true)
    await user.click(trigger("View"))
    expect(screen.getByRole("menuitemradio", { name: "Fit" })).toHaveAttribute("aria-checked", "true")
    await user.click(screen.getByRole("menuitemradio", { name: "Full" }))
    await user.click(trigger("View"))
    expect(screen.getByRole("menuitemradio", { name: "Full" })).toHaveAttribute("aria-checked", "true")
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: MenubarVariant) => {
      const { unmount } = render(<App variant={variant} title="Q3 forecast" actions={<button type="button">Share</button>} />)
      const bar = screen.getByRole("menubar")
      const result = {
        titleRow: document.querySelector("[data-slot='menubar-title']") !== null,
        shareShown: screen.queryByRole("button", { name: "Share" }) !== null,
        border: bar.className.includes("border"),
        rounded: trigger("File").className.includes("rounded-full"),
      }
      unmount()
      return result
    }
    expect(shape("plain")).toEqual({ titleRow: false, shareShown: false, border: true, rounded: false })
    expect(shape("ghost")).toEqual({ titleRow: false, shareShown: false, border: false, rounded: false })
    expect(shape("pill")).toEqual({ titleRow: false, shareShown: false, border: false, rounded: true })
    expect(shape("app")).toEqual({ titleRow: true, shareShown: true, border: false, rounded: false })
  })

  it.each([undefined, "materialize"] as const)("closes at once with effect %s, because an exit animation shuts the next menu that arrow keys open", async (effect) => {
    const user = setup()
    render(<App effect={effect} />)
    await user.click(trigger("File"))
    const content = await screen.findByRole("menu")
    expect(content.className).not.toContain("animate-out")
    expect(content.className).toContain("animate-in")
  })

  it("passes the materialize effect to the menu it opens", async () => {
    const user = setup()
    render(<App effect="materialize" />)
    await user.click(trigger("File"))
    const content = document.querySelector("[data-slot='menubar-content']") as HTMLElement
    expect(content).toHaveAttribute("data-effect", "materialize")
    expect(content.className).toContain("blur-in-sm")
    expect(content.className).toContain("origin-(--radix-menubar-content-transform-origin)")
  })
})
