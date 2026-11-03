import { useRef } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FloatingNav, type FloatingNavProps } from "./floating-nav"
import { nextScrollStep, TOP_ZONE_PX } from "./floating-nav-state"

const ITEMS = [
  { value: "home", label: "Home", href: "#home", icon: <svg /> },
  { value: "notes", label: "Notes", href: "#notes", icon: <svg /> },
  { value: "about", label: "About", icon: <svg /> },
]

function Page(props: Partial<FloatingNavProps>) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  return (
    <div>
      <div ref={scrollerRef} data-testid="scroller">
        <FloatingNav label="Main" items={ITEMS} position="sticky" scrollContainer={scrollerRef} {...props} />
      </div>
      <button type="button">Outside</button>
    </div>
  )
}

function scrollTo(y: number) {
  const scroller = screen.getByTestId("scroller")
  Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: 2000 })
  Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 300 })
  Object.defineProperty(scroller, "scrollTop", { configurable: true, value: y })
  act(() => {
    fireEvent.scroll(scroller)
  })
}

const nav = () => screen.getByRole("navigation", { name: "Main" })
const link = (name: string) => screen.getByRole("link", { name })

describe("nextScrollStep", () => {
  it("hides going down and returns going up", () => {
    const down = nextScrollStep({ hidden: false, lastY: 200 }, 260, 1000)
    expect(down).toEqual({ hidden: true, lastY: 260 })
    expect(nextScrollStep(down, 240, 1000)).toEqual({ hidden: false, lastY: 240 })
  })

  it("always shows near the top", () => {
    expect(nextScrollStep({ hidden: true, lastY: 300 }, TOP_ZONE_PX, 1000).hidden).toBe(false)
    expect(nextScrollStep({ hidden: true, lastY: 300 }, -40, 1000).hidden).toBe(false)
  })

  it("ignores a trembling finger", () => {
    const step = { hidden: true, lastY: 300 }
    expect(nextScrollStep(step, 296, 1000)).toBe(step)
  })

  it("does not read rubber-banding past the end as a turn upward", () => {
    const overshoot = nextScrollStep({ hidden: true, lastY: 1000 }, 1060, 1000)
    expect(nextScrollStep(overshoot, 1020, 1000)).toEqual({ hidden: true, lastY: 1000 })
  })
})

describe("FloatingNav", () => {
  it("is a named landmark that marks the current item", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Page onValueChange={onValueChange} />)
    expect(nav()).toBeInTheDocument()
    expect(link("Home")).toHaveAttribute("aria-current", "page")
    await user.click(link("Notes"))
    expect(onValueChange).toHaveBeenCalledWith("notes")
    expect(link("Notes")).toHaveAttribute("aria-current", "page")
    expect(link("Home")).not.toHaveAttribute("aria-current")
  })

  it("renders a button when an item has no link", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.click(screen.getByRole("button", { name: "About" }))
    expect(screen.getByRole("button", { name: "About" })).toHaveAttribute("aria-current", "page")
  })

  it("lets the page keep the empty sides of the row", () => {
    render(<Page />)
    expect(nav()).toHaveClass("pointer-events-none")
    expect(document.querySelector("[data-slot='floating-nav-pill']")).toHaveClass("pointer-events-auto")
  })

  it("a compact bar and a closed island leave their empty slot to the page too", () => {
    const { rerender } = render(<Page variant="bar" />)
    expect(document.querySelector("[data-slot='floating-nav-bar-slot']")).not.toHaveClass("pointer-events-auto")
    expect(document.querySelector("[data-slot='floating-nav-bar']")).toHaveClass("pointer-events-auto")
    rerender(<Page variant="island" />)
    expect(document.querySelector("[data-slot='floating-nav-island-slot']")).not.toHaveClass("pointer-events-auto")
    expect(document.querySelector("[data-slot='floating-nav-island']")).toHaveClass("pointer-events-auto")
  })

  it("differs in structure between variants", () => {
    const { rerender } = render(<Page variant="pill" />)
    expect(document.querySelector("[data-slot='floating-nav-highlight']")).toBeInTheDocument()
    rerender(<Page variant="tabs" />)
    expect(document.querySelector("[data-slot='floating-nav-tabs'] ul")).toHaveStyle({ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" })
    expect(nav()).toHaveClass("bottom-0")
    rerender(<Page variant="bar" />)
    expect(document.querySelector("[data-slot='floating-nav-bar']")).toBeInTheDocument()
    expect(document.querySelector("[data-slot='floating-nav-bar-slot']")).toHaveClass("h-14")
    rerender(<Page variant="island" />)
    expect(screen.queryByRole("link", { name: "Home" })).toBeNull()
  })

  describe("position", () => {
    it.each([
      ["fixed", "fixed"],
      ["sticky", "sticky"],
      ["absolute", "absolute"],
    ] as const)("%s", (position, name) => {
      render(<Page position={position} />)
      expect(nav()).toHaveClass(name)
    })
  })

  describe("hide effect", () => {
    it("leaves on scroll down and returns on scroll up", () => {
      render(<Page effect="hide" />)
      scrollTo(300)
      scrollTo(400)
      expect(nav()).toHaveAttribute("data-hidden", "true")
      scrollTo(340)
      expect(nav()).toHaveAttribute("data-hidden", "false")
    })

    it("is always back near the top", () => {
      render(<Page effect="hide" />)
      scrollTo(300)
      scrollTo(400)
      scrollTo(10)
      expect(nav()).toHaveAttribute("data-hidden", "false")
    })

    it("does not catch clicks while away and comes back when focus lands inside", async () => {
      const user = userEvent.setup()
      render(<Page effect="hide" />)
      scrollTo(300)
      scrollTo(400)
      expect(document.querySelector("[data-slot='floating-nav-mover']")).toHaveClass("**:pointer-events-none!")
      await user.tab()
      expect(link("Home")).toHaveFocus()
      expect(nav()).toHaveAttribute("data-hidden", "false")
      await user.tab()
      await user.tab()
      await user.tab()
      expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus()
      expect(nav()).toHaveAttribute("data-hidden", "true")
    })

    it("keeps its place in the page while away, so nothing shifts", () => {
      render(<Page effect="hide" />)
      const box = nav()
      scrollTo(300)
      scrollTo(400)
      expect(box).toBeVisible()
      expect(box).toHaveClass("sticky")
      expect(document.querySelector("[data-slot='floating-nav-mover']")?.parentElement).toBe(box)
    })

    it("listens on the window by default and cleans up", () => {
      const add = vi.spyOn(window, "addEventListener")
      const remove = vi.spyOn(window, "removeEventListener")
      const { unmount } = render(<FloatingNav label="Main" items={ITEMS} effect="hide" />)
      expect(add.mock.calls.some(([type]) => type === "scroll")).toBe(true)
      unmount()
      expect(remove.mock.calls.some(([type]) => type === "scroll")).toBe(true)
      add.mockRestore()
      remove.mockRestore()
    })

    it("does not listen when nothing depends on scrolling", () => {
      const add = vi.spyOn(window, "addEventListener")
      render(<FloatingNav label="Main" items={ITEMS} />)
      expect(add.mock.calls.some(([type]) => type === "scroll")).toBe(false)
      add.mockRestore()
    })
  })

  describe("bar", () => {
    it("shrinks into a pill after scrolling and back at the top, in a slot that keeps its height", () => {
      render(<Page variant="bar" />)
      const bar = () => document.querySelector("[data-slot='floating-nav-bar']")
      expect(bar()).toHaveAttribute("data-compact", "false")
      scrollTo(100)
      expect(bar()).toHaveAttribute("data-compact", "true")
      expect(document.querySelector("[data-slot='floating-nav-bar-slot']")).toHaveClass("h-14")
      scrollTo(0)
      expect(bar()).toHaveAttribute("data-compact", "false")
    })
  })

  describe("island", () => {
    const trigger = () => screen.getByRole("button", { name: "Main menu, Home" })

    it("opens on press, moves focus in, and Escape closes and returns focus", async () => {
      const user = userEvent.setup()
      render(<Page variant="island" />)
      expect(trigger()).toHaveAttribute("aria-expanded", "false")
      await user.click(trigger())
      expect(trigger()).toHaveAttribute("aria-expanded", "true")
      await waitFor(() => expect(link("Home")).toHaveFocus())
      await user.keyboard("{Escape}")
      expect(screen.queryByRole("link", { name: "Home" })).toBeNull()
      expect(trigger()).toHaveFocus()
    })

    it("closes after a choice and shows the new place in the capsule", async () => {
      const user = userEvent.setup()
      render(<Page variant="island" />)
      await user.click(trigger())
      await user.click(link("Notes"))
      expect(screen.getByRole("button", { name: "Main menu, Notes" })).toHaveFocus()
      expect(screen.queryByRole("link", { name: "Notes" })).toBeNull()
    })

    it("closes on a press outside and when focus leaves", async () => {
      const user = userEvent.setup()
      render(<Page variant="island" />)
      await user.click(trigger())
      await user.click(screen.getByRole("button", { name: "Outside" }))
      expect(trigger()).toHaveAttribute("aria-expanded", "false")
      await user.click(trigger())
      await user.tab()
      await user.tab()
      await user.tab()
      expect(trigger()).toHaveAttribute("aria-expanded", "false")
    })

    it("holds only the capsule height in the flow, so opening moves nothing around it", () => {
      render(<Page variant="island" />)
      expect(document.querySelector("[data-slot='floating-nav-island-slot']")).toHaveClass("h-11")
    })
  })
})
