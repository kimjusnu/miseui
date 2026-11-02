import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  type DropdownMenuEffect,
} from "./dropdown-menu"

// jsdom has no ResizeObserver; Radix positions the menu with it.
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// Radix disables pointer events on the page while the menu is open; user-event would refuse to click otherwise.
const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

function renderMenu(onSelect: () => void = vi.fn()) {
  return render(
    <DropdownMenu>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onSelect}>
            Rename <DropdownMenuShortcut>R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  )
}

describe("DropdownMenu", () => {
  it("opens from the trigger and lists its items", async () => {
    const user = setup()
    renderMenu()
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Actions" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    expect(screen.getAllByRole("menuitem")).toHaveLength(3)
    expect(screen.getByText("Project")).toBeInTheDocument()
  })

  it("calls onSelect and closes when an item is chosen", async () => {
    const user = setup()
    const onSelect = vi.fn()
    renderMenu(onSelect)
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await user.click(await screen.findByRole("menuitem", { name: /Rename/ }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
  })

  it("moves focus to the first item with ArrowDown", async () => {
    const user = setup()
    renderMenu()
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus()
  })

  function renderEffect(effect: DropdownMenuEffect | undefined, onSelect: () => void = vi.fn()) {
    return render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent effect={effect}>
          <DropdownMenuItem onSelect={onSelect}>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="#docs">Docs</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
  }

  const HIGHLIGHT = "[data-slot='dropdown-menu-highlight']"
  const highlightedItems = () =>
    screen.getAllByRole("menuitem").filter((item) => item.querySelector(HIGHLIGHT) !== null)

  it("materialize grows from the trigger's origin, with a mirrored exit", async () => {
    const user = setup()
    renderEffect("materialize")
    await user.click(screen.getByRole("button", { name: "Actions" }))
    const surface = await screen.findByRole("menu")
    expect(surface).toHaveAttribute("data-effect", "materialize")
    expect(surface).toHaveClass("origin-(--radix-dropdown-menu-content-transform-origin)")
    expect(surface).toHaveClass("data-[state=open]:animate-in", "fade-in-0", "zoom-in-90", "blur-in-sm")
    expect(surface).toHaveClass("data-[state=closed]:animate-out", "fade-out-0", "zoom-out-90", "blur-out-sm")
    expect(surface).toHaveClass("motion-reduce:zoom-in-100", "[@media(prefers-reduced-transparency:reduce)]:blur-in-0")
  })

  it("materialize draws no highlight of its own", async () => {
    const user = setup()
    renderEffect("materialize")
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus()
    expect(document.querySelector(HIGHLIGHT)).toBeNull()
  })

  it("spring keeps one highlight on the focused item as the arrow keys move", async () => {
    const user = setup()
    const onSelect = vi.fn()
    renderEffect("spring", onSelect)
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    await user.keyboard("{ArrowDown}")
    expect(highlightedItems().map((item) => item.textContent)).toEqual(["Rename"])
    await user.keyboard("{ArrowDown}")
    expect(highlightedItems().map((item) => item.textContent)).toEqual(["Duplicate"])
    await user.keyboard("{ArrowUp}{Enter}")
    expect(onSelect).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
  })

  it("spring follows the pointer and leaves with it", async () => {
    const user = setup()
    renderEffect("spring")
    await user.click(screen.getByRole("button", { name: "Actions" }))
    const duplicate = await screen.findByRole("menuitem", { name: "Duplicate" })
    await user.hover(duplicate)
    await waitFor(() => expect(highlightedItems().map((item) => item.textContent)).toEqual(["Duplicate"]))
    await user.unhover(duplicate)
    await waitFor(() => expect(highlightedItems()).toEqual([]))
  })

  it("spring keeps typeahead working, and tints the destructive highlight in its own colour", async () => {
    const user = setup()
    renderEffect("spring")
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    await user.keyboard("d")
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus())
    await user.keyboard("{ArrowDown}")
    const remove = screen.getByRole("menuitem", { name: "Delete" })
    expect(remove).toHaveFocus()
    expect(remove.querySelector(HIGHLIGHT)).toHaveClass("bg-destructive/10")
    expect(remove).toHaveClass("data-[variant=destructive]:focus:bg-transparent")
  })

  it("spring gives an asChild item the plain focus style, since a Slot takes one child", async () => {
    const user = setup()
    renderEffect("spring")
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    await user.keyboard("{End}")
    const docs = screen.getByRole("menuitem", { name: "Docs" })
    expect(docs).toHaveFocus()
    expect(docs.querySelector(HIGHLIGHT)).toBeNull()
    expect(docs).toHaveClass("focus:bg-accent")
  })

  it("spring drops the shared-layout slide under reduced motion but keeps the highlight", async () => {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const fresh = await import("./dropdown-menu")
    vi.doUnmock("motion/react")
    const user = setup()
    render(
      <fresh.DropdownMenu>
        <fresh.DropdownMenuTrigger>Actions</fresh.DropdownMenuTrigger>
        <fresh.DropdownMenuContent effect="spring">
          <fresh.DropdownMenuItem>Rename</fresh.DropdownMenuItem>
        </fresh.DropdownMenuContent>
      </fresh.DropdownMenu>,
    )
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    await user.keyboard("{ArrowDown}")
    expect(document.querySelector(HIGHLIGHT)).toHaveAttribute("data-reduced", "true")
  })

  it("renders no effect markers without the prop", async () => {
    const user = setup()
    renderEffect(undefined)
    await user.click(screen.getByRole("button", { name: "Actions" }))
    const surface = await screen.findByRole("menu")
    await user.keyboard("{ArrowDown}")
    expect(surface).not.toHaveAttribute("data-effect")
    expect(surface).toHaveClass("data-[state=open]:zoom-in-95")
    expect(document.querySelector(HIGHLIGHT)).toBeNull()
  })

  it("marks destructive items so they can be styled apart", async () => {
    const user = setup()
    renderMenu()
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "destructive")
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveAttribute("data-variant", "default")
  })
})
