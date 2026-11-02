import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { RadioGroup, RadioGroupItem, type RadioGroupProps, type RadioGroupVariant } from "./radio-group"

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
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly RadioGroupVariant[] = ["plain", "card", "segmented", "list"]
const INDICATOR = "[data-slot='radio-group-indicator']"

function Plans(props: RadioGroupProps) {
  return (
    <RadioGroup aria-label="Plan" defaultValue="team" {...props}>
      <RadioGroupItem value="solo" description="One seat">
        Solo
      </RadioGroupItem>
      <RadioGroupItem value="team" description="Up to ten seats">
        Team
      </RadioGroupItem>
      <RadioGroupItem value="scale" description="Unlimited seats" disabled>
        Scale
      </RadioGroupItem>
    </RadioGroup>
  )
}

const radio = (name: string) => screen.getByRole("radio", { name })

describe("RadioGroup", () => {
  it("names each radio by its label alone and describes it with the description", () => {
    render(<Plans />)
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toHaveAttribute("data-slot", "radio-group")
    expect(radio("Team")).toHaveAccessibleDescription("Up to ten seats")
  })

  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("marks the root and picks an option on click", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Plans variant={variant} onValueChange={onValueChange} />)
      expect(screen.getByRole("radiogroup")).toHaveAttribute("data-variant", variant)
      await user.click(radio("Solo"))
      expect(radio("Solo")).toBeChecked()
      expect(radio("Team")).not.toBeChecked()
      expect(onValueChange).toHaveBeenCalledWith("solo")
    })

    it("moves focus and selection with arrow keys and skips the disabled option", async () => {
      const user = userEvent.setup()
      render(<Plans variant={variant} />)
      // Radix selects only if the arrow is still down when its deferred focus lands, as with a real key press.
      const press = async (key: string, expected: string) => {
        await user.keyboard(`{${key}>}`)
        await waitFor(() => expect(radio(expected)).toHaveFocus())
        await user.keyboard(`{/${key}}`)
      }
      await user.click(radio("Team"))
      await press("ArrowDown", "Solo")
      expect(radio("Solo")).toBeChecked()
      await press("ArrowUp", "Team")
      expect(radio("Team")).toBeChecked()
      expect(radio("Scale")).not.toBeChecked()
    })

    it("cannot select a disabled option", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<Plans variant={variant} />)
      expect(radio("Scale")).toBeDisabled()
      await user.click(radio("Scale"))
      expect(radio("Team")).toBeChecked()
    })

    it("draws the spring indicator only inside the chosen option and carries it on selection", async () => {
      const user = userEvent.setup()
      const { container } = render(<Plans variant={variant} effect="spring" />)
      expect(screen.getByRole("radiogroup")).toHaveAttribute("data-effect", "spring")
      expect(container.querySelectorAll(INDICATOR)).toHaveLength(1)
      expect(radio("Team").querySelector(INDICATOR)).not.toBeNull()
      await user.click(radio("Solo"))
      expect(container.querySelectorAll(INDICATOR)).toHaveLength(1)
      expect(radio("Solo").querySelector(INDICATOR)).not.toBeNull()
    })
  })

  it("plain wraps a small round radio and its text in one label, so the text selects too", async () => {
    const user = userEvent.setup()
    render(<Plans variant="plain" />)
    const label = radio("Solo").closest("label") as HTMLElement
    expect(label).not.toBeNull()
    expect(radio("Solo")).not.toContainElement(screen.getByText("Solo"))
    await user.click(within(label).getByText("One seat"))
    expect(radio("Solo")).toBeChecked()
  })

  it("card makes the whole option the radio, with the description and a check mark inside it", () => {
    render(<Plans variant="card" />)
    const team = radio("Team")
    expect(team.closest("label")).toBeNull()
    expect(team).toContainElement(screen.getByText("Up to ten seats"))
    expect(team.querySelector("[data-slot='radio-group-check'] svg")).not.toBeNull()
    expect(radio("Solo").querySelector("[data-slot='radio-group-check'] svg")).toBeNull()
  })

  it("segmented hides the description visually but keeps it for assistive tech", () => {
    render(<Plans variant="segmented" />)
    expect(screen.getByText("One seat")).toHaveClass("sr-only")
    expect(radio("Solo")).toHaveAccessibleDescription("One seat")
    expect(radio("Solo").querySelector("[data-slot='radio-group-check']")).toBeNull()
  })

  it("list shows a trailing check on the chosen row only, with no round mark", async () => {
    const user = userEvent.setup()
    render(<Plans variant="list" />)
    const check = (name: string) => radio(name).querySelector("[data-slot='radio-group-check'] svg")
    expect(check("Team")).not.toBeNull()
    expect(check("Solo")).toBeNull()
    await user.click(radio("Solo"))
    expect(check("Solo")).not.toBeNull()
    expect(check("Team")).toBeNull()
  })

  it("follows a controlled value, not the click, when the owner holds the state", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Plans value="team" defaultValue={undefined} effect="spring" onValueChange={onValueChange} />)
    await user.click(radio("Solo"))
    expect(onValueChange).toHaveBeenCalledWith("solo")
    expect(radio("Team")).toBeChecked()
    expect(radio("Team").querySelector(INDICATOR)).not.toBeNull()
  })

  it("keeps the indicator but drops the flight under reduced motion", () => {
    setReducedMotion(true)
    render(<Plans variant="card" effect="spring" />)
    expect(radio("Team").querySelector(INDICATOR)).toHaveAttribute("data-reduced", "true")
  })

  it("keeps two groups apart: each has its own indicator", () => {
    const { container } = render(
      <>
        <Plans aria-label="First" effect="spring" />
        <Plans aria-label="Second" effect="spring" />
      </>,
    )
    expect(container.querySelectorAll(INDICATOR)).toHaveLength(2)
  })
})
