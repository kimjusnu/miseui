import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Combobox } from "./combobox"
import { Field, FieldControl, type FieldVariant } from "./field"
import { InputOTP } from "./input-otp"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Slider } from "./slider"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => vi.stubGlobal("ResizeObserver", ResizeObserverStub))
afterAll(() => vi.unstubAllGlobals())

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

const VARIANTS: readonly FieldVariant[] = ["stacked", "inline", "floating", "card"]
const root = () => document.querySelector("[data-slot='field']") as HTMLElement
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement
const follows = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

describe("Field", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("names the control by its label and describes it by description and error", () => {
      render(
        <Field variant={variant} label="Email" description="For receipts only" error="Enter a full address">
          <input />
        </Field>,
      )
      const input = screen.getByRole("textbox", { name: "Email" })
      expect(root()).toHaveAttribute("data-variant", variant)
      expect(input).toHaveAccessibleDescription("For receipts only Enter a full address")
      expect(input).toHaveAttribute("aria-invalid", "true")
    })

    it("focuses the control when the label is clicked", async () => {
      const user = userEvent.setup()
      render(
        <Field variant={variant} label="Email">
          <input />
        </Field>,
      )
      await user.click(screen.getByText("Email"))
      expect(screen.getByRole("textbox")).toHaveFocus()
    })

    it("shows a required mark that assistive tech gets as aria-required, not as an asterisk", () => {
      render(
        <Field variant={variant} label="Email" required>
          <input />
        </Field>,
      )
      const input = screen.getByRole("textbox", { name: "Email" })
      expect(input).toHaveAttribute("aria-required", "true")
      expect(slot("field-required")).toHaveAttribute("aria-hidden", "true")
    })
  })

  it("leaves a clean control when there is nothing to say", () => {
    render(
      <Field label="Email">
        <input />
      </Field>,
    )
    const input = screen.getByRole("textbox")
    expect(input).not.toHaveAttribute("aria-invalid")
    expect(input).not.toHaveAttribute("aria-required")
    expect(input).not.toHaveAttribute("aria-describedby")
    expect(slot("field-error")).toBeNull()
  })

  it("keeps ids and describedby the control already has", () => {
    render(
      <>
        <span id="own-hint">Own hint</span>
        <Field label="Email" description="Field hint">
          <input id="own-id" aria-describedby="own-hint" />
        </Field>
      </>,
    )
    const input = screen.getByRole("textbox", { name: "Email" })
    expect(input).toHaveAttribute("id", "own-id")
    expect(input).toHaveAccessibleDescription("Own hint Field hint")
  })

  it("stacked runs label, control, description top to bottom", () => {
    render(
      <Field label="Email" description="Hint">
        <input />
      </Field>,
    )
    expect(follows(screen.getByText("Email"), screen.getByRole("textbox"))).toBe(true)
    expect(follows(screen.getByRole("textbox"), screen.getByText("Hint"))).toBe(true)
  })

  it("inline splits into label and control columns", () => {
    render(
      <Field variant="inline" label="Email" description="Hint">
        <input />
      </Field>,
    )
    expect(slot("field-grid").className).toContain("grid-cols-")
    expect(slot("field-label-column")).toContainElement(screen.getByText("Email"))
    expect(slot("field-label-column")).not.toContainElement(screen.getByRole("textbox"))
  })

  it("floating puts the label after the control, inside its frame, and gives the input a blank placeholder", () => {
    render(
      <Field variant="floating" label="Email">
        <input />
      </Field>,
    )
    const frame = slot("field-control")
    const label = screen.getByText("Email")
    expect(frame).toContainElement(label)
    expect(follows(screen.getByRole("textbox"), label)).toBe(true)
    // :placeholder-shown is what lets the label sense an empty field with no JavaScript.
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", " ")
  })

  it("floating keeps a real placeholder the owner supplied", () => {
    render(
      <Field variant="floating" label="Email">
        <input placeholder="you@studio.com" />
      </Field>,
    )
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "you@studio.com")
  })

  it("card holds label and description on one side and the control on the other", () => {
    render(
      <Field variant="card" label="Weekly digest" description="Every Monday">
        <input type="checkbox" />
      </Field>,
    )
    const text = slot("field-label-column")
    expect(text).toContainElement(screen.getByText("Weekly digest"))
    expect(text).toContainElement(screen.getByText("Every Monday"))
    expect(text).not.toContainElement(screen.getByRole("checkbox"))
    expect(screen.getByRole("checkbox", { name: "Weekly digest" })).toBeInTheDocument()
  })

  it("FieldControl wires a control nested inside a wrapper that swallows props", () => {
    function Wrapper({ children }: { children: React.ReactNode; id?: string }) {
      return <div>{children}</div>
    }
    render(
      <Field label="Timezone" description="Used for reminders">
        <Wrapper>
          <FieldControl>
            <input />
          </FieldControl>
        </Wrapper>
      </Field>,
    )
    expect(screen.getByRole("textbox", { name: "Timezone" })).toHaveAccessibleDescription("Used for reminders")
  })

  it("wires every kind of control this library ships: otp, slider, radio group, combobox", () => {
    render(
      <>
        <Field label="Code" description="Six digits" error="Wrong code">
          <InputOTP />
        </Field>
        <Field label="Volume" description="Speaker only">
          <Slider defaultValue={[40]} />
        </Field>
        <Field label="Plan" description="Billed monthly">
          <RadioGroup defaultValue="solo">
            <RadioGroupItem value="solo">Solo</RadioGroupItem>
          </RadioGroup>
        </Field>
        <Field label="City" description="For delivery">
          <Combobox options={[{ value: "seoul", label: "Seoul" }]} />
        </Field>
      </>,
    )
    const code = screen.getByRole("textbox", { name: "Code" })
    expect(code).toHaveAccessibleDescription("Six digits Wrong code")
    expect(code).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("slider", { name: "Volume" })).toHaveAccessibleDescription("Speaker only")
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toHaveAccessibleDescription("Billed monthly")
    expect(screen.getByRole("button", { name: "City" })).toHaveAccessibleDescription("For delivery")
  })

  it("disabled passes to the control and dims the row", () => {
    render(
      <Field label="Email" disabled>
        <input />
      </Field>,
    )
    expect(screen.getByRole("textbox")).toBeDisabled()
    expect(root()).toHaveAttribute("data-disabled", "true")
  })

  it("announces errors politely from a region that exists before the error does", () => {
    const { rerender } = render(
      <Field label="Email">
        <input />
      </Field>,
    )
    const live = slot("field-live")
    expect(live).toHaveAttribute("aria-live", "polite")
    rerender(
      <Field label="Email" error="Enter a full address">
        <input />
      </Field>,
    )
    expect(slot("field-live")).toBe(live)
    expect(live).toHaveTextContent("Enter a full address")
  })

  describe("effects", () => {
    function withError(effect: "shake-error" | "materialize", error?: string) {
      return (
        <Field label="Email" effect={effect} error={error}>
          <input />
        </Field>
      )
    }

    it("shake-error moves the control when an error appears, and again when it changes", async () => {
      const { rerender } = render(withError("shake-error"))
      expect(root()).toHaveAttribute("data-effect", "shake-error")
      rerender(withError("shake-error", "Enter a full address"))
      const control = slot("field-control")
      await waitFor(() => expect(control.style.transform).toContain("translateX"))
      await waitFor(() => expect(control.style.transform).toBe("none"), { timeout: 1500 })
      rerender(withError("shake-error", "That address is already taken"))
      await waitFor(() => expect(control.style.transform).toContain("translateX"))
    })

    it("shake-error holds still under reduced motion and still shows the error", async () => {
      setReducedMotion(true)
      const { rerender } = render(withError("shake-error"))
      rerender(withError("shake-error", "Enter a full address"))
      await new Promise((resolve) => setTimeout(resolve, 80))
      expect(slot("field-control").style.transform).toBe("")
      expect(screen.getByText("Enter a full address")).toBeInTheDocument()
    })

    it("materialize animates the error in with motion and keeps the control in place", () => {
      const { rerender } = render(withError("materialize"))
      rerender(withError("materialize", "Enter a full address"))
      expect(slot("field-error")).toHaveAttribute("data-materialize", "true")
      expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Enter a full address")
    })

    it("materialize drops the blur and height under reduced motion", () => {
      setReducedMotion(true)
      const { rerender } = render(withError("materialize"))
      rerender(withError("materialize", "Enter a full address"))
      expect(slot("field-error")).toHaveAttribute("data-materialize", "false")
    })
  })
})
