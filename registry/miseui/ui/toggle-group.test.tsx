import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupVariant } from "./toggle-group"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
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
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly ToggleGroupVariant[] = ["plain", "outline", "pill", "icon"]
const HIGHLIGHT = "[data-slot='toggle-group-highlight']"

function Group(props: ToggleGroupProps) {
  return (
    <ToggleGroup aria-label="Formatting" {...props}>
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="strike" disabled>
        Strike
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

describe("ToggleGroup", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("single keeps one on, and lets it be turned off again", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Group variant={variant} defaultValue="bold" onValueChange={onValueChange} />)
      const bold = screen.getByRole("radio", { name: "Bold" })
      const italic = screen.getByRole("radio", { name: "Italic" })
      expect(bold).toBeChecked()
      await user.click(italic)
      expect(italic).toBeChecked()
      expect(bold).not.toBeChecked()
      expect(onValueChange).toHaveBeenLastCalledWith("italic")
      await user.click(italic)
      expect(italic).not.toBeChecked()
      expect(onValueChange).toHaveBeenLastCalledWith("")
    })

    it("multiple keeps several on as pressed buttons", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Group type="multiple" variant={variant} defaultValue={["bold"]} onValueChange={onValueChange} />)
      await user.click(screen.getByRole("button", { name: "Italic" }))
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true")
      expect(onValueChange).toHaveBeenLastCalledWith(["bold", "italic"])
    })

    it("moves focus with the arrow keys and skips the disabled item", async () => {
      const user = userEvent.setup()
      render(<Group type="multiple" variant={variant} />)
      await user.tab()
      expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus()
      await user.keyboard("{ArrowRight}")
      await waitFor(() => expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus())
      await user.keyboard("{ArrowRight}")
      await waitFor(() => expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus())
    })

    it("draws a highlight only on what is on", async () => {
      const user = userEvent.setup()
      const { container } = render(<Group variant={variant} defaultValue="bold" />)
      expect(container.querySelectorAll(HIGHLIGHT)).toHaveLength(1)
      expect(screen.getByRole("radio", { name: "Bold" }).querySelector(HIGHLIGHT)).not.toBeNull()
      await user.click(screen.getByRole("radio", { name: "Italic" }))
      expect(screen.getByRole("radio", { name: "Italic" }).querySelector(HIGHLIGHT)).not.toBeNull()
    })
  })

  it("has a different look per variant", () => {
    const roots = VARIANTS.map((variant) => {
      const { container, unmount } = render(<Group variant={variant} defaultValue="bold" />)
      const result = {
        root: (container.querySelector("[data-slot='toggle-group']") as HTMLElement).className,
        highlight: (container.querySelector(HIGHLIGHT) as HTMLElement).className,
        item: screen.getByRole("radio", { name: "Bold" }).className,
      }
      unmount()
      return result
    })
    expect(new Set(roots.map((entry) => entry.root)).size).toBe(VARIANTS.length)
    expect(roots[0].highlight).toContain("bg-accent")
    expect(roots[1].root).toContain("divide-x")
    expect(roots[2].item).toContain("rounded-full")
    expect(roots[3].highlight).toContain("bg-mise")
  })

  it("does not switch on a disabled item", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onValueChange = vi.fn()
    render(<Group onValueChange={onValueChange} />)
    expect(screen.getByRole("radio", { name: "Strike" })).toBeDisabled()
    await user.click(screen.getByRole("radio", { name: "Strike" }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("follows a controlled value", () => {
    const { rerender } = render(<Group value="bold" />)
    expect(screen.getByRole("radio", { name: "Bold" })).toBeChecked()
    rerender(<Group value="italic" />)
    expect(screen.getByRole("radio", { name: "Italic" })).toBeChecked()
  })

  it.each(["single", "multiple"] as const)("spring still ends with the highlight on the right item in %s", async (type) => {
    const user = userEvent.setup()
    const role = type === "single" ? "radio" : "button"
    const { container } = render(<Group type={type} effect="spring" />)
    expect(container.querySelector("[data-slot='toggle-group']")).toHaveAttribute("data-effect", "spring")
    await user.click(screen.getByRole(role, { name: "Bold" }))
    expect(screen.getByRole(role, { name: "Bold" }).querySelector(HIGHLIGHT)).not.toBeNull()
  })

  it("draws a plain highlight when motion is reduced", async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<Group effect="spring" />)
    await user.click(screen.getByRole("radio", { name: "Bold" }))
    await user.click(screen.getByRole("radio", { name: "Italic" }))
    expect(screen.getByRole("radio", { name: "Bold" }).querySelector(HIGHLIGHT)).toBeNull()
    expect(screen.getByRole("radio", { name: "Italic" }).querySelector(HIGHLIGHT)).not.toBeNull()
  })
})
