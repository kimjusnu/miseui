import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { SearchField, type SearchFieldProps, type SearchFieldVariant } from "./search-field"
import { isFocusShortcut } from "./search-field-state"

const field = () => screen.getByRole("searchbox")

describe("isFocusShortcut", () => {
  const press = (key: string, modifiers: Partial<KeyboardEvent> = {}) =>
    isFocusShortcut({ key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...modifiers })

  it("accepts Command or Control with K and nothing else", () => {
    expect(press("k", { metaKey: true })).toBe(true)
    expect(press("K", { ctrlKey: true })).toBe(true)
    expect(press("k")).toBe(false)
    expect(press("j", { metaKey: true })).toBe(false)
    expect(press("k", { metaKey: true, shiftKey: true })).toBe(false)
  })
})

describe("SearchField", () => {
  it("exposes a named search landmark and a search box", () => {
    render(<SearchField aria-label="Search invoices" />)
    expect(screen.getByRole("search")).toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Search invoices" })).toBeInTheDocument()
  })

  it("debounces onSearch until typing stops", () => {
    vi.useFakeTimers()
    try {
      const onSearch = vi.fn()
      render(<SearchField onSearch={onSearch} debounceMs={200} />)
      fireEvent.change(field(), { target: { value: "in" } })
      act(() => vi.advanceTimersByTime(100))
      fireEvent.change(field(), { target: { value: "inv" } })
      act(() => vi.advanceTimersByTime(199))
      expect(onSearch).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(1))
      expect(onSearch).toHaveBeenCalledOnce()
      expect(onSearch).toHaveBeenCalledWith("inv")
    } finally {
      vi.useRealTimers()
    }
  })

  it("searches at once on Enter and does not repeat when the timer would have fired", () => {
    vi.useFakeTimers()
    try {
      const onSearch = vi.fn()
      render(<SearchField onSearch={onSearch} debounceMs={200} />)
      fireEvent.change(field(), { target: { value: "tax" } })
      fireEvent.keyDown(field(), { key: "Enter" })
      expect(onSearch).toHaveBeenCalledWith("tax")
      act(() => vi.advanceTimersByTime(500))
      fireEvent.keyDown(field(), { key: "Enter" })
      expect(onSearch).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it("waits for an input method to finish composing", () => {
    vi.useFakeTimers()
    try {
      const onSearch = vi.fn()
      render(<SearchField onSearch={onSearch} debounceMs={100} />)
      fireEvent.compositionStart(field())
      fireEvent.change(field(), { target: { value: "ㅇ" } })
      act(() => vi.advanceTimersByTime(500))
      expect(onSearch).not.toHaveBeenCalled()
      fireEvent.change(field(), { target: { value: "안" } })
      fireEvent.compositionEnd(field())
      act(() => vi.advanceTimersByTime(100))
      expect(onSearch).toHaveBeenCalledWith("안")
    } finally {
      vi.useRealTimers()
    }
  })

  it("clears with the button, returns focus and reports the empty query at once", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchField defaultValue="tax" onSearch={onSearch} />)
    await user.click(screen.getByRole("button", { name: "Clear search" }))
    expect(field()).toHaveValue("")
    expect(field()).toHaveFocus()
    expect(onSearch).toHaveBeenCalledWith("")
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument()
  })

  it("clears on Escape without letting the press reach a surrounding dialog, then lets it through when empty", () => {
    const outer = vi.fn()
    render(
      <div onKeyDown={outer}>
        <SearchField defaultValue="tax" />
      </div>,
    )
    fireEvent.keyDown(field(), { key: "Escape" })
    expect(field()).toHaveValue("")
    expect(outer).not.toHaveBeenCalled()
    fireEvent.keyDown(field(), { key: "Escape" })
    expect(outer).toHaveBeenCalledOnce()
  })

  it("keeps a surrounding Radix dialog open on the Escape that clears, and closes on the next", () => {
    const onOpenChange = vi.fn()
    render(
      <DialogPrimitive.Root open onOpenChange={onOpenChange}>
        <DialogPrimitive.Content aria-describedby={undefined}>
          <DialogPrimitive.Title>Find</DialogPrimitive.Title>
          <SearchField defaultValue="tax" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Root>,
    )
    field().focus()
    fireEvent.keyDown(field(), { key: "Escape" })
    expect(field()).toHaveValue("")
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.keyDown(field(), { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("works controlled", async () => {
    const user = userEvent.setup()
    function Controlled(props: SearchFieldProps) {
      const [value, setValue] = useState("a")
      return <SearchField {...props} value={value} onValueChange={setValue} />
    }
    render(<Controlled />)
    await user.type(field(), "b")
    expect(field()).toHaveValue("ab")
  })

  it("focuses on Mod K only when the shortcut is on, and shows its hint until there is text", () => {
    const { container, rerender } = render(<SearchField />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(field()).not.toHaveFocus()
    expect(container.querySelector("[data-slot='search-field-hint']")).toBeNull()
    rerender(<SearchField shortcut />)
    expect(container.querySelector("[data-slot='search-field-hint']")).not.toBeNull()
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(field()).toHaveFocus()
    fireEvent.change(field(), { target: { value: "x" } })
    expect(container.querySelector("[data-slot='search-field-hint']")).toBeNull()
  })

  it("announces loading, and the effect swaps the leading icon instead of adding a trailing spinner", () => {
    const { container, rerender } = render(<SearchField loading loadingText="Looking up invoices" />)
    expect(screen.getByRole("status")).toHaveTextContent("Looking up invoices")
    expect(field()).toHaveAttribute("aria-busy", "true")
    expect(container.querySelector("[data-slot='search-field-spinner']")).not.toBeNull()
    expect(container.querySelector("[data-slot='search-field-icon'] [data-slot='spinner']")).toBeNull()
    rerender(<SearchField loading effect="spinner-swap" />)
    expect(container.querySelector("[data-slot='search-field-spinner']")).toBeNull()
    expect(container.querySelector("[data-slot='search-field-icon'] [data-slot='spinner']")).not.toBeNull()
  })

  it("hides clear when disabled and makes the variants differ in structure", () => {
    const shape = (variant: SearchFieldVariant) => {
      const { container, unmount } = render(<SearchField variant={variant} />)
      const root = container.firstElementChild as HTMLElement
      const result = {
        height: root.className.includes("h-12") ? "tall" : "normal",
        rim: root.className.includes("border-input"),
        filled: root.className.includes("bg-muted"),
        underline: root.className.includes("border-b"),
      }
      unmount()
      return result
    }
    expect(shape("plain")).toEqual({ height: "normal", rim: true, filled: false, underline: false })
    expect(shape("pill")).toEqual({ height: "normal", rim: false, filled: true, underline: false })
    expect(shape("ghost")).toEqual({ height: "normal", rim: false, filled: false, underline: true })
    expect(shape("large")).toEqual({ height: "tall", rim: true, filled: false, underline: false })
    render(<SearchField defaultValue="tax" disabled />)
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument()
  })
})
