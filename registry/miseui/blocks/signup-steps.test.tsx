import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SignupSteps, type SignupStep } from "./signup-steps"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
  // jsdom has no ResizeObserver, and Radix's checkbox measures itself with one.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
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
  changeListeners.forEach((listener) => listener())
}

afterEach(() => setReducedMotion(false))

const STEPS: readonly SignupStep[] = [
  { id: "start", label: "Started", credited: true },
  { id: "email", label: "Email", question: "What is your email?", fieldLabel: "Email" },
  { id: "team", label: "Team", question: "What is your team called?", fieldLabel: "Team name", consent: "I agree to the terms." },
]

const progress = () => screen.getByRole("progressbar", { name: "Sign-up progress" })
const continueButton = () => screen.getByRole("button", { name: "Continue" })
const finishButton = () => screen.getByRole("button", { name: "Create workspace" })

async function reachLastStep() {
  await userEvent.type(screen.getByLabelText("Email"), "maya@northgate.studio{Enter}")
}

describe("SignupSteps", () => {
  it("opens with the first step already credited", () => {
    render(<SignupSteps steps={STEPS} />)
    expect(progress()).toHaveAttribute("aria-valuenow", "33")
    expect(progress()).toHaveAttribute("aria-valuetext", "Step 2 of 3")
    expect(screen.getByLabelText("Done")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "What is your email?" })).toBeInTheDocument()
  })

  it("holds on an invalid step, says why inline, and clears the message on edit", async () => {
    render(<SignupSteps steps={STEPS} />)
    await userEvent.click(continueButton())
    expect(screen.getByRole("heading", { name: "What is your email?" })).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Fill this in to continue.")
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true")
    await userEvent.type(screen.getByLabelText("Email"), "m")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("applies a step's own validation", async () => {
    render(<SignupSteps />)
    await userEvent.type(screen.getByLabelText("Work email"), "not-an-email{Enter}")
    expect(screen.getByRole("alert")).toHaveTextContent(/Enter an email address/)
    expect(progress()).toHaveAttribute("aria-valuenow", "33")
  })

  it("advances on Enter, moves the bar and focuses the next field", async () => {
    render(<SignupSteps steps={STEPS} />)
    await reachLastStep()
    expect(screen.getByRole("heading", { name: "What is your team called?" })).toBeInTheDocument()
    expect(progress()).toHaveAttribute("aria-valuenow", "67")
    expect(screen.getByLabelText("Team name")).toHaveFocus()
  })

  it("does not take focus on first paint", () => {
    render(<SignupSteps steps={STEPS} />)
    expect(screen.getByLabelText("Email")).not.toHaveFocus()
  })

  it("goes back without losing the answer, and has no Back on the first question", async () => {
    render(<SignupSteps steps={STEPS} />)
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
    await reachLastStep()
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByLabelText("Email")).toHaveValue("maya@northgate.studio")
    expect(progress()).toHaveAttribute("aria-valuenow", "33")
  })

  it("never starts with consent ticked, and will not finish until it is", async () => {
    const onComplete = vi.fn()
    render(<SignupSteps steps={STEPS} onComplete={onComplete} />)
    await reachLastStep()
    await userEvent.type(screen.getByLabelText("Team name"), "Northgate")
    const consent = screen.getByRole("checkbox", { name: "I agree to the terms." })
    expect(consent).not.toBeChecked()
    await userEvent.click(finishButton())
    expect(onComplete).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Tick the box to continue.")
    await userEvent.click(consent)
    await userEvent.click(finishButton())
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({ email: "maya@northgate.studio", team: "Northgate" })
  })

  it("ends on a confirmation with the bar full and focus on the result", async () => {
    render(<SignupSteps steps={STEPS} />)
    await reachLastStep()
    await userEvent.type(screen.getByLabelText("Team name"), "Northgate")
    await userEvent.click(screen.getByRole("checkbox"))
    await userEvent.click(finishButton())
    const heading = await screen.findByRole("heading", { name: /^Check your inbox\./ })
    expect(heading).toHaveFocus()
    expect(screen.getByText("We sent a sign-in link to maya@northgate.studio.")).toBeInTheDocument()
    expect(progress()).toHaveAttribute("aria-valuenow", "100")
  })

  it("shows a loading state while completing, and stays on the step if it fails", async () => {
    let fail: (reason: Error) => void = () => undefined
    const onComplete = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)))
    render(<SignupSteps steps={STEPS} onComplete={onComplete} />)
    await reachLastStep()
    await userEvent.type(screen.getByLabelText("Team name"), "Northgate")
    await userEvent.click(screen.getByRole("checkbox"))
    await userEvent.click(finishButton())
    expect(finishButton()).toBeDisabled()
    fail(new Error("That workspace name is taken."))
    expect(await screen.findByRole("alert")).toHaveTextContent("That workspace name is taken.")
    expect(finishButton()).toBeEnabled()
    expect(screen.getByLabelText("Team name")).toHaveValue("Northgate")
  })

  it("sets a step's aside in the muted tone, inside the question's heading", () => {
    render(<SignupSteps />)
    const aside = screen.getByText("This is where your sign-in link goes.")
    expect(aside).toHaveClass("text-muted-foreground")
    expect(aside.closest("h2")).toHaveTextContent(/^What is your work email\?/)
  })

  it("moves the bar without a spring under reduced motion", () => {
    setReducedMotion(true)
    render(<SignupSteps steps={STEPS} />)
    expect(screen.getByTestId("progress-fill")).toHaveAttribute("data-reduced", "true")
  })

  it("renders nothing when there are no questions, and answers to its container", () => {
    const { container, rerender } = render(<SignupSteps steps={[{ id: "start", label: "Started", credited: true }]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<SignupSteps steps={STEPS} />)
    expect(container.querySelector('[data-slot="signup-steps"]')).toHaveClass("@container")
  })
})
