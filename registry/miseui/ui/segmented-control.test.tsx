import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps, type SegmentedControlVariant } from "./segmented-control"

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

const VARIANTS: readonly SegmentedControlVariant[] = ["plain", "pill", "underline", "icon"]
const THUMB = "[data-slot='segmented-control-thumb']"
const radio = (name: string) => screen.getByRole("radio", { name })

function Views(props: SegmentedControlProps) {
  return (
    <SegmentedControl aria-label="View" defaultValue="week" {...props}>
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="year" disabled>
        Year
      </SegmentedControlItem>
    </SegmentedControl>
  )
}

describe("SegmentedControl", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("is a named radio group and picks an option on click", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Views variant={variant} onValueChange={onValueChange} />)
      expect(screen.getByRole("radiogroup", { name: "View" })).toHaveAttribute("data-variant", variant)
      await user.click(radio("Day"))
      expect(radio("Day")).toBeChecked()
      expect(radio("Week")).not.toBeChecked()
      expect(onValueChange).toHaveBeenCalledWith("day")
    })

    it("moves with the arrow keys and skips the disabled option", async () => {
      const user = userEvent.setup()
      render(<Views variant={variant} />)
      await user.click(radio("Week"))
      await user.keyboard("{ArrowLeft>}")
      await waitFor(() => expect(radio("Day")).toHaveFocus())
      await user.keyboard("{/ArrowLeft}")
      expect(radio("Day")).toBeChecked()
      await user.keyboard("{ArrowRight>}")
      await waitFor(() => expect(radio("Week")).toHaveFocus())
      await user.keyboard("{/ArrowRight}")
      expect(radio("Year")).not.toBeChecked()
    })

    it("keeps the one thumb inside the chosen option, so resizing cannot leave it behind", async () => {
      const user = userEvent.setup()
      const { container } = render(<Views variant={variant} effect="spring" />)
      expect(container.querySelectorAll(THUMB)).toHaveLength(1)
      expect(radio("Week").querySelector(THUMB)).not.toBeNull()
      await user.click(radio("Day"))
      expect(container.querySelectorAll(THUMB)).toHaveLength(1)
      expect(radio("Day").querySelector(THUMB)).not.toBeNull()
    })
  })

  it("draws a different thumb and track per variant", () => {
    const classes = VARIANTS.map((variant) => {
      const { container, unmount } = render(<Views variant={variant} />)
      const result = {
        root: screen.getByRole("radiogroup").className,
        thumb: (container.querySelector(THUMB) as HTMLElement).className,
      }
      unmount()
      return result
    })
    expect(new Set(classes.map((entry) => entry.root)).size).toBe(VARIANTS.length)
    expect(classes[0].root).toContain("bg-muted")
    expect(classes[1].thumb).toContain("bg-primary")
    expect(classes[2].thumb).toContain("h-0.5")
    expect(classes[3].thumb).toContain("bg-mise")
  })

  it("does not select a disabled option", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<Views />)
    expect(radio("Year")).toBeDisabled()
    await user.click(radio("Year"))
    expect(radio("Week")).toBeChecked()
  })

  it("follows a controlled value", () => {
    const { rerender } = render(<Views value="day" />)
    expect(radio("Day")).toBeChecked()
    rerender(<Views value="week" />)
    expect(radio("Week")).toBeChecked()
    expect(radio("Week").querySelector(THUMB)).not.toBeNull()
  })

  it("gives up the shared layout animation when motion is reduced", async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<Views effect="spring" />)
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-effect", "spring")
    await user.click(radio("Day"))
    expect(radio("Day").querySelector(THUMB)).not.toBeNull()
  })
})
