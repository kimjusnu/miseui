import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { InputOTP, type InputOTPProps, type InputOTPVariant } from "./input-otp"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
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
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly InputOTPVariant[] = ["boxes", "joined", "underline", "dotted-mask"]
const field = () => screen.getByRole("textbox", { name: "Code" }) as HTMLInputElement
const root = () => document.querySelector("[data-slot='input-otp']") as HTMLElement
const boxes = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='input-otp-box']"))
const shown = () => boxes().map((box) => box.textContent).join("")
const activeIndexes = () =>
  boxes().flatMap((box, index) => (box.dataset.active === "true" ? [index] : []))

const renderOtp = (props: InputOTPProps = {}) => render(<InputOTP aria-label="Code" {...props} />)

describe("InputOTP", () => {
  it("is one real input with the platform hints for one-time codes", () => {
    renderOtp()
    expect(field()).toHaveAttribute("autocomplete", "one-time-code")
    expect(field()).toHaveAttribute("inputmode", "numeric")
    expect(field()).toHaveAttribute("maxlength", "6")
    expect(boxes()).toHaveLength(6)
    expect(boxes()[0].parentElement).toHaveAttribute("aria-hidden", "true")
  })

  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("marks the variant and takes typed digits, ignoring anything else", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      renderOtp({ variant, onValueChange, length: 4 })
      expect(root()).toHaveAttribute("data-variant", variant)
      await user.click(field())
      await user.keyboard("1a2")
      expect(field()).toHaveValue("12")
      expect(onValueChange).toHaveBeenLastCalledWith("12")
    })

    it("shows the caret on the next empty box only while focused", async () => {
      const user = userEvent.setup()
      renderOtp({ variant, length: 4, defaultValue: "12" })
      expect(activeIndexes()).toEqual([])
      await user.click(field())
      expect(activeIndexes()).toEqual([2])
      expect(document.querySelector("[data-slot='input-otp-caret']")).not.toBeNull()
      await user.tab()
      expect(activeIndexes()).toEqual([])
    })
  })

  it("boxes and underline print the digit; dotted-mask never does", () => {
    const { unmount } = renderOtp({ variant: "boxes", length: 3, defaultValue: "47" })
    expect(shown()).toBe("47")
    unmount()
    renderOtp({ variant: "dotted-mask", length: 3, defaultValue: "47" })
    expect(shown()).toBe("")
    expect(document.querySelectorAll("[data-slot='input-otp-dot'][data-filled='true']")).toHaveLength(2)
    expect(field()).toHaveValue("47")
  })

  it("joined shares one edge between boxes; boxes keeps them apart", () => {
    const { unmount } = renderOtp({ variant: "joined" })
    expect(boxes()[1].className).toContain("-ml-px")
    expect(boxes()[0].parentElement?.className).not.toContain("gap-2")
    unmount()
    renderOtp({ variant: "boxes" })
    expect(boxes()[1].className).not.toContain("-ml-px")
    expect(boxes()[0].parentElement?.className).toContain("gap-2")
  })

  it("underline draws only a bottom edge", () => {
    renderOtp({ variant: "underline" })
    expect(boxes()[0].className).toContain("border-b-2")
    expect(boxes()[0].className).not.toContain("rounded")
  })

  it("fires onComplete once when the last digit lands, and again only after a change", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    renderOtp({ length: 3, onComplete })
    await user.click(field())
    await user.keyboard("123")
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith("123")
    await user.keyboard("{Backspace}")
    expect(onComplete).toHaveBeenCalledTimes(1)
    await user.keyboard("9")
    expect(onComplete).toHaveBeenCalledTimes(2)
    expect(onComplete).toHaveBeenLastCalledWith("129")
  })

  it("pastes a whole code, stripping separators and extra digits, from any box", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    renderOtp({ onComplete, defaultValue: "9" })
    await user.click(field())
    await user.paste("12-34 56 78")
    expect(field()).toHaveValue("123456")
    expect(onComplete).toHaveBeenCalledWith("123456")
  })

  it("pastes a partial code at the caret", async () => {
    const user = userEvent.setup()
    renderOtp({ length: 6, defaultValue: "12" })
    await user.click(field())
    await user.paste("34")
    expect(field()).toHaveValue("1234")
    expect(activeIndexes()).toEqual([4])
  })

  it("backspace walks left across boxes, deleting as it goes", async () => {
    const user = userEvent.setup()
    renderOtp({ length: 4, defaultValue: "1234" })
    await user.click(field())
    expect(activeIndexes()).toEqual([3])
    await user.keyboard("{Backspace}")
    expect(field()).toHaveValue("123")
    expect(activeIndexes()).toEqual([3])
    await user.keyboard("{Backspace}")
    expect(field()).toHaveValue("12")
    await user.keyboard("{Backspace}{Backspace}{Backspace}")
    expect(field()).toHaveValue("")
    expect(activeIndexes()).toEqual([0])
  })

  it("moves between boxes with arrows, Home and End, and overwrites the box it lands on", async () => {
    const user = userEvent.setup()
    renderOtp({ length: 4, defaultValue: "1234" })
    await user.click(field())
    await user.keyboard("{ArrowLeft}")
    expect(activeIndexes()).toEqual([2])
    await user.keyboard("{Home}")
    expect(activeIndexes()).toEqual([0])
    await user.keyboard("{ArrowRight}")
    expect(activeIndexes()).toEqual([1])
    await user.keyboard("9")
    expect(field()).toHaveValue("1934")
    expect(activeIndexes()).toEqual([2])
    await user.keyboard("{End}")
    expect(activeIndexes()).toEqual([3])
  })

  it("backspace in the middle removes that digit and keeps walking left", async () => {
    const user = userEvent.setup()
    renderOtp({ length: 4, defaultValue: "1234" })
    await user.click(field())
    await user.keyboard("{Home}{ArrowRight}{ArrowRight}{Backspace}")
    expect(field()).toHaveValue("124")
    expect(activeIndexes()).toEqual([1])
  })

  it("a click lands on the box under the pointer", async () => {
    renderOtp({ length: 4, defaultValue: "1234" })
    vi.spyOn(field(), "getBoundingClientRect").mockReturnValue({
      left: 0,
      right: 200,
      width: 200,
      top: 0,
      bottom: 48,
      height: 48,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    field().focus()
    fireEvent.click(field(), { clientX: 60 })
    await waitFor(() => expect(activeIndexes()).toEqual([1]))
  })

  it("accepts letters only when asked", async () => {
    const user = userEvent.setup()
    renderOtp({ mode: "alphanumeric", length: 4 })
    expect(field()).toHaveAttribute("inputmode", "text")
    await user.click(field())
    await user.keyboard("a1-")
    expect(field()).toHaveValue("A1")
  })

  it("follows a controlled value", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState("12")
      return (
        <>
          <InputOTP aria-label="Code" length={4} value={value} onValueChange={setValue} />
          <button onClick={() => setValue("")}>Reset</button>
        </>
      )
    }
    render(<Controlled />)
    await user.click(field())
    await user.keyboard("3")
    expect(shown()).toBe("123")
    await user.click(screen.getByRole("button", { name: "Reset" }))
    expect(shown()).toBe("")
  })

  it("returns the caret to the first box when the owner clears a wrong code while focused", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<InputOTP aria-label="Code" length={4} value="1234" />)
    await user.click(field())
    expect(activeIndexes()).toEqual([3])
    rerender(<InputOTP aria-label="Code" length={4} value="" />)
    expect(activeIndexes()).toEqual([0])
  })

  it("error marks the field invalid and shakes it", async () => {
    const { rerender } = render(<InputOTP aria-label="Code" />)
    expect(field()).not.toHaveAttribute("aria-invalid")
    rerender(<InputOTP aria-label="Code" error />)
    expect(field()).toHaveAttribute("aria-invalid", "true")
    expect(root()).toHaveAttribute("data-error", "true")
    expect(boxes()[0]).toHaveAttribute("data-invalid", "true")
    await waitFor(() => expect(root().style.transform).toContain("translateX"))
  })

  it("error only recolours under reduced motion: the shake collapses", async () => {
    setReducedMotion(true)
    const { rerender } = render(<InputOTP aria-label="Code" />)
    rerender(<InputOTP aria-label="Code" error />)
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(root().style.transform).toBe("")
    expect(root()).toHaveAttribute("data-error", "true")
  })

  it("effect=pop marks the root and draws each digit through a motion span", () => {
    renderOtp({ effect: "pop", defaultValue: "1" })
    expect(root()).toHaveAttribute("data-effect", "pop")
    expect(document.querySelector("[data-slot='input-otp-digit']")).toHaveTextContent("1")
  })

  it("does not take input when disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderOtp({ disabled: true })
    expect(field()).toBeDisabled()
    await user.click(field())
    await user.keyboard("1")
    expect(field()).toHaveValue("")
  })
})
