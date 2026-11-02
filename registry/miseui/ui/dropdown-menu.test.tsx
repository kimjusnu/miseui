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

  it("marks destructive items so they can be styled apart", async () => {
    const user = setup()
    renderMenu()
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await screen.findByRole("menu")
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "destructive")
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveAttribute("data-variant", "default")
  })
})
