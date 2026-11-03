import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  type ToolbarProps,
  type ToolbarVariant,
} from "./toolbar"

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

function Formatting({ onUndo, onAlign, ...props }: ToolbarProps & { onUndo?: () => void; onAlign?: (value: string) => void }) {
  return (
    <Toolbar aria-label="Formatting" {...props}>
      <ToolbarGroup aria-label="History">
        <ToolbarButton onClick={onUndo}>Undo</ToolbarButton>
        <ToolbarButton disabled>Redo</ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup type="single" aria-label="Alignment" defaultValue="left" onValueChange={onAlign}>
        <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
        <ToolbarToggleItem value="right">Right</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup type="multiple" aria-label="Style" defaultValue={["bold"]}>
        <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
        <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarLink href="#help">Help</ToolbarLink>
    </Toolbar>
  )
}

const button = (name: string) => screen.getByRole("button", { name })
const radio = (name: string) => screen.getByRole("radio", { name })
const root = () => screen.getByRole("toolbar")

describe("Toolbar", () => {
  it("is a named toolbar with one tab stop and roves with the arrow keys", async () => {
    const user = setup()
    render(<Formatting />)
    expect(root()).toHaveAccessibleName("Formatting")
    await user.tab()
    expect(button("Undo")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(radio("Left")).toHaveFocus()
    await user.keyboard("{End}")
    expect(screen.getByRole("link", { name: "Help" })).toHaveFocus()
    await user.keyboard("{Home}")
    expect(button("Undo")).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  it("skips disabled tools", async () => {
    const user = setup()
    render(<Formatting />)
    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(button("Redo")).not.toHaveFocus()
    expect(button("Redo")).toBeDisabled()
  })

  it("runs buttons and reports the single choice", async () => {
    const user = setup()
    const onUndo = vi.fn()
    const onAlign = vi.fn()
    render(<Formatting onUndo={onUndo} onAlign={onAlign} />)
    await user.click(button("Undo"))
    expect(onUndo).toHaveBeenCalledOnce()
    expect(radio("Left")).toHaveAttribute("aria-checked", "true")
    await user.click(radio("Right"))
    expect(onAlign).toHaveBeenCalledWith("right")
    expect(radio("Right")).toHaveAttribute("aria-checked", "true")
    expect(radio("Left")).toHaveAttribute("aria-checked", "false")
  })

  it("keeps several pressed in a multiple group, without announcing a second toolbar", async () => {
    const user = setup()
    render(<Formatting />)
    expect(screen.getAllByRole("toolbar")).toHaveLength(1)
    expect(screen.getByRole("group", { name: "Style" })).toBeInTheDocument()
    const bold = screen.getByRole("button", { name: "Bold" })
    const italic = screen.getByRole("button", { name: "Italic" })
    expect(bold).toHaveAttribute("aria-pressed", "true")
    await user.click(italic)
    expect(bold).toHaveAttribute("aria-pressed", "true")
    expect(italic).toHaveAttribute("aria-pressed", "true")
  })

  it("makes the variants differ in structure and orientation", () => {
    const shape = (variant: ToolbarVariant) => {
      const { unmount } = render(<Formatting variant={variant} />)
      const result = {
        orientation: root().getAttribute("aria-orientation"),
        column: root().className.includes("flex-col"),
        shadow: root().className.includes("shadow-lg"),
        pill: screen.getByRole("button", { name: "Undo" }).className.includes("rounded-full"),
      }
      unmount()
      return result
    }
    expect(shape("plain")).toEqual({ orientation: "horizontal", column: false, shadow: false, pill: false })
    expect(shape("floating")).toEqual({ orientation: "horizontal", column: false, shadow: true, pill: false })
    expect(shape("pill")).toEqual({ orientation: "horizontal", column: false, shadow: false, pill: true })
    expect(shape("vertical")).toEqual({ orientation: "vertical", column: true, shadow: false, pill: false })
  })

  it("moves with up and down on a vertical bar, and turns its separators sideways", async () => {
    const user = setup()
    render(<Formatting variant="vertical" />)
    await user.tab()
    await user.keyboard("{ArrowDown}")
    expect(radio("Left")).toHaveFocus()
    expect(document.querySelector("[data-slot='toolbar-separator']")).toHaveAttribute("data-orientation", "horizontal")
  })

  it("draws upright separators on a horizontal bar", () => {
    render(<Formatting />)
    expect(document.querySelector("[data-slot='toolbar-separator']")).toHaveAttribute("data-orientation", "vertical")
  })

  it("wraps by default, and scrolls inside itself with no rounded clip when asked", () => {
    const { unmount } = render(<Formatting />)
    expect(root().className).toContain("flex-wrap")
    expect(root().className).not.toContain("overflow-x-auto")
    unmount()
    render(<Formatting overflow="scroll" />)
    expect(root().className).toContain("overflow-x-auto")
    expect(root().className).toContain("rounded-none")
    expect(root().className).not.toContain("flex-wrap")
  })

  it("draws one spring highlight for a single choice, none for a multiple group", async () => {
    const user = setup()
    render(<Formatting effect="spring" />)
    const highlights = () => document.querySelectorAll("[data-slot='toolbar-highlight']")
    expect(highlights()).toHaveLength(1)
    expect(radio("Left").querySelector("[data-slot='toolbar-highlight']")).toBeInTheDocument()
    await user.click(radio("Right"))
    expect(highlights()).toHaveLength(1)
    expect(radio("Right").querySelector("[data-slot='toolbar-highlight']")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bold" }).querySelector("[data-slot='toolbar-highlight']")).toBeNull()
  })

  it("draws no highlight without the effect", () => {
    render(<Formatting />)
    expect(document.querySelector("[data-slot='toolbar-highlight']")).toBeNull()
  })
})
