import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ButtonGroup, ButtonGroupItem, ButtonGroupMenu, type ButtonGroupVariant } from "./button-group"
import { DropdownMenuItem } from "./dropdown-menu"

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

const VARIANTS: readonly ButtonGroupVariant[] = ["plain", "outline", "split", "pill"]

function group() {
  return screen.getByRole("group", { name: "Message" })
}

describe("ButtonGroup items", () => {
  it("is a named group of real buttons, each firing its own action", async () => {
    const user = userEvent.setup()
    const onReply = vi.fn()
    const onForward = vi.fn()
    render(
      <ButtonGroup aria-label="Message">
        <ButtonGroupItem onClick={onReply}>Reply</ButtonGroupItem>
        <ButtonGroupItem onClick={onForward}>Forward</ButtonGroupItem>
      </ButtonGroup>,
    )
    await user.click(screen.getByRole("button", { name: "Forward" }))
    expect(onForward).toHaveBeenCalledTimes(1)
    expect(onReply).not.toHaveBeenCalled()
  })

  it("holds no state: pressing leaves no pressed or selected attribute behind", async () => {
    const user = userEvent.setup()
    render(
      <ButtonGroup aria-label="Message">
        <ButtonGroupItem>Reply</ButtonGroupItem>
      </ButtonGroup>,
    )
    const reply = screen.getByRole("button", { name: "Reply" })
    await user.click(reply)
    expect(reply).not.toHaveAttribute("aria-pressed")
    expect(reply).not.toHaveAttribute("data-state")
  })

  it("moves by Tab and skips a disabled item", async () => {
    const user = userEvent.setup()
    render(
      <ButtonGroup aria-label="Message">
        <ButtonGroupItem>Reply</ButtonGroupItem>
        <ButtonGroupItem disabled>Forward</ButtonGroupItem>
        <ButtonGroupItem>Archive</ButtonGroupItem>
      </ButtonGroup>,
    )
    await user.tab()
    expect(screen.getByRole("button", { name: "Reply" })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole("button", { name: "Archive" })).toHaveFocus()
  })
})

describe("ButtonGroup menu", () => {
  it("opens from the arrow with the keyboard and runs the chosen row", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onSchedule = vi.fn()
    render(
      <ButtonGroup aria-label="Message" variant="split">
        <ButtonGroupItem>Publish</ButtonGroupItem>
        <ButtonGroupMenu label="More publish options">
          <DropdownMenuItem onSelect={onSchedule}>Schedule</DropdownMenuItem>
        </ButtonGroupMenu>
      </ButtonGroup>,
    )
    const arrow = screen.getByRole("button", { name: "More publish options" })
    expect(arrow).toHaveAttribute("aria-haspopup", "menu")
    arrow.focus()
    await user.keyboard("{Enter}")
    await user.click(await screen.findByRole("menuitem", { name: "Schedule" }))
    expect(onSchedule).toHaveBeenCalledTimes(1)
  })

  it("is a direct child of the group, so the shared corners reach it", () => {
    render(
      <ButtonGroup aria-label="Message" variant="split">
        <ButtonGroupItem>Publish</ButtonGroupItem>
        <ButtonGroupMenu label="More">
          <DropdownMenuItem>Schedule</DropdownMenuItem>
        </ButtonGroupMenu>
      </ButtonGroup>,
    )
    const arrow = screen.getByRole("button", { name: "More" })
    expect(arrow.parentElement).toBe(group())
    expect(arrow).toHaveClass("last:rounded-r-[inherit]")
  })
})

describe("ButtonGroup structure", () => {
  it.each(VARIANTS)("%s draws its surface on the root", (variant) => {
    render(
      <ButtonGroup aria-label="Message" variant={variant}>
        <ButtonGroupItem>Reply</ButtonGroupItem>
      </ButtonGroup>,
    )
    expect(group()).toHaveAttribute("data-variant", variant)
    const want: Record<ButtonGroupVariant, string> = {
      plain: "bg-foreground/[0.06]",
      outline: "border",
      split: "bg-mise",
      pill: "rounded-3xl",
    }
    expect(group()).toHaveClass(want[variant])
  })

  it("only pill keeps its actions apart; the others share one divider", () => {
    const { rerender } = render(
      <ButtonGroup aria-label="Message" variant="outline">
        <ButtonGroupItem>Reply</ButtonGroupItem>
      </ButtonGroup>,
    )
    expect(group()).toHaveClass("divide-x")
    rerender(
      <ButtonGroup aria-label="Message" variant="pill">
        <ButtonGroupItem>Reply</ButtonGroupItem>
      </ButtonGroup>,
    )
    expect(group()).not.toHaveClass("divide-x")
    expect(group()).toHaveClass("gap-1")
  })

  it("stacks and rounds the other way when vertical", () => {
    render(
      <ButtonGroup aria-label="Message" orientation="vertical">
        <ButtonGroupItem>Reply</ButtonGroupItem>
      </ButtonGroup>,
    )
    expect(group()).toHaveAttribute("data-orientation", "vertical")
    expect(group()).toHaveClass("flex-col", "divide-y")
    expect(screen.getByRole("button", { name: "Reply" })).toHaveClass("w-full", "first:rounded-t-[inherit]")
  })

  it("dips the label, never the button, with the press effect", () => {
    render(
      <ButtonGroup aria-label="Message" effect="press">
        <ButtonGroupItem>Reply</ButtonGroupItem>
      </ButtonGroup>,
    )
    const reply = screen.getByRole("button", { name: "Reply" })
    expect(group()).toHaveAttribute("data-effect", "press")
    expect(reply.querySelector("[data-slot='button-group-label']")).toHaveClass("group-active/item:scale-[0.94]")
    expect(reply).not.toHaveClass("active:scale-[0.97]")
  })
})
