import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Resizable, type ResizableProps } from "./resizable"
import {
  addSample,
  clampSize,
  dragBounds,
  flickTarget,
  restingSize,
  sizeForKey,
  stretchSize,
  velocityOf,
} from "./resizable-math"

const CONTAINER_PX = 1000
const LIMITS = { min: 20, max: 80 }
let clockOffset = 0
const realNow = performance.now.bind(performance)

beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  // Only ever jumps forward from real time, because the motion springs read the same clock.
  vi.spyOn(performance, "now").mockImplementation(() => realNow() + clockOffset)
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ width: CONTAINER_PX, height: CONTAINER_PX, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect,
  )
})

afterAll(() => {
  vi.restoreAllMocks()
})

function Panes(props: Partial<ResizableProps>) {
  return (
    <Resizable variant="hidden" defaultSize={50} min={20} max={80} {...props}>
      <button>First pane</button>
      <button>Second pane</button>
    </Resizable>
  )
}

const handle = () => screen.getByRole("separator")
const valueNow = () => Number(handle().getAttribute("aria-valuenow"))
const painted = () => Number(document.querySelector<HTMLElement>("[data-slot='resizable-panel']")?.style.getPropertyValue("--resizable-size"))

function press(position = 500, axis: "clientX" | "clientY" = "clientX") {
  fireEvent.pointerDown(handle(), { pointerId: 1, button: 0, [axis]: position })
}

/** Each step advances the fake clock, which is what velocity is read from. */
function move(position: number, elapsedMs = 16, axis: "clientX" | "clientY" = "clientX") {
  clockOffset += elapsedMs
  fireEvent.pointerMove(handle(), { pointerId: 1, [axis]: position })
}

function release() {
  fireEvent.pointerUp(handle(), { pointerId: 1 })
}

describe("resizable math", () => {
  it("clampSize stays inside the limits", () => {
    expect(clampSize(5, LIMITS)).toBe(20)
    expect(clampSize(95, LIMITS)).toBe(80)
    expect(clampSize(50, LIMITS)).toBe(50)
  })

  it("stretchSize is exact inside the limits and resists past them, more the further it goes", () => {
    expect(stretchSize(50, LIMITS, 1000)).toBe(50)
    const near = stretchSize(10, LIMITS, 1000)
    const far = stretchSize(-50, LIMITS, 1000)
    expect(near).toBeLessThan(20)
    expect(near).toBeGreaterThan(10)
    expect(far).toBeLessThan(near)
    expect(20 - near).toBeGreaterThan((20 - far) / 7)
  })

  it("velocityOf reads only the last moments and reports zero after a pause", () => {
    const samples = [
      { position: 0, time: 0 },
      { position: 100, time: 50 },
    ]
    expect(velocityOf(samples, 50)).toBe(2000)
    expect(velocityOf(samples, 400)).toBe(0)
    expect(velocityOf([], 0)).toBe(0)
  })

  it("addSample drops old samples without touching the original", () => {
    const original = [{ position: 0, time: 0 }]
    const next = addSample(original, { position: 10, time: 500 })
    expect(next).toEqual([{ position: 10, time: 500 }])
    expect(original).toHaveLength(1)
  })

  it("flickTarget uses the projected landing, so the same speed reaches less on a longer container", () => {
    expect(flickTarget(30, -2000, 1000, LIMITS)).toBe(0)
    expect(flickTarget(70, 2000, 1000, LIMITS)).toBe(100)
    expect(flickTarget(50, -600, 4000, LIMITS)).toBeNull()
  })

  it("flickTarget ignores a slow release even right beside the limit", () => {
    expect(flickTarget(21, -400, 1000, LIMITS)).toBeNull()
  })

  it("dragBounds widens only for a pane that starts collapsed", () => {
    expect(dragBounds(50, LIMITS)).toEqual(LIMITS)
    expect(dragBounds(0, LIMITS)).toEqual({ min: 0, max: 80 })
    expect(dragBounds(100, LIMITS)).toEqual({ min: 20, max: 100 })
  })

  it("restingSize keeps a barely pulled pane collapsed and clamps anything else", () => {
    expect(restingSize(5, 0, LIMITS)).toBe(0)
    expect(restingSize(15, 0, LIMITS)).toBe(20)
    expect(restingSize(95, 100, LIMITS)).toBe(100)
    expect(restingSize(10, 50, LIMITS)).toBe(20)
  })

  it("sizeForKey maps keys to the axis and ignores the others", () => {
    const context = { horizontal: true, sign: 1, current: 50, step: 5, limits: LIMITS }
    expect(sizeForKey({ ...context, key: "ArrowRight" })).toBe(55)
    expect(sizeForKey({ ...context, key: "ArrowLeft" })).toBe(45)
    expect(sizeForKey({ ...context, key: "ArrowDown" })).toBeNull()
    expect(sizeForKey({ ...context, key: "ArrowDown", horizontal: false })).toBe(55)
    expect(sizeForKey({ ...context, key: "ArrowRight", sign: -1 })).toBe(45)
    expect(sizeForKey({ ...context, key: "Home" })).toBe(20)
    expect(sizeForKey({ ...context, key: "End" })).toBe(80)
    expect(sizeForKey({ ...context, key: "x" })).toBeNull()
  })
})

describe("Resizable semantics", () => {
  it("is a focusable separator describing its value and limits", () => {
    render(<Panes handleLabel="Resize sidebar" />)
    const separator = screen.getByRole("separator", { name: "Resize sidebar" })
    expect(separator).toHaveAttribute("tabindex", "0")
    expect(separator).toHaveAttribute("aria-orientation", "vertical")
    expect(separator).toHaveAttribute("aria-valuenow", "50")
    expect(separator).toHaveAttribute("aria-valuemin", "20")
    expect(separator).toHaveAttribute("aria-valuemax", "80")
    expect(document.getElementById(separator.getAttribute("aria-controls") as string)).toHaveTextContent("First pane")
  })

  it("flips the separator orientation for vertical panes", () => {
    render(<Panes direction="vertical" />)
    expect(handle()).toHaveAttribute("aria-orientation", "horizontal")
    expect(document.querySelector("[data-slot='resizable']")).toHaveClass("flex-col")
  })

  it("leaves the tab order and ignores input when disabled", async () => {
    const onSizeChange = vi.fn()
    render(<Panes disabled onSizeChange={onSizeChange} />)
    expect(handle()).not.toHaveAttribute("tabindex")
    expect(handle()).toHaveAttribute("aria-disabled", "true")
    press()
    move(700)
    fireEvent.keyDown(handle(), { key: "ArrowRight" })
    fireEvent.doubleClick(handle())
    expect(onSizeChange).not.toHaveBeenCalled()
  })
})

describe("Resizable pointer", () => {
  it("captures the pointer and follows it", () => {
    const onSizeChange = vi.fn()
    render(<Panes onSizeChange={onSizeChange} />)
    press()
    expect(handle().setPointerCapture).toHaveBeenCalledWith(1)
    expect(handle()).toHaveAttribute("data-dragging", "true")
    move(600)
    expect(valueNow()).toBe(60)
    expect(onSizeChange).toHaveBeenLastCalledWith(60)
    release()
    expect(handle()).toHaveAttribute("data-dragging", "false")
  })

  it("reads the vertical axis for vertical panes", () => {
    render(<Panes direction="vertical" />)
    press(500, "clientY")
    move(400, 16, "clientY")
    expect(valueNow()).toBe(40)
  })

  it("ignores a secondary button and a different pointer", () => {
    const onSizeChange = vi.fn()
    render(<Panes onSizeChange={onSizeChange} />)
    fireEvent.pointerDown(handle(), { pointerId: 1, button: 2, clientX: 500 })
    move(700)
    press()
    fireEvent.pointerMove(handle(), { pointerId: 9, clientX: 900 })
    expect(onSizeChange).not.toHaveBeenCalled()
  })

  it("rubberbands past a limit while reporting only the limit, then settles back", async () => {
    const onSizeChange = vi.fn()
    render(<Panes onSizeChange={onSizeChange} />)
    press()
    move(100, 200)
    expect(onSizeChange).toHaveBeenLastCalledWith(20)
    await waitFor(() => expect(painted()).toBeLessThan(20))
    expect(painted()).toBeGreaterThan(10)
    clockOffset += 200
    release()
    expect(valueNow()).toBe(20)
    await waitFor(() => expect(painted()).toBeCloseTo(20, 0), { timeout: 3000 })
  })

  it("releases on pointercancel without treating it as a flick", () => {
    render(<Panes effect="snap" />)
    press()
    move(300)
    fireEvent.pointerCancel(handle(), { pointerId: 1 })
    expect(handle()).toHaveAttribute("data-dragging", "false")
    expect(valueNow()).toBe(30)
  })

  it("resets to the default size on double-click", () => {
    const onSizeChange = vi.fn()
    render(<Panes defaultSize={35} onSizeChange={onSizeChange} />)
    fireEvent.keyDown(handle(), { key: "End" })
    expect(valueNow()).toBe(80)
    fireEvent.doubleClick(handle())
    expect(valueNow()).toBe(35)
    expect(onSizeChange).toHaveBeenLastCalledWith(35)
  })
})

describe("Resizable keyboard", () => {
  it("moves by step with the arrows on its own axis and stops at the limits", async () => {
    const user = userEvent.setup()
    render(<Panes step={10} />)
    await user.tab()
    await user.tab()
    expect(handle()).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(valueNow()).toBe(60)
    await user.keyboard("{ArrowUp}")
    expect(valueNow()).toBe(60)
    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(valueNow()).toBe(40)
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}")
    expect(valueNow()).toBe(20)
  })

  it("jumps to the limits with Home and End", () => {
    render(<Panes />)
    fireEvent.keyDown(handle(), { key: "End" })
    expect(valueNow()).toBe(80)
    fireEvent.keyDown(handle(), { key: "Home" })
    expect(valueNow()).toBe(20)
  })

  it("Enter resets when the pane cannot collapse, matching double-click", () => {
    render(<Panes defaultSize={30} />)
    fireEvent.keyDown(handle(), { key: "End" })
    fireEvent.keyDown(handle(), { key: "Enter" })
    expect(valueNow()).toBe(30)
  })

  it("arrows run the other way in a right-to-left layout", () => {
    render(
      <div dir="rtl" style={{ direction: "rtl" }}>
        <Panes />
      </div>,
    )
    fireEvent.keyDown(handle(), { key: "ArrowRight" })
    expect(valueNow()).toBe(45)
  })
})

describe("Resizable controlled", () => {
  it("takes its size from the prop and paints the new value", async () => {
    const { rerender } = render(<Panes size={30} />)
    expect(valueNow()).toBe(30)
    rerender(<Panes size={70} />)
    expect(valueNow()).toBe(70)
    await waitFor(() => expect(painted()).toBe(70))
  })

  it("reports a drag without moving until the parent agrees", () => {
    const onSizeChange = vi.fn()
    render(<Panes size={30} onSizeChange={onSizeChange} />)
    press(300)
    move(400)
    expect(onSizeChange).toHaveBeenCalledWith(40)
    expect(valueNow()).toBe(30)
  })

  it("puts the pane back when the parent refuses the new size", async () => {
    render(<Panes size={30} />)
    press(300)
    move(400)
    release()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await waitFor(() => expect(painted()).toBe(30))
  })
})

describe("Resizable designs", () => {
  it("gives each variant a different handle and frame", () => {
    const { rerender } = render(<Panes variant="line" />)
    const root = () => document.querySelector("[data-slot='resizable']")
    const mark = () => handle().querySelector("[data-part='mark']")
    expect(handle()).toHaveClass("w-px", "bg-border")
    expect(mark()).toBeNull()
    expect(root()).toHaveClass("border")
    rerender(<Panes variant="grip" />)
    expect(handle()).toHaveClass("w-3", "bg-muted")
    expect(mark()).toHaveClass("rounded-full")
    expect(mark()).not.toHaveClass("opacity-0")
    rerender(<Panes variant="gap" />)
    expect(root()).not.toHaveClass("border")
    expect(document.querySelector("[data-slot='resizable-panel']")).toHaveClass("rounded-lg", "border", "bg-card")
    expect(mark()).toHaveClass("opacity-0")
    rerender(<Panes variant="hidden" />)
    expect(handle()).toHaveClass("w-0")
    expect(mark()).toHaveClass("absolute", "opacity-0")
  })

  it("subtracts the handle from the space the panes share", () => {
    render(<Panes variant="grip" />)
    const first = document.querySelector<HTMLElement>("[data-slot='resizable-panel']")
    expect(first?.getAttribute("style")).toContain("100% - 12px")
  })

  it("keeps a touch target of at least 40 px around a thin handle", () => {
    render(<Panes variant="line" />)
    expect(handle()).toHaveClass("pointer-coarse:after:-inset-x-5", "after:absolute", "touch-none")
  })
})

describe("Resizable snap effect", () => {
  it("collapses the first pane on a flick and takes it out of the tab order", () => {
    const onSizeChange = vi.fn()
    render(<Panes effect="snap" onSizeChange={onSizeChange} />)
    expect(handle()).toHaveAttribute("aria-valuemin", "0")
    press(500)
    move(460, 16)
    move(420, 16)
    release()
    expect(valueNow()).toBe(0)
    expect(onSizeChange).toHaveBeenLastCalledWith(0)
    expect(screen.getByText("First pane").closest("[data-slot='resizable-panel']")).toHaveAttribute("inert")
    expect(screen.getByText("Second pane").closest("[data-slot='resizable-panel']")).not.toHaveAttribute("inert")
  })

  it("collapses the second pane on a flick the other way", () => {
    render(<Panes effect="snap" />)
    press(500)
    move(540, 16)
    move(580, 16)
    release()
    expect(valueNow()).toBe(100)
    expect(screen.getByText("Second pane").closest("[data-slot='resizable-panel']")).toHaveAttribute("inert")
  })

  it("does not collapse on a slow release, or after the hand stopped", () => {
    render(<Panes effect="snap" />)
    press(500)
    move(300, 1000)
    move(250, 1000)
    release()
    expect(valueNow()).toBe(25)
    press(250)
    move(210, 16)
    clockOffset += 500
    release()
    expect(valueNow()).toBe(21)
  })

  it("does not collapse without the effect, however hard the flick", () => {
    render(<Panes />)
    press(500)
    move(400, 16)
    move(300, 16)
    release()
    expect(valueNow()).toBe(30)
  })

  it("Enter collapses and restores the size it had", () => {
    render(<Panes effect="snap" />)
    fireEvent.keyDown(handle(), { key: "ArrowRight" })
    expect(valueNow()).toBe(55)
    fireEvent.keyDown(handle(), { key: "Enter" })
    expect(valueNow()).toBe(0)
    fireEvent.keyDown(handle(), { key: "Enter" })
    expect(valueNow()).toBe(55)
  })

  it("an arrow key opens a collapsed pane at its minimum", () => {
    render(<Panes effect="snap" />)
    fireEvent.keyDown(handle(), { key: "Enter" })
    fireEvent.keyDown(handle(), { key: "ArrowRight" })
    expect(valueNow()).toBe(20)
  })

  it("Enter restores a size set by dragging", () => {
    render(<Panes effect="snap" />)
    press(500)
    move(300, 1000)
    move(300, 1000)
    clockOffset += 500
    release()
    expect(valueNow()).toBe(30)
    fireEvent.keyDown(handle(), { key: "Enter" })
    expect(valueNow()).toBe(0)
    fireEvent.keyDown(handle(), { key: "Enter" })
    expect(valueNow()).toBe(30)
  })

  it("Enter restores the size from before a flick, not the one the flick passed through", () => {
    render(<Panes effect="snap" />)
    press(500)
    move(460, 16)
    move(420, 16)
    release()
    expect(valueNow()).toBe(0)
    fireEvent.keyDown(handle(), { key: "Enter" })
    expect(valueNow()).toBe(50)
  })

  it("a light pull on a collapsed pane leaves it collapsed", async () => {
    render(<Panes effect="snap" />)
    fireEvent.keyDown(handle(), { key: "Enter" })
    await waitFor(() => expect(painted()).toBeLessThan(0.01), { timeout: 3000 })
    press(0)
    move(50, 1000)
    clockOffset += 500
    release()
    expect(valueNow()).toBe(0)
  })
})

describe("Resizable reduced motion", () => {
  it("clamps hard and lands in one step", async () => {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const { Resizable: Fresh } = await import("./resizable")
    vi.doUnmock("motion/react")
    const onSizeChange = vi.fn()
    render(
      <Fresh variant="hidden" defaultSize={50} min={20} max={80} onSizeChange={onSizeChange}>
        <div>First</div>
        <div>Second</div>
      </Fresh>,
    )
    press()
    move(100, 200)
    await waitFor(() => expect(painted()).toBe(20))
    clockOffset += 200
    release()
    fireEvent.doubleClick(handle())
    await waitFor(() => expect(painted()).toBe(50))
    expect(onSizeChange.mock.calls.filter(([size]) => size === 50)).toHaveLength(1)
  })
})
