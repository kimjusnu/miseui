import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Slider, type SliderProps, type SliderVariant } from "./slider"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

const TRACK_WIDTH = 200

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.hasPointerCapture = vi.fn(() => true)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  // jsdom lays nothing out; Radix turns a pointer position into a value through this rect.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: TRACK_WIDTH,
    bottom: 20,
    width: TRACK_WIDTH,
    height: 20,
    toJSON: () => ({}),
  })
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly SliderVariant[] = ["plain", "filled", "stepped", "label"]
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement

const renderSlider = (props: SliderProps = {}) => render(<Slider aria-label="Volume" defaultValue={[40]} {...props} />)

describe("Slider", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("exposes a named slider with its value and marks the variant", () => {
      renderSlider({ variant })
      const thumb = screen.getByRole("slider", { name: "Volume" })
      expect(thumb).toHaveAttribute("aria-valuenow", "40")
      expect(slot("slider")).toHaveAttribute("data-variant", variant)
    })

    it("moves with the arrow keys and reports the change", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      renderSlider({ variant, step: 10, onValueChange })
      screen.getByRole("slider").focus()
      await user.keyboard("{ArrowRight}")
      expect(onValueChange).toHaveBeenCalledWith([50])
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50")
    })

    it("renders two thumbs for a range, named apart", () => {
      renderSlider({ variant, defaultValue: [20, 70], "aria-label": "Price" })
      const thumbs = screen.getAllByRole("slider")
      expect(thumbs).toHaveLength(2)
      expect(thumbs[0]).toHaveAccessibleName("Price, minimum")
      expect(thumbs[1]).toHaveAccessibleName("Price, maximum")
    })
  })

  it("plain has a thin track, no marks and no bubble", () => {
    renderSlider({ variant: "plain" })
    expect(slot("slider-track")).toHaveClass("h-1")
    expect(slot("slider-marks")).toBeNull()
    expect(slot("slider-bubble")).toBeNull()
  })

  it("filled has a thick track and keeps the thumb inside the fill", () => {
    renderSlider({ variant: "filled" })
    expect(slot("slider-track")).toHaveClass("h-8")
    expect(slot("slider-thumb").querySelector("[data-slot='slider-grip']")).not.toBeNull()
    // The fill ends at the thumb's far edge, 12 px past its centre, so the grip never sits on the bare track.
    expect(slot("slider-fill").style.width).toContain("calc(40%")
  })

  it("stepped draws a tick per step with labels, and lights the current one", () => {
    renderSlider({ variant: "stepped", min: 0, max: 4, step: 1, defaultValue: [2] })
    expect(document.querySelectorAll("[data-slot='slider-tick']")).toHaveLength(5)
    expect(screen.getByText("2")).toHaveAttribute("data-current", "true")
    expect(screen.getByText("0")).toHaveAttribute("data-current", "false")
  })

  it("stepped takes named marks and thins ticks when steps are too many to draw", () => {
    const { unmount } = renderSlider({
      variant: "stepped",
      marks: [
        { value: 0, label: "Off" },
        { value: 100, label: "Max" },
      ],
    })
    expect(screen.getByText("Off")).toBeInTheDocument()
    expect(document.querySelectorAll("[data-slot='slider-tick']")).toHaveLength(2)
    unmount()
    renderSlider({ variant: "stepped", min: 0, max: 100, step: 1, defaultValue: [50] })
    expect(document.querySelectorAll("[data-slot='slider-tick']")).toHaveLength(11)
  })

  it("label shows the formatted value in a bubble that follows the keyboard", async () => {
    const user = userEvent.setup()
    renderSlider({ variant: "label", step: 5, formatValue: (value) => `${value} dB` })
    expect(slot("slider-bubble")).toHaveTextContent("40 dB")
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "40 dB")
    screen.getByRole("slider").focus()
    await user.keyboard("{ArrowLeft}")
    expect(slot("slider-bubble")).toHaveTextContent("35 dB")
  })

  it("jumps to a pointer press on the track", () => {
    const onValueChange = vi.fn()
    renderSlider({ onValueChange, step: 1 })
    fireEvent.pointerDown(slot("slider-track"), { clientX: 100, pointerId: 1 })
    expect(onValueChange).toHaveBeenCalledWith([50])
  })

  it("does not respond when disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onValueChange = vi.fn()
    renderSlider({ onValueChange, disabled: true })
    expect(slot("slider")).toHaveAttribute("data-disabled")
    await user.click(slot("slider-track"))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  describe("effect=rubber", () => {
    const press = (clientX: number) => fireEvent.pointerDown(slot("slider-track"), { clientX, pointerId: 1 })
    const move = (clientX: number) => fireEvent.pointerMove(slot("slider-track"), { clientX, pointerId: 1 })
    const release = () => fireEvent.pointerUp(slot("slider-track"), { pointerId: 1 })

    it("stretches only past an end, keeps the value at the limit, and lets go on release", () => {
      const onValueChange = vi.fn()
      renderSlider({ effect: "rubber", defaultValue: [90], onValueChange })
      const stage = slot("slider-stage")
      expect(slot("slider")).toHaveAttribute("data-effect", "rubber")
      press(180)
      move(190)
      expect(stage).not.toHaveAttribute("data-stretch")
      move(320)
      expect(stage).toHaveAttribute("data-stretch", "right")
      expect(onValueChange).toHaveBeenLastCalledWith([100])
      move(-60)
      expect(stage).toHaveAttribute("data-stretch", "left")
      expect(onValueChange).toHaveBeenLastCalledWith([0])
      release()
      expect(stage).not.toHaveAttribute("data-stretch")
    })

    it("ignores moves when no drag is in progress", () => {
      renderSlider({ effect: "rubber" })
      move(400)
      expect(slot("slider-stage")).not.toHaveAttribute("data-stretch")
    })

    it("holds still under reduced motion; the value still clamps", () => {
      setReducedMotion(true)
      const onValueChange = vi.fn()
      renderSlider({ effect: "rubber", defaultValue: [90], onValueChange })
      press(180)
      move(320)
      expect(slot("slider-stage")).not.toHaveAttribute("data-stretch")
      expect(onValueChange).toHaveBeenLastCalledWith([100])
    })

    it("still calls the owner's pointer handlers", () => {
      const onPointerDown = vi.fn()
      renderSlider({ effect: "rubber", onPointerDown })
      press(50)
      expect(onPointerDown).toHaveBeenCalledTimes(1)
    })
  })
})
