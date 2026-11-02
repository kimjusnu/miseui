import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRef } from "react"
import { FloatingPanel, type FloatingPanelProps, type FloatingPanelVariant } from "./floating-panel"
import { clampPosition, clampSize, dockedX, nearestSide } from "./floating-panel-math"

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const BOUNDS = { width: 1000, height: 600 }
const renderPanel = (props: Partial<FloatingPanelProps> = {}) => render(<FloatingPanel title="Layers" {...props}><p>Body</p></FloatingPanel>)
const panel = () => screen.getByRole("dialog", { name: "Layers" })
const moveHandle = () => screen.getByRole("button", { name: "Move Layers" })
const resizeHandle = () => screen.getByRole("button", { name: "Resize Layers" })

beforeAll(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: BOUNDS.width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: BOUNDS.height })
})

describe("floating panel math", () => {
  it("clampPosition keeps the whole panel inside and pins an oversized one to the top left", () => {
    expect(clampPosition({ x: 900, y: -20 }, { width: 200, height: 100 }, BOUNDS)).toEqual({ x: 800, y: 0 })
    expect(clampPosition({ x: 40, y: 40 }, { width: 2000, height: 900 }, BOUNDS)).toEqual({ x: 0, y: 0 })
  })

  it("clampSize respects min, max and the room left to the bounds", () => {
    const position = { x: 900, y: 0 }
    expect(clampSize({ width: 400, height: 50 }, position, BOUNDS, { width: 80, height: 90 })).toEqual({ width: 100, height: 90 })
    expect(clampSize({ width: 400, height: 900 }, { x: 0, y: 0 }, BOUNDS, { width: 80, height: 90 }, { width: 300 })).toEqual({ width: 300, height: 600 })
  })

  it("nearestSide and dockedX send a panel to the side its centre is on", () => {
    expect(nearestSide(100, 200, 1000)).toBe("left")
    expect(nearestSide(600, 200, 1000)).toBe("right")
    expect(dockedX("left", 200, 1000)).toBe(0)
    expect(dockedX("right", 200, 1000)).toBe(800)
  })
})

describe("FloatingPanel", () => {
  it.each<FloatingPanelVariant>(["panel", "compact", "docked", "tool"])("%s is a dialog named by its title", (variant) => {
    renderPanel({ variant })
    expect(panel()).toHaveAttribute("data-variant", variant)
    expect(panel()).not.toHaveAttribute("aria-modal")
  })

  it("the variants differ in structure: tool hides the title and has no resize; docked marks its side", () => {
    const { unmount } = renderPanel({ variant: "tool" })
    expect(screen.queryByRole("button", { name: "Resize Layers" })).toBeNull()
    expect(screen.getByText("Layers")).toHaveClass("sr-only")
    unmount()
    renderPanel({ variant: "docked" })
    expect(panel()).toHaveAttribute("data-side", "right")
    expect(resizeHandle().className).toContain("cursor-ew-resize")
  })

  it("dragging uses pointer capture and reports where it landed, clamped inside", () => {
    const capture = vi.fn()
    const onPositionChange = vi.fn()
    renderPanel({ defaultPosition: { x: 100, y: 100 }, onPositionChange })
    moveHandle().setPointerCapture = capture
    fireEvent.pointerDown(moveHandle(), { button: 0, pointerId: 7, clientX: 110, clientY: 110 })
    expect(capture).toHaveBeenCalledWith(7)
    fireEvent.pointerMove(moveHandle(), { clientX: 160, clientY: 130 })
    fireEvent.pointerUp(moveHandle())
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 150, y: 120 })
    fireEvent.pointerDown(moveHandle(), { button: 0, pointerId: 7, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(moveHandle(), { clientX: 5000, clientY: 5000 })
    fireEvent.pointerUp(moveHandle())
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: BOUNDS.width - 288, y: BOUNDS.height - 240 })
  })

  it("a move after release does nothing, and pressing a header button does not start a drag", async () => {
    const user = setup()
    const onPositionChange = vi.fn()
    renderPanel({ onPositionChange })
    fireEvent.pointerMove(moveHandle(), { clientX: 200, clientY: 200 })
    fireEvent.pointerUp(moveHandle())
    expect(onPositionChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Minimise" }))
    expect(onPositionChange).not.toHaveBeenCalled()
  })

  it("arrow keys move the panel, Shift moves further, and it stops at the edge", async () => {
    const user = setup()
    const onPositionChange = vi.fn()
    renderPanel({ defaultPosition: { x: 40, y: 40 }, onPositionChange })
    moveHandle().focus()
    await user.keyboard("{ArrowRight}")
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 56, y: 40 })
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}")
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 56, y: 88 })
    await user.keyboard("{Shift>}{ArrowUp}{ArrowUp}{ArrowUp}{/Shift}")
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 56, y: 0 })
  })

  it("resizes by pointer and by keyboard, within minSize and maxSize", async () => {
    const user = setup()
    const onSizeChange = vi.fn()
    renderPanel({
      defaultPosition: { x: 0, y: 0 },
      defaultSize: { width: 300, height: 200 },
      minSize: { width: 200, height: 100 },
      maxSize: { width: 320 },
      onSizeChange,
    })
    fireEvent.pointerDown(resizeHandle(), { button: 0, pointerId: 1, clientX: 300, clientY: 200 })
    fireEvent.pointerMove(resizeHandle(), { clientX: 500, clientY: 240 })
    fireEvent.pointerUp(resizeHandle())
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 320, height: 240 })
    resizeHandle().focus()
    await user.keyboard("{ArrowLeft}")
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 304, height: 240 })
  })

  it("minimise collapses the body out of the tab order, and restore brings it back", async () => {
    const user = setup()
    const onMinimizedChange = vi.fn()
    renderPanel({ onMinimizedChange })
    await user.click(screen.getByRole("button", { name: "Minimise" }))
    expect(onMinimizedChange).toHaveBeenCalledWith(true)
    expect(panel()).toHaveAttribute("data-minimized", "true")
    expect(document.querySelector("[data-slot='floating-panel-collapse']")).toHaveAttribute("inert")
    expect(screen.queryByRole("button", { name: "Resize Layers" })).toBeNull()
    const restore = screen.getByRole("button", { name: "Restore" })
    expect(restore).toHaveAttribute("aria-expanded", "false")
    await user.click(restore)
    expect(document.querySelector("[data-slot='floating-panel-collapse']")).not.toHaveAttribute("inert")
  })

  it("close and Escape close it and focus returns to where it came from", async () => {
    const user = setup()
    const onOpenChange = vi.fn()
    render(
      <>
        <button type="button">Open layers</button>
        <FloatingPanel title="Layers" onOpenChange={onOpenChange}>Body</FloatingPanel>
      </>,
    )
    const opener = screen.getByRole("button", { name: "Open layers" })
    opener.focus()
    await user.tab()
    expect(panel()).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(opener).toHaveFocus()
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("closable=false removes the button and turns Escape off", async () => {
    const user = setup()
    const onOpenChange = vi.fn()
    renderPanel({ closable: false, onOpenChange })
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
    moveHandle().focus()
    await user.keyboard("{Escape}")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("stays inside a boundary element, positioned absolutely and with no portal", () => {
    function Stage(props: Partial<FloatingPanelProps>) {
      const stage = useRef<HTMLDivElement>(null)
      return (
        <div ref={stage} data-testid="stage">
          <FloatingPanel title="Layers" boundary={stage} {...props}>Body</FloatingPanel>
        </div>
      )
    }
    const onPositionChange = vi.fn()
    render(<Stage onPositionChange={onPositionChange} defaultSize={{ width: 100, height: 50 }} defaultPosition={{ x: 0, y: 0 }} />)
    const stage = screen.getByTestId("stage")
    expect(stage).toContainElement(panel())
    expect(panel().className).toContain("absolute")
    Object.defineProperty(stage, "clientWidth", { configurable: true, value: 300 })
    Object.defineProperty(stage, "clientHeight", { configurable: true, value: 200 })
    fireEvent.pointerDown(moveHandle(), { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(moveHandle(), { clientX: 900, clientY: 900 })
    fireEvent.pointerUp(moveHandle())
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 200, y: 150 })
  })

  it("floats over the viewport through a portal when there is no boundary", () => {
    const { container } = renderPanel()
    expect(container).not.toContainElement(panel())
    expect(panel().className).toContain("fixed")
  })

  it("docked goes to the side it is released nearest to, and reports that position", async () => {
    const onPositionChange = vi.fn()
    renderPanel({ variant: "docked", onPositionChange, defaultSize: { width: 200, height: 100 } })
    fireEvent.pointerDown(moveHandle(), { button: 0, pointerId: 1, clientX: 900, clientY: 10 })
    fireEvent.pointerMove(moveHandle(), { clientX: 100, clientY: 10 })
    fireEvent.pointerUp(moveHandle())
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 0, y: 0 })
    await waitFor(() => expect(panel()).toHaveAttribute("data-side", "left"))
  })

  it("momentum marks the effect; with no speed it lands where it was dropped", () => {
    const onPositionChange = vi.fn()
    renderPanel({ effect: "momentum", defaultPosition: { x: 10, y: 10 }, onPositionChange })
    expect(panel()).toHaveAttribute("data-effect", "momentum")
    fireEvent.pointerDown(moveHandle(), { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(moveHandle())
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 10, y: 10 })
  })
})
