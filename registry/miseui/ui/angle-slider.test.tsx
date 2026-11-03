import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { AngleSlider, type AngleSliderProps, type AngleSliderVariant } from "./angle-slider"
import {
  angleToValue,
  arcPath,
  dialRotation,
  dragValue,
  normalizeAngle,
  pointerToAngle,
  pressValue,
  shortestDelta,
  snapToStep,
  stepValue,
  valueToAngle,
  wrapValue,
  type DialRange,
} from "./angle-slider-math"

const CIRCLE: DialRange = { min: 0, max: 360, sweep: 360, start: 0 }
const GAUGE: DialRange = { min: 0, max: 100, sweep: 270, start: 225 }

describe("angle maths", () => {
  it("normalises into 0..360 and never returns -0", () => {
    expect(normalizeAngle(370)).toBe(10)
    expect(normalizeAngle(-10)).toBe(350)
    expect(Object.is(normalizeAngle(-360), 0)).toBe(true)
  })

  it("reads a pointer clockwise from the top", () => {
    expect(pointerToAngle(50, 0, 50, 50)).toBe(0)
    expect(pointerToAngle(100, 50, 50, 50)).toBe(90)
    expect(pointerToAngle(50, 100, 50, 50)).toBe(180)
    expect(pointerToAngle(0, 50, 50, 50)).toBe(270)
    expect(pointerToAngle(50, 50, 50, 50)).toBe(0)
  })

  it("takes the short way round", () => {
    expect(shortestDelta(350, 10)).toBe(20)
    expect(shortestDelta(10, 350)).toBe(-20)
    expect(shortestDelta(0, 180)).toBe(180)
  })

  it("snaps on a grid without binary noise", () => {
    expect(snapToStep(7, 5)).toBe(5)
    expect(snapToStep(0.30000000000000004, 0.1)).toBe(0.3)
    expect(snapToStep(12, 5, 2)).toBe(12)
    expect(snapToStep(13, 0)).toBe(13)
  })

  it("wraps past the ends only when asked", () => {
    expect(stepValue(355, 10, CIRCLE, 1, true)).toBe(5)
    expect(stepValue(5, -10, CIRCLE, 1, true)).toBe(355)
    expect(stepValue(355, 10, CIRCLE, 1, false)).toBe(360)
    expect(stepValue(5, -10, CIRCLE, 1, false)).toBe(0)
    expect(wrapValue(360, CIRCLE)).toBe(0)
  })

  it("maps a partial dial and sends the dead zone to the nearer end", () => {
    expect(valueToAngle(0, GAUGE)).toBe(225)
    expect(valueToAngle(100, GAUGE)).toBe(135)
    expect(valueToAngle(50, GAUGE)).toBe(0)
    expect(angleToValue(0, GAUGE)).toBe(50)
    expect(angleToValue(150, GAUGE)).toBe(100)
    expect(angleToValue(210, GAUGE)).toBe(0)
  })

  it("does not let a bounded drag leap across its seam", () => {
    const drag = { range: GAUGE, step: 1, wrap: false }
    expect(dragValue({ ...drag, angle: 210, previous: 95 })).toBe(100)
    expect(dragValue({ ...drag, angle: 150, previous: 5 })).toBe(0)
    expect(dragValue({ ...drag, angle: 5, previous: 350, range: CIRCLE, wrap: false })).toBe(360)
    expect(dragValue({ ...drag, angle: 5, previous: 350, range: CIRCLE, wrap: true })).toBe(5)
    expect(dragValue({ ...drag, angle: 359.6, previous: 350, range: CIRCLE, wrap: true })).toBe(0)
  })

  it("lets a press go anywhere", () => {
    expect(pressValue(150, GAUGE, 1, false)).toBe(100)
    expect(pressValue(180, CIRCLE, 45, true)).toBe(180)
  })

  it("keeps gauge rotation continuous along the arc and draws the long arc", () => {
    expect(dialRotation(0, GAUGE)).toBe(225)
    expect(dialRotation(100, GAUGE)).toBe(495)
    expect(arcPath(225, 270, 44, 50)).toContain("0 1 1")
    expect(arcPath(0, 90, 44, 50)).toContain("0 0 1")
  })
})

describe("AngleSlider", () => {
  const slider = () => screen.getByRole("slider")

  beforeAll(() => {
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = vi.fn(() => true)
    Element.prototype.releasePointerCapture = vi.fn()
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}),
    })
  })

  afterAll(() => vi.restoreAllMocks())

  const Controlled = (props: Partial<AngleSliderProps>) => {
    const [value, setValue] = useState(props.defaultValue ?? 0)
    return <AngleSlider aria-label="Rotation" {...props} defaultValue={undefined} value={value} onValueChange={setValue} />
  }

  it("exposes a named slider with range and spoken value", () => {
    render(<AngleSlider aria-label="Rotation" defaultValue={45} />)
    expect(slider()).toHaveAccessibleName("Rotation")
    expect(slider()).toHaveAttribute("aria-valuemin", "0")
    expect(slider()).toHaveAttribute("aria-valuemax", "360")
    expect(slider()).toHaveAttribute("aria-valuenow", "45")
    expect(slider()).toHaveAttribute("aria-valuetext", "45 degrees")
    expect(screen.getByText("45°")).toBeInTheDocument()
  })

  it("steps with the keyboard, wrapping past 360", async () => {
    const onCommit = vi.fn()
    render(<Controlled defaultValue={359} step={1} onValueCommit={onCommit} />)
    slider().focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(slider()).toHaveAttribute("aria-valuenow", "0")
    await userEvent.keyboard("{ArrowDown}")
    expect(slider()).toHaveAttribute("aria-valuenow", "359")
    await userEvent.keyboard("{PageDown}")
    expect(slider()).toHaveAttribute("aria-valuenow", "344")
    await userEvent.keyboard("{Home}")
    expect(slider()).toHaveAttribute("aria-valuenow", "0")
    await userEvent.keyboard("{End}")
    expect(slider()).toHaveAttribute("aria-valuenow", "359")
    expect(onCommit).toHaveBeenCalledTimes(5)
  })

  it("stops at the ends when wrap is off", async () => {
    render(<Controlled defaultValue={359} wrap={false} />)
    slider().focus()
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    expect(slider()).toHaveAttribute("aria-valuenow", "360")
  })

  it("follows the pointer under capture, then commits once", () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()
    render(<AngleSlider aria-label="Rotation" onValueChange={onChange} onValueCommit={onCommit} />)
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 0, clientX: 100, clientY: 50 })
    expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(1)
    expect(slider()).toHaveFocus()
    expect(slider()).toHaveAttribute("aria-valuenow", "90")
    fireEvent.pointerMove(slider(), { pointerId: 1, clientX: 50, clientY: 100 })
    expect(slider()).toHaveAttribute("aria-valuenow", "180")
    expect(onCommit).not.toHaveBeenCalled()
    fireEvent.pointerUp(slider(), { pointerId: 1 })
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(180)
    fireEvent.pointerMove(slider(), { pointerId: 1, clientX: 0, clientY: 50 })
    expect(slider()).toHaveAttribute("aria-valuenow", "180")
    expect(onChange).toHaveBeenLastCalledWith(180)
  })

  it("ignores a press with another button", () => {
    render(<AngleSlider aria-label="Rotation" defaultValue={10} />)
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 2, clientX: 100, clientY: 50 })
    expect(slider()).toHaveAttribute("aria-valuenow", "10")
  })

  it("does nothing when disabled", async () => {
    render(<AngleSlider aria-label="Rotation" defaultValue={10} disabled />)
    expect(slider()).toHaveAttribute("aria-disabled", "true")
    expect(slider()).toHaveAttribute("tabindex", "-1")
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 0, clientX: 100, clientY: 50 })
    fireEvent.keyDown(slider(), { key: "ArrowRight" })
    expect(slider()).toHaveAttribute("aria-valuenow", "10")
  })

  it("treats a spring press as a jump, and a drag as direct", async () => {
    render(<AngleSlider aria-label="Rotation" effect="spring" />)
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 0, clientX: 100, clientY: 50 })
    const thumb = document.querySelector("[data-slot='angle-slider-thumb']") as HTMLElement
    // The value is the destination straight away, the thumb is still on its way there.
    expect(slider()).toHaveAttribute("aria-valuenow", "90")
    expect(thumb.style.transform).not.toContain("rotate(90deg)")
    fireEvent.pointerMove(slider(), { pointerId: 1, clientX: 50, clientY: 100 })
    await waitFor(() => expect(thumb.style.transform).toContain("rotate(180deg)"))
    fireEvent.pointerUp(slider(), { pointerId: 1 })
  })

  it("makes the variants differ in structure", () => {
    const parts = (variant: AngleSliderVariant) => {
      const { unmount } = render(<AngleSlider aria-label="Rotation" variant={variant} />)
      const result = {
        ticks: document.querySelector("[data-slot='angle-slider-ticks']") !== null,
        gauge: document.querySelector("[data-slot='angle-slider-gauge']") !== null,
        valueInsideDial: slider().querySelector("[data-slot='angle-slider-value']") !== null,
        max: slider().getAttribute("aria-valuemax"),
      }
      unmount()
      return result
    }
    expect(parts("plain")).toEqual({ ticks: false, gauge: false, valueInsideDial: true, max: "360" })
    expect(parts("ticks")).toEqual({ ticks: true, gauge: false, valueInsideDial: true, max: "360" })
    expect(parts("compact")).toEqual({ ticks: false, gauge: false, valueInsideDial: false, max: "360" })
    expect(parts("gauge")).toEqual({ ticks: false, gauge: true, valueInsideDial: true, max: "100" })
  })

  it("fills the gauge arc in proportion to the value", () => {
    render(<AngleSlider aria-label="Volume" variant="gauge" defaultValue={25} />)
    const fill = document.querySelectorAll("[data-slot='angle-slider-gauge'] path")[1]
    expect(fill.getAttribute("stroke-dasharray")).toMatch(/^0\.25(px)? /)
  })

  it("posts the value in a form and formats what it shows", () => {
    const { container } = render(
      <AngleSlider aria-label="Volume" variant="gauge" name="volume" defaultValue={40} format={(value) => `${value}%`} />,
    )
    expect(container.querySelector("input[name='volume']")).toHaveValue("40")
    expect(screen.getByText("40%")).toBeInTheDocument()
    expect(slider()).toHaveAttribute("aria-valuetext", "40%")
  })
})
