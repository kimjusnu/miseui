import { useRef, useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ActionBar, ActionBarAction, shouldClearOnEscape, type ActionBarProps, type ActionBarVariant } from "./action-bar"

const VARIANTS: readonly ActionBarVariant[] = ["floating", "docked", "inline", "compact"]

function Selection({ initial = 2, ...props }: { initial?: number } & Partial<ActionBarProps>) {
  const [count, setCount] = useState(initial)
  const returnRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={returnRef} type="button" onClick={() => setCount((value) => value + 1)}>
        Select row
      </button>
      <input aria-label="Search" />
      <ActionBar count={count} onClear={() => setCount(0)} {...props}>
        <ActionBarAction>Archive</ActionBarAction>
        <ActionBarAction tone="destructive" icon={<svg />}>
          Delete
        </ActionBarAction>
      </ActionBar>
    </>
  )
}

const toolbar = () => screen.queryByRole("toolbar", { name: "Selection actions" })

describe("ActionBar visibility", () => {
  it("is absent at zero and appears with the count announced", async () => {
    const user = userEvent.setup()
    render(<Selection initial={0} />)
    expect(toolbar()).toBeNull()
    await user.click(screen.getByRole("button", { name: "Select row" }))
    expect(toolbar()).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("1 selected")
  })

  it("does not take focus when it appears", async () => {
    const user = userEvent.setup()
    render(<Selection initial={0} />)
    const select = screen.getByRole("button", { name: "Select row" })
    await user.click(select)
    expect(select).toHaveFocus()
  })

  it("clears through the button and leaves", async () => {
    const user = userEvent.setup()
    render(<Selection />)
    await user.click(screen.getByRole("button", { name: "Clear selection" }))
    await waitFor(() => expect(toolbar()).toBeNull())
    expect(screen.getByRole("status")).toHaveTextContent("")
  })

  it("uses a custom count label", () => {
    render(<Selection countLabel={(count) => `${count} files`} />)
    expect(screen.getByRole("status")).toHaveTextContent("2 files")
  })
})

describe("ActionBar Escape and focus", () => {
  it("clears on Escape from anywhere on the page", async () => {
    const user = userEvent.setup()
    render(<Selection />)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(toolbar()).toBeNull())
  })

  it("leaves the selection alone when Escape belongs to a field outside the bar", async () => {
    const user = userEvent.setup()
    render(<Selection />)
    await user.click(screen.getByRole("textbox", { name: "Search" }))
    await user.keyboard("{Escape}")
    expect(toolbar()).toBeInTheDocument()
  })

  it("gives focus back to where it came from when the bar closes", async () => {
    const user = userEvent.setup()
    render(<Selection />)
    const select = screen.getByRole("button", { name: "Select row" })
    select.focus()
    await user.tab()
    await user.tab()
    expect(screen.getByRole("button", { name: "Clear selection" })).toHaveFocus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(toolbar()).toBeNull())
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus()
  })

  it("moves between controls with arrow keys, as one tab stop", async () => {
    const user = userEvent.setup()
    render(<Selection />)
    screen.getByRole("textbox", { name: "Search" }).focus()
    await user.tab()
    expect(screen.getByRole("button", { name: "Clear selection" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Archive" })).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })
})

describe("shouldClearOnEscape", () => {
  const input = document.createElement("input")
  const button = document.createElement("button")
  const base = { key: "Escape", defaultPrevented: false, target: button, bar: null, scope: null, activeElement: button }

  it("ignores other keys and an Escape a dialog already used", () => {
    expect(shouldClearOnEscape({ ...base, key: "Enter" })).toBe(false)
    expect(shouldClearOnEscape({ ...base, defaultPrevented: true })).toBe(false)
    expect(shouldClearOnEscape(base)).toBe(true)
  })

  it("ignores a field outside the bar but not one inside", () => {
    expect(shouldClearOnEscape({ ...base, target: input })).toBe(false)
    const bar = document.createElement("div")
    bar.append(input)
    expect(shouldClearOnEscape({ ...base, target: input, bar })).toBe(true)
  })

  it("honours the scope", () => {
    const scope = document.createElement("div")
    expect(shouldClearOnEscape({ ...base, scope })).toBe(false)
    scope.append(button)
    expect(shouldClearOnEscape({ ...base, scope })).toBe(true)
  })
})

describe("ActionBar variants", () => {
  const surfaces: Record<ActionBarVariant, string> = {
    floating: "rounded-xl",
    docked: "border-t",
    inline: "bg-mise-soft",
    compact: "bg-foreground",
  }

  it.each(VARIANTS)("%s has its own surface and order", (variant) => {
    const { container } = render(<Selection variant={variant} />)
    const surface = toolbar()
    expect(surface).toHaveClass(surfaces[variant])
    expect(container.querySelector("[data-slot='action-bar']")).toHaveAttribute("data-variant", variant)
    const first = surface?.firstElementChild?.getAttribute("data-slot")
    expect(first).toBe(variant === "floating" ? "action-bar-clear" : "action-bar-count")
  })

  it("sits on the viewport or in the flow, whichever is asked", () => {
    const { container, rerender } = render(<Selection variant="floating" />)
    const positioner = () => container.querySelector("[data-slot='action-bar-positioner']")
    expect(positioner()).toHaveClass("fixed")
    rerender(<Selection variant="floating" position="inline" />)
    expect(positioner()).not.toHaveClass("fixed")
    expect(container.querySelector("[data-slot='action-bar']")).toHaveAttribute("data-position", "inline")
  })

  it("keeps the action name when compact shows only a glyph", () => {
    render(<Selection variant="compact" />)
    expect(screen.getByRole("button", { name: "Delete" }).querySelector(".sr-only")).toHaveTextContent("Delete")
    expect(screen.getByRole("button", { name: "Archive" }).querySelector(".sr-only")).toBeNull()
  })

  it("keeps the last count on the way out, with the spring", async () => {
    const user = userEvent.setup()
    const { container } = render(<Selection effect="spring" />)
    expect(container.querySelector("[data-slot='action-bar']")).toHaveAttribute("data-effect", "spring")
    await user.click(screen.getByRole("button", { name: "Clear selection" }))
    const count = container.querySelector("[data-slot='action-bar-count']")
    if (count) expect(count).toHaveTextContent("2 selected")
    await waitFor(() => expect(toolbar()).toBeNull())
  })
})
