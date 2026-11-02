import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NumberInput, type NumberInputVariant } from "./number-input"
import { clampNumber, fittedFontSize, parseNumber, shortestDigitDelta, stepValue, wheelOffset } from "./number-input-math"

const VARIANTS: readonly NumberInputVariant[] = ["plain", "split", "stepper-pill", "large"]
const field = () => screen.getByRole("spinbutton") as HTMLInputElement
const increase = () => screen.getByRole("button", { name: "Increase", hidden: true })
const decrease = () => screen.getByRole("button", { name: "Decrease", hidden: true })

describe("number helpers", () => {
  it("clampNumber respects whichever bounds exist", () => {
    expect(clampNumber(5, { min: 10 })).toBe(10)
    expect(clampNumber(50, { max: 10 })).toBe(10)
    expect(clampNumber(5, {})).toBe(5)
  })

  it("stepValue keeps the step's precision and starts from zero when empty", () => {
    expect(stepValue(0.1, 0.2, {})).toBe(0.3)
    expect(stepValue(1, 0.05, {})).toBe(1.05)
    expect(stepValue(9, 5, { max: 10 })).toBe(10)
    expect(stepValue(null, 1, { min: 5 })).toBe(5)
    expect(stepValue(null, 1, {})).toBe(0)
  })

  it("parseNumber reads formatted text in the given locale", () => {
    expect(parseNumber("1,234.5", "en-US")).toBe(1234.5)
    expect(parseNumber("1.234,5", "de-DE")).toBe(1234.5)
    expect(parseNumber("$12.00", "en-US")).toBe(12)
    expect(parseNumber("-3", "en-US")).toBe(-3)
    expect(parseNumber("12%", "en-US", true)).toBe(0.12)
    expect(parseNumber("abc", "en-US")).toBeNull()
    expect(parseNumber("-", "en-US")).toBeNull()
    expect(parseNumber("1-2", "en-US")).toBeNull()
  })

  it("shortestDigitDelta takes the short way round the wheel", () => {
    expect(shortestDigitDelta(9, 0)).toBe(1)
    expect(shortestDigitDelta(0, 9)).toBe(-1)
    expect(shortestDigitDelta(2, 5)).toBe(3)
    expect(shortestDigitDelta(4, 4)).toBe(0)
  })

  it("wheelOffset puts the face at the position in the window and wraps the rest", () => {
    expect(wheelOffset(3, 3)).toBe(0)
    expect(wheelOffset(4, 3)).toBe(1)
    expect(wheelOffset(2, 3)).toBe(-1)
    expect(wheelOffset(0, 9)).toBe(1)
    expect(wheelOffset(9, 10)).toBe(-1)
  })
})

describe("fittedFontSize", () => {
  it("shares the field width out across the characters and never passes the design size", () => {
    expect(fittedFontSize(8)).toBe("min(3rem, calc(100cqi / 4.96))")
    expect(fittedFontSize(2)).toBe("min(3rem, calc(100cqi / 1.24))")
  })

  it("treats an empty field as one character, because dividing by zero is not a size", () => {
    expect(fittedFontSize(0)).toBe("min(3rem, calc(100cqi / 0.62))")
  })
})

describe("NumberInput", () => {
  it("shrinks the large number to fit its field, in the field and in the rolling digits alike", () => {
    const format = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const
    const { container, rerender } = render(<NumberInput variant="large" effect="roll" aria-label="Price" defaultValue={1190} locale="en-US" format={format} />)
    const size = screen.getByRole("spinbutton").style.fontSize
    expect(size).toContain("cqi")
    expect((container.querySelector("[data-slot='number-input-roll']") as HTMLElement).style.fontSize).toBe(size)
    rerender(<NumberInput aria-label="Price" defaultValue={1190} />)
    expect(screen.getByRole("spinbutton").style.fontSize).toBe("")
  })

  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("exposes a spinbutton with its bounds and steps by the buttons within them", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<NumberInput variant={variant} aria-label="Seats" defaultValue={9} min={0} max={10} onValueChange={onValueChange} />)
      expect(screen.getByRole("spinbutton", { name: "Seats" })).toHaveAttribute("aria-valuenow", "9")
      expect(field()).toHaveAttribute("aria-valuemin", "0")
      expect(field()).toHaveAttribute("aria-valuemax", "10")
      await user.click(increase())
      expect(onValueChange).toHaveBeenLastCalledWith(10)
      expect(increase()).toBeDisabled()
      await user.click(decrease())
      expect(onValueChange).toHaveBeenLastCalledWith(9)
    })

    it("marks the root", () => {
      const { container } = render(<NumberInput variant={variant} aria-label="Seats" effect="roll" />)
      const root = container.querySelector("[data-slot='number-input']")
      expect(root).toHaveAttribute("data-variant", variant)
      expect(root).toHaveAttribute("data-effect", "roll")
    })
  })

  it("draws plain with its buttons together at the end and split with one on each side", () => {
    const order = (variant: NumberInputVariant) => {
      const { unmount } = render(<NumberInput variant={variant} aria-label="Seats" />)
      const relation = field().compareDocumentPosition(decrease())
      unmount()
      return relation
    }
    expect(order("plain")).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(order("split")).toBe(Node.DOCUMENT_POSITION_PRECEDING)
  })

  it("shows the caption only on large", () => {
    const { rerender } = render(<NumberInput variant="large" aria-label="Seats" caption="seats" />)
    expect(screen.getByText("seats")).toBeInTheDocument()
    rerender(<NumberInput variant="plain" aria-label="Seats" caption="seats" />)
    expect(screen.queryByText("seats")).toBeNull()
  })

  it("hugs its digits on the pill, so the field grows with the value", () => {
    const { rerender } = render(<NumberInput variant="stepper-pill" aria-label="Seats" locale="en-US" value={1} />)
    expect(field().style.width).toBe("3ch")
    rerender(<NumberInput variant="stepper-pill" aria-label="Seats" locale="en-US" value={12345} />)
    expect(field().style.width).toBe("7ch")
  })

  it("takes the whole keyboard pattern", async () => {
    const user = userEvent.setup()
    render(<NumberInput aria-label="Seats" defaultValue={5} min={0} max={100} step={2} />)
    await user.click(field())
    await user.keyboard("{ArrowUp}")
    expect(field()).toHaveValue("7")
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(field()).toHaveValue("3")
    await user.keyboard("{PageUp}")
    expect(field()).toHaveValue("23")
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}")
    expect(field()).toHaveValue("3")
    await user.keyboard("{End}")
    expect(field()).toHaveValue("100")
    await user.keyboard("{Home}")
    expect(field()).toHaveValue("0")
  })

  it("keeps the step buttons out of the tab order, because the field already takes the arrows", async () => {
    const user = userEvent.setup()
    render(<NumberInput aria-label="Seats" />)
    await user.tab()
    expect(field()).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
    expect(increase()).toHaveAttribute("tabindex", "-1")
  })

  it("keeps focus in the field when a step button is pressed with the mouse", async () => {
    const user = userEvent.setup()
    render(<NumberInput aria-label="Seats" defaultValue={1} />)
    await user.click(field())
    await user.click(increase())
    expect(field()).toHaveFocus()
    expect(field()).toHaveValue("2")
    await user.keyboard("{ArrowUp}")
    expect(field()).toHaveValue("3")
  })

  it("still calls the owner's blur and key handlers", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()
    const onKeyDown = vi.fn()
    render(<NumberInput aria-label="Seats" defaultValue={1} onBlur={onBlur} onKeyDown={onKeyDown} />)
    await user.click(field())
    await user.keyboard("{ArrowUp}")
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(field()).toHaveValue("2")
    await user.tab()
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it("does not clamp while typing, then clamps on blur", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberInput aria-label="Seats" defaultValue={50} min={10} max={100} onValueChange={onValueChange} />)
    await user.clear(field())
    await user.type(field(), "5")
    expect(field()).toHaveValue("5")
    expect(onValueChange).not.toHaveBeenCalled()
    await user.tab()
    expect(field()).toHaveValue("10")
    expect(onValueChange).toHaveBeenLastCalledWith(10)
  })

  it("commits on Enter, clears on blank and returns to the last number on nonsense", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberInput aria-label="Seats" defaultValue={50} onValueChange={onValueChange} />)
    await user.clear(field())
    await user.type(field(), "70{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(70)
    await user.clear(field())
    await user.type(field(), "wat")
    await user.tab()
    expect(field()).toHaveValue("70")
    await user.clear(field())
    await user.tab()
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(field()).toHaveValue("")
  })

  it("shows the Intl format at rest and reads it back when edited", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const format = { style: "currency", currency: "USD" } as const
    render(<NumberInput aria-label="Budget" defaultValue={1200} locale="en-US" format={format} onValueChange={onValueChange} />)
    expect(field()).toHaveValue("$1,200.00")
    expect(field()).toHaveAttribute("aria-valuetext", "$1,200.00")
    await user.clear(field())
    await user.type(field(), "2,500{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(2500)
    expect(field()).toHaveValue("$2,500.00")
  })

  it("treats a percent format as the fraction Intl expects", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberInput aria-label="Tax" defaultValue={0.1} step={0.01} locale="en-US" format={{ style: "percent" }} onValueChange={onValueChange} />)
    expect(field()).toHaveValue("10%")
    await user.clear(field())
    await user.type(field(), "25{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(0.25)
  })

  describe("hold to repeat", () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())
    const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

    it("steps once at once, repeats after the delay and stops on release", () => {
      render(<NumberInput aria-label="Seats" defaultValue={0} />)
      fireEvent.pointerDown(increase(), { button: 0 })
      expect(field()).toHaveValue("1")
      advance(399)
      expect(field()).toHaveValue("1")
      advance(1 + 70 * 3)
      expect(field()).toHaveValue("4")
      fireEvent.pointerUp(increase())
      advance(1000)
      expect(field()).toHaveValue("4")
    })

    it("stops when the pointer leaves or the bound is reached", () => {
      render(<NumberInput aria-label="Seats" defaultValue={0} max={3} />)
      fireEvent.pointerDown(increase(), { button: 0 })
      advance(400 + 70 * 20)
      expect(field()).toHaveValue("3")
      expect(increase()).toBeDisabled()
      fireEvent.pointerDown(decrease(), { button: 0 })
      expect(field()).toHaveValue("2")
      fireEvent.pointerLeave(decrease())
      advance(1000)
      expect(field()).toHaveValue("2")
    })

    it("ignores the right mouse button", () => {
      render(<NumberInput aria-label="Seats" defaultValue={0} />)
      fireEvent.pointerDown(increase(), { button: 2 })
      advance(1000)
      expect(field()).toHaveValue("0")
    })
  })

  it("steps once for a click with no pointer behind it, as a screen reader sends", () => {
    render(<NumberInput aria-label="Seats" defaultValue={0} />)
    fireEvent.click(increase())
    expect(field()).toHaveValue("1")
  })

  it.each([
    [{ min: 0 }, "numeric"],
    [{ min: 0, step: 0.5 }, "decimal"],
    [{ min: -5 }, "text"],
    [{}, "text"],
  ])("picks a phone keypad that can type every allowed value, %o", (bounds, keypad) => {
    render(<NumberInput aria-label="Seats" {...bounds} />)
    expect(field()).toHaveAttribute("inputmode", keypad)
  })

  it("does nothing when read only, and posts the raw number with a form", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = render(<NumberInput aria-label="Budget" name="budget" defaultValue={1200} locale="en-US" readOnly />)
    expect(increase()).toBeDisabled()
    await user.click(field())
    await user.keyboard("{ArrowUp}")
    expect(field()).toHaveValue("1,200")
    expect(container.querySelector("input[type='hidden']")).toHaveValue("1200")
  })

  it("follows a controlled value, not the click", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberInput aria-label="Seats" value={5} onValueChange={onValueChange} />)
    await user.click(increase())
    expect(onValueChange).toHaveBeenCalledWith(6)
    expect(field()).toHaveValue("5")
  })

  it("rolls digits over a transparent field and steps aside while someone types", async () => {
    const user = userEvent.setup()
    const { container } = render(<NumberInput aria-label="Budget" defaultValue={1234} locale="en-US" effect="roll" />)
    const roll = () => container.querySelector("[data-slot='number-input-roll']")
    expect(roll()).toHaveAttribute("aria-hidden", "true")
    expect(container.querySelectorAll("[data-slot='number-input-digit']")).toHaveLength(4)
    expect(field()).toHaveClass("text-transparent")
    expect(field()).toHaveValue("1,234")
    await user.click(field())
    await user.keyboard("9")
    expect(roll()).toBeNull()
    expect(field()).not.toHaveClass("text-transparent")
  })
})
