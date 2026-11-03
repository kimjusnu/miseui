import { renderToString } from "react-dom/server"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Dock, DockItem, type DockProps } from "./dock"
import { dockFalloff, dockHasRoom, dockLayout, dockMaxSpread } from "./dock-math"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

const SLOTS = [0, 1, 2, 3, 4].map((index) => ({ centre: 20 + index * 44, size: 40 }))

function stubFinePointer(fine: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: fine, media: query, addEventListener() {}, removeEventListener() {} }))
}

/** Slots at rest in a row starting at x=100, as the browser would lay them out. */
function stubLayout() {
  const original = Element.prototype.getBoundingClientRect
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (this.getAttribute("data-slot") === "dock-slot") {
      const index = [...(this.parentElement?.children ?? [])].indexOf(this)
      const left = 100 + index * 44
      return { left, right: left + 40, width: 40, height: 40, top: 200, bottom: 240, x: left, y: 200, toJSON() {} }
    }
    if (this.getAttribute("data-slot") === "dock-frame") {
      return { left: 100, right: 316, width: 216, height: 56, top: 184, bottom: 240, x: 100, y: 184, toJSON() {} }
    }
    return original.call(this)
  })
}

function Apps(props: Partial<DockProps> & { onOpen?: () => void }) {
  const { onOpen, ...rest } = props
  return (
    <Dock label="Apps" {...rest}>
      <DockItem label="Home" active>
        <svg />
      </DockItem>
      <DockItem label="Inbox" opens onClick={onOpen}>
        <svg />
      </DockItem>
      <DockItem label="Files" href="#files">
        <svg />
      </DockItem>
    </Dock>
  )
}

const tile = (name: string) => screen.getByRole("link", { name }) ?? screen.getByRole("button", { name })
const button = (name: string) => screen.getByRole("button", { name })
const scaleOf = (element: HTMLElement) => Number(/scale\(([\d.]+)\)/.exec(element.style.transform)?.[1] ?? 1)

beforeEach(() => {
  state.reduced = false
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("dock maths", () => {
  it("falls off smoothly to nothing at the reach", () => {
    expect(dockFalloff(0, 96)).toBe(1)
    expect(dockFalloff(48, 96)).toBeCloseTo(0.5)
    expect(dockFalloff(-48, 96)).toBeCloseTo(0.5)
    expect(dockFalloff(96, 96)).toBe(0)
    expect(dockFalloff(10, 0)).toBe(0)
  })

  it("never lets neighbours overlap at full swell", () => {
    const pointer = SLOTS[2]?.centre as number
    const { scales, shifts } = dockLayout(SLOTS, pointer, 1)
    SLOTS.slice(1).forEach((slot, index) => {
      const previous = SLOTS[index] as (typeof SLOTS)[number]
      const leftEdge = slot.centre + (shifts[index + 1] as number) - (slot.size * (scales[index + 1] as number)) / 2
      const rightEdge = previous.centre + (shifts[index] as number) + (previous.size * (scales[index] as number)) / 2
      expect(leftEdge).toBeGreaterThanOrEqual(rightEdge)
    })
  })

  it("is symmetric, so the bar grows evenly from its centre", () => {
    const { shifts, spread } = dockLayout(SLOTS, SLOTS[2]?.centre as number, 1)
    expect(shifts[2]).toBeCloseTo(0)
    expect(shifts[0]).toBeCloseTo(-(shifts[4] as number))
    expect(spread).toBeCloseTo(dockMaxSpread(SLOTS))
  })

  it("does nothing with no presence", () => {
    const { scales, shifts, spread } = dockLayout(SLOTS, 40, 0)
    expect(scales.every((scale) => scale === 1)).toBe(true)
    expect(shifts.every((shift) => shift === 0)).toBe(true)
    expect(spread).toBe(0)
  })

  it("refuses to grow past the window", () => {
    expect(dockHasRoom(40, 300, 400, 34)).toBe(true)
    expect(dockHasRoom(4, 300, 400, 34)).toBe(false)
    expect(dockHasRoom(40, 390, 400, 34)).toBe(false)
  })
})

describe("Dock", () => {
  it("asks nothing about the pointer during a server render, so it hydrates", () => {
    const media = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    vi.stubGlobal("matchMedia", media)
    expect(renderToString(<Apps effect="magnify" />)).toContain("dock-slot")
    expect(media).not.toHaveBeenCalled()
  })

  it("is a nav landmark with one tab stop that roves with the arrow keys", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<Apps />)
    expect(screen.getByRole("navigation", { name: "Apps" })).toBeInTheDocument()
    await user.tab()
    expect(button("Home")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(button("Inbox")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(tile("Files")).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  it("vertical roves with up and down", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<Apps variant="vertical" />)
    await user.tab()
    await user.keyboard("{ArrowDown}")
    expect(button("Inbox")).toHaveFocus()
    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-orientation", "vertical")
  })

  it("marks the current item for assistive tech and on screen", () => {
    render(<Apps />)
    expect(button("Home")).toHaveAttribute("aria-current", "page")
    expect(button("Inbox")).not.toHaveAttribute("aria-current")
    expect(button("Home").querySelector("[data-slot='dock-mark']")).toBeInTheDocument()
  })

  it("shows the name as a tooltip on focus", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<Apps />)
    await user.tab()
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Home"))
  })

  it("differs in structure between variants", () => {
    const { rerender } = render(<Apps variant="labeled" />)
    expect(document.querySelectorAll("[data-slot='dock-label']")).toHaveLength(3)
    expect(button("Inbox")).toHaveTextContent("Inbox")
    rerender(<Apps variant="plain" />)
    expect(document.querySelector("[data-slot='dock-label']")).toBeNull()
    expect(document.querySelector("[data-slot='dock-surface']")).toHaveClass("hidden")
    expect(document.querySelector("[data-slot='dock-mark']")).toBeNull()
    expect(button("Home")).toHaveClass("bg-mise")
    rerender(<Apps variant="glass" />)
    expect(document.querySelector("[data-slot='dock-surface']")).toHaveClass("backdrop-blur-xl")
  })

  it("magnifies near the pointer, more under it than beside it, and clears at rest", async () => {
    stubFinePointer(true)
    stubLayout()
    render(<Apps effect="magnify" />)
    const frame = document.querySelector("[data-slot='dock-frame']") as HTMLElement
    fireEvent.pointerMove(frame, { clientX: 120, clientY: 220, pointerType: "mouse" })
    await waitFor(() => expect(scaleOf(button("Home"))).toBeGreaterThan(1.1))
    expect(scaleOf(button("Home"))).toBeGreaterThan(scaleOf(button("Inbox")))
    fireEvent.pointerLeave(frame)
    await waitFor(() => expect(button("Home").style.transform).toBe(""), { timeout: 3000 })
  })

  it("keyboard focus magnifies too", async () => {
    stubFinePointer(true)
    stubLayout()
    // jsdom says false for a focus moved by script after a key press. A browser says true.
    const matches = Element.prototype.matches
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
      return selector === ":focus-visible" ? true : matches.call(this, selector)
    })
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<Apps effect="magnify" />)
    await user.tab()
    await waitFor(() => expect(scaleOf(button("Home"))).toBeGreaterThan(1.1))
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(scaleOf(button("Inbox"))).toBeGreaterThan(scaleOf(button("Home"))))
    await user.tab()
    await waitFor(() => expect(button("Home").style.transform).toBe(""), { timeout: 3000 })
  })

  it("does not magnify on touch, under reduced motion or for a coarse pointer", async () => {
    stubLayout()
    stubFinePointer(false)
    const { unmount } = render(<Apps effect="magnify" />)
    const frame = () => document.querySelector("[data-slot='dock-frame']") as HTMLElement
    fireEvent.pointerMove(frame(), { clientX: 120, clientY: 220, pointerType: "mouse" })
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(button("Home").style.transform).toBe("")
    unmount()
    state.reduced = true
    stubFinePointer(true)
    render(<Apps effect="magnify" />)
    fireEvent.pointerMove(frame(), { clientX: 120, clientY: 220, pointerType: "mouse" })
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(button("Home").style.transform).toBe("")
  })

  it("never magnifies a row that has to scroll, because the scroller would clip it", async () => {
    stubFinePointer(true)
    stubLayout()
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(60)
    render(<Apps effect="magnify" />)
    const root = screen.getByRole("navigation")
    expect(root).toHaveAttribute("data-fits", "false")
    expect(screen.getByRole("toolbar")).toHaveClass("overflow-x-auto")
    fireEvent.pointerMove(document.querySelector("[data-slot='dock-frame']") as HTMLElement, { clientX: 120, clientY: 220, pointerType: "mouse" })
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(button("Home").style.transform).toBe("")
  })

  it("is not a scroller when it fits, so a magnified tile is never clipped", () => {
    stubLayout()
    render(<Apps effect="magnify" />)
    expect(screen.getByRole("toolbar")).not.toHaveClass("overflow-x-auto")
  })

  it("bounce hops only an item that opens something, and still calls the click", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const animate = vi.fn()
    Element.prototype.animate = animate
    Element.prototype.getAnimations = () => []
    const onOpen = vi.fn()
    render(<Apps effect="bounce" onOpen={onOpen} />)
    await user.click(button("Home"))
    expect(animate).not.toHaveBeenCalled()
    await user.click(button("Inbox"))
    expect(onOpen).toHaveBeenCalledOnce()
    expect(animate).toHaveBeenCalledOnce()
  })

  it("bounce stays still under reduced motion", async () => {
    state.reduced = true
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const animate = vi.fn()
    Element.prototype.animate = animate
    render(<Apps effect="bounce" />)
    await user.click(button("Inbox"))
    expect(animate).not.toHaveBeenCalled()
  })

  it("reserves what a magnified tile rises into, on the correct side", () => {
    const { rerender } = render(<Apps effect="magnify" />)
    const frame = () => document.querySelector("[data-slot='dock-frame']")
    expect(frame()).toHaveClass("pt-4")
    rerender(<Apps effect="magnify" variant="vertical" />)
    expect(frame()).toHaveClass("pr-4")
    rerender(<Apps />)
    expect(frame()).not.toHaveClass("pt-4")
  })
})
