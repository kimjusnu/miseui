import { act, fireEvent, render, screen } from "@testing-library/react"
import { Kbd, KbdGroup, Mod, isApplePlatform, keyMatches } from "./kbd"

const key = (text: string) => screen.getByText(text).closest("[data-slot='kbd']") as HTMLElement

describe("keyMatches", () => {
  it("matches case-insensitively, since Shift upper-cases event.key", () => {
    expect(keyMatches("K", "k")).toBe(true)
    expect(keyMatches("k", "j")).toBe(false)
  })

  it("understands what caps usually say", () => {
    expect(keyMatches("Escape", "Esc")).toBe(true)
    expect(keyMatches("Meta", "⌘")).toBe(true)
    expect(keyMatches("Control", "Ctrl")).toBe(true)
    expect(keyMatches("Enter", "↵")).toBe(true)
    expect(keyMatches(" ", "Space")).toBe(true)
    expect(keyMatches("ArrowUp", "↑")).toBe(true)
  })
})

describe("isApplePlatform", () => {
  it("recognises every Apple device name and nothing else", () => {
    expect(["MacIntel", "macOS", "iPhone", "iPad"].every(isApplePlatform)).toBe(true)
    expect(["Win32", "Windows", "Linux x86_64", "Android", ""].some(isApplePlatform)).toBe(false)
  })
})

describe("Kbd designs", () => {
  it("renders a real kbd element", () => {
    render(<Kbd>K</Kbd>)
    expect(key("K").tagName).toBe("KBD")
    expect(key("K")).toHaveAttribute("data-variant", "plain")
  })

  it("gives each variant its own size and surface", () => {
    const { rerender } = render(<Kbd>K</Kbd>)
    expect(key("K")).toHaveClass("h-6", "border")
    rerender(<Kbd variant="raised">K</Kbd>)
    expect(key("K")).toHaveClass("h-8", "border-b-2", "shadow-xs")
    rerender(<Kbd variant="flat">K</Kbd>)
    expect(key("K")).toHaveClass("h-5", "bg-muted")
    expect(key("K")).not.toHaveClass("border")
    rerender(<Kbd variant="ghost">K</Kbd>)
    expect(key("K")).not.toHaveClass("border")
    expect(key("K").className).not.toMatch(/(^|\s)bg-(muted|card|background)/)
  })
})

describe("KbdGroup", () => {
  it("nests the keys inside one kbd and shares the design", () => {
    render(
      <KbdGroup variant="raised" data-testid="group">
        <Kbd>Shift</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    )
    const group = screen.getByTestId("group")
    expect(group.tagName).toBe("KBD")
    expect(group.querySelectorAll("kbd")).toHaveLength(2)
    expect(key("Shift")).toHaveAttribute("data-variant", "raised")
  })

  it("puts the separator only between keys", () => {
    render(
      <KbdGroup separator="then" data-testid="group">
        <Kbd>G</Kbd>
        <Kbd>I</Kbd>
        <Kbd>N</Kbd>
      </KbdGroup>,
    )
    expect(screen.getAllByText("then")).toHaveLength(2)
    expect(screen.getByTestId("group").firstElementChild?.tagName).toBe("KBD")
    expect(screen.getByTestId("group").lastElementChild?.tagName).toBe("KBD")
  })

  it("lets one key override the group", () => {
    render(
      <KbdGroup variant="raised">
        <Kbd variant="ghost">K</Kbd>
      </KbdGroup>,
    )
    expect(key("K")).toHaveAttribute("data-variant", "ghost")
  })
})

describe("Mod", () => {
  it("shows Command on Apple and Control elsewhere, with the full word for screen readers", () => {
    const { rerender } = render(<Mod platform="mac" />)
    expect(screen.getByText("⌘")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText("Command")).toHaveClass("sr-only")
    rerender(<Mod platform="other" />)
    expect(screen.getByText("Ctrl")).toBeInTheDocument()
    expect(screen.getByText("Control")).toHaveClass("sr-only")
  })

  it("detects the platform from the browser", () => {
    const platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel")
    render(<Mod />)
    expect(screen.getByText("⌘")).toBeInTheDocument()
    platform.mockRestore()
  })

  it("press follows the real modifier of that platform", () => {
    render(<Mod platform="other" effect="press" />)
    const cap = key("Ctrl")
    fireEvent.keyDown(window, { key: "Meta" })
    expect(cap).toHaveAttribute("data-pressed", "false")
    fireEvent.keyDown(window, { key: "Control" })
    expect(cap).toHaveAttribute("data-pressed", "true")
  })
})

describe("Kbd press effect", () => {
  it("dips while the real key is held and rises on release", () => {
    render(<Kbd effect="press">K</Kbd>)
    expect(key("K")).toHaveAttribute("data-pressed", "false")
    fireEvent.keyDown(window, { key: "k" })
    expect(key("K")).toHaveAttribute("data-pressed", "true")
    fireEvent.keyDown(window, { key: "j" })
    expect(key("K")).toHaveAttribute("data-pressed", "true")
    fireEvent.keyUp(window, { key: "k" })
    expect(key("K")).toHaveAttribute("data-pressed", "false")
  })

  it("releases when Command lets go, because macOS sends no keyup for the other key", () => {
    render(<Kbd effect="press">K</Kbd>)
    fireEvent.keyDown(window, { key: "k" })
    fireEvent.keyUp(window, { key: "Meta" })
    expect(key("K")).toHaveAttribute("data-pressed", "false")
  })

  it("releases when the window loses focus mid-press", () => {
    render(<Kbd effect="press">K</Kbd>)
    fireEvent.keyDown(window, { key: "k" })
    act(() => {
      window.dispatchEvent(new Event("blur"))
    })
    expect(key("K")).toHaveAttribute("data-pressed", "false")
  })

  it("removes every listener on unmount", () => {
    const add = vi.spyOn(window, "addEventListener")
    const remove = vi.spyOn(window, "removeEventListener")
    const { unmount } = render(<Kbd effect="press">K</Kbd>)
    const added = add.mock.calls.filter(([type]) => ["keydown", "keyup", "blur"].includes(type as string))
    expect(added).toHaveLength(3)
    unmount()
    added.forEach(([type, listener]) => expect(remove).toHaveBeenCalledWith(type, listener))
    add.mockRestore()
    remove.mockRestore()
  })

  it("adds no listener and no pressed state without the effect", () => {
    const add = vi.spyOn(window, "addEventListener")
    render(<Kbd>K</Kbd>)
    expect(add.mock.calls.some(([type]) => type === "keydown")).toBe(false)
    expect(key("K")).not.toHaveAttribute("data-pressed")
    add.mockRestore()
  })

  it("listens for keyName when the cap holds an icon", () => {
    render(
      <Kbd effect="press" keyName="Enter" data-testid="cap">
        <svg />
      </Kbd>,
    )
    fireEvent.keyDown(window, { key: "Enter" })
    expect(screen.getByTestId("cap")).toHaveAttribute("data-pressed", "true")
  })
})
