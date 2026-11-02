import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { Toggle, type ToggleVariant } from "./toggle"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly ToggleVariant[] = ["plain", "outline", "pill", "icon"]
const toggle = (name: string) => screen.getByRole("button", { name })

describe("Toggle", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("marks the root and flips aria-pressed on click", async () => {
      const user = userEvent.setup()
      const onPressedChange = vi.fn()
      render(
        <Toggle variant={variant} aria-label="Bold" onPressedChange={onPressedChange}>
          B
        </Toggle>,
      )
      expect(toggle("Bold")).toHaveAttribute("data-slot", "toggle")
      expect(toggle("Bold")).toHaveAttribute("data-variant", variant)
      expect(toggle("Bold")).toHaveAttribute("aria-pressed", "false")
      await user.click(toggle("Bold"))
      expect(toggle("Bold")).toHaveAttribute("aria-pressed", "true")
      expect(toggle("Bold")).toHaveAttribute("data-state", "on")
      expect(onPressedChange).toHaveBeenLastCalledWith(true)
    })

    it("responds to Space and Enter from the keyboard", async () => {
      const user = userEvent.setup()
      render(
        <Toggle variant={variant} aria-label="Bold">
          B
        </Toggle>,
      )
      await user.tab()
      expect(toggle("Bold")).toHaveFocus()
      await user.keyboard(" ")
      expect(toggle("Bold")).toHaveAttribute("aria-pressed", "true")
      await user.keyboard("{Enter}")
      expect(toggle("Bold")).toHaveAttribute("aria-pressed", "false")
    })

    it("ignores clicks when disabled", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      const onPressedChange = vi.fn()
      render(
        <Toggle variant={variant} aria-label="Bold" disabled onPressedChange={onPressedChange}>
          B
        </Toggle>,
      )
      await user.click(toggle("Bold"))
      expect(onPressedChange).not.toHaveBeenCalled()
      expect(toggle("Bold")).toBeDisabled()
    })
  })

  it("only pill carries a check, and it is decoration for assistive tech", () => {
    const { container, rerender } = render(<Toggle variant="pill">Remote</Toggle>)
    const check = container.querySelector("[data-slot='toggle-check']")
    expect(check).toHaveAttribute("aria-hidden", "true")
    rerender(<Toggle variant="outline">Remote</Toggle>)
    expect(container.querySelector("[data-slot='toggle-check']")).toBeNull()
  })

  it("icon is square, while the text variants size by their padding", () => {
    const { rerender } = render(
      <Toggle variant="icon" aria-label="Star">
        S
      </Toggle>,
    )
    expect(toggle("Star")).toHaveClass("size-9")
    expect(toggle("Star")).not.toHaveClass("px-3")
    rerender(
      <Toggle variant="plain" aria-label="Star">
        S
      </Toggle>,
    )
    expect(toggle("Star")).toHaveClass("px-3")
    expect(toggle("Star")).not.toHaveClass("size-9")
  })

  it("follows a controlled value, not the click", async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(
      <Toggle pressed={false} onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    )
    await user.click(toggle("Bold"))
    expect(onPressedChange).toHaveBeenCalledWith(true)
    expect(toggle("Bold")).toHaveAttribute("aria-pressed", "false")
  })

  it("wraps the content for pop only when asked and motion is allowed", () => {
    const { container, rerender, unmount } = render(<Toggle>Bold</Toggle>)
    expect(container.querySelector("[data-slot='toggle-pop']")).toBeNull()
    rerender(<Toggle effect="pop">Bold</Toggle>)
    expect(toggle("Bold")).toHaveAttribute("data-effect", "pop")
    expect(container.querySelector("[data-slot='toggle-pop']")).not.toBeNull()
    unmount()
    setReducedMotion(true)
    const reduced = render(<Toggle effect="pop">Bold</Toggle>)
    expect(reduced.container.querySelector("[data-slot='toggle-pop']")).toBeNull()
  })
})
