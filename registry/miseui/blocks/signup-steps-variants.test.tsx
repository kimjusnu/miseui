import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SignupSteps, type SignupStep, type SignupStepsVariant } from "./signup-steps"

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
})

afterAll(() => vi.unstubAllGlobals())

/** Tags and classes, not ids: useId differs between two renders of the same markup. */
function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="signup-steps"]') as HTMLElement
const progress = () => screen.getByRole("progressbar", { name: "Sign-up progress" })
const continueButton = () => screen.getByRole("button", { name: "Continue" })
const finishButton = () => screen.getByRole("button", { name: "Create workspace" })
const rail = () => within(screen.getByTestId("signup-rail"))

const STEPS: readonly SignupStep[] = [
  { id: "start", label: "Started", credited: true },
  { id: "email", label: "Email", question: "What is your email?", fieldLabel: "Email" },
  { id: "team", label: "Team", question: "What is your team called?", fieldLabel: "Team name", consent: "I agree to the terms." },
]

const LONG_STEPS: readonly SignupStep[] = [
  { id: "start", label: "Started", credited: true },
  { id: "email", label: "Email", question: "What is your email?", aside: "For your sign-in link.", fieldLabel: "Email" },
  { id: "secret", label: "Password", question: "Choose a password.", aside: "At least twelve letters.", fieldLabel: "Password", type: "password" },
  { id: "team", label: "Team", question: "What is your team called?", aside: "Your team sees this.", fieldLabel: "Team name" },
]

async function answerEmail() {
  await userEvent.type(screen.getByLabelText("Email"), "maya@northgate.studio{Enter}")
}

describe("SignupSteps variants", () => {
  it("renders the card with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<SignupSteps steps={STEPS} />)
    expect(root(plain)).toHaveAttribute("data-variant", "card")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<SignupSteps variant={unknown as SignupStepsVariant} steps={STEPS} />)
      expect(root(container)).toHaveAttribute("data-variant", "card")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants", () => {
    const { container: card } = render(<SignupSteps variant="card" steps={STEPS} />)
    const { container: asRail } = render(<SignupSteps variant="rail" steps={STEPS} />)
    const { container: conversation } = render(<SignupSteps variant="conversation" steps={STEPS} />)
    expect(asRail.querySelector("aside")).not.toBeNull()
    expect(card.querySelector("aside")).toBeNull()
    expect(conversation.querySelector("aside")).toBeNull()
    expect(asRail.querySelector('[data-slot="steps"]')).not.toBeNull()
    expect(card.querySelector('[data-slot="steps"]')).toBeNull()
    expect(conversation.querySelector('[data-slot="kbd"]')).not.toBeNull()
    expect(card.querySelector('[data-slot="kbd"]')).toBeNull()
  })

  it("renders nothing with no questions on every variant", () => {
    for (const variant of ["rail", "conversation"] as const) {
      const { container, unmount } = render(<SignupSteps variant={variant} steps={[{ id: "start", label: "Started", credited: true }]} />)
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })
})

describe("SignupSteps rail", () => {
  it("says how much is left and what the steps ahead are for, and the count falls with each answer", async () => {
    render(<SignupSteps variant="rail" steps={LONG_STEPS} />)
    expect(rail().getByText(/3 questions left\./)).toBeInTheDocument()
    expect(rail().getByText("At least twelve letters.")).toBeInTheDocument()
    expect(rail().getByText("Your team sees this.")).toBeInTheDocument()
    expect(rail().queryByText("For your sign-in link.")).not.toBeInTheDocument()
    await answerEmail()
    expect(rail().getByText(/2 questions left\./)).toBeInTheDocument()
    expect(rail().queryByText("At least twelve letters.")).not.toBeInTheDocument()
  })

  it("starts with the credited step done and the first question current", () => {
    render(<SignupSteps variant="rail" steps={LONG_STEPS} />)
    const current = rail().getByRole("navigation", { name: "Sign-up steps" }).querySelector('[aria-current="step"]')
    expect(current).toHaveTextContent("Email")
    expect(rail().getByText("Started")).toBeInTheDocument()
  })

  it("goes back to an answered question from the rail without losing it", async () => {
    render(<SignupSteps variant="rail" steps={LONG_STEPS} />)
    await answerEmail()
    expect(screen.getByRole("heading", { name: /Choose a password/ })).toBeInTheDocument()
    await userEvent.click(rail().getByRole("button", { name: /Email/ }))
    expect(screen.getByRole("heading", { name: /What is your email/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toHaveValue("maya@northgate.studio")
    expect(screen.getByLabelText("Email")).toHaveFocus()
  })

  it("will not skip ahead: a step not reached is not a link", () => {
    render(<SignupSteps variant="rail" steps={LONG_STEPS} />)
    expect(rail().queryByRole("button", { name: /Team/ })).not.toBeInTheDocument()
    expect(rail().queryByRole("button", { name: /Password/ })).not.toBeInTheDocument()
  })

  it("folds to a compact bar while narrow", () => {
    render(<SignupSteps variant="rail" steps={LONG_STEPS} />)
    expect(screen.getByTestId("signup-rail")).toHaveClass("hidden", "@3xl:flex")
    expect(screen.getByTestId("signup-rail-compact")).toHaveClass("@3xl:hidden")
    expect(within(screen.getByTestId("signup-rail-compact")).getByText("Step 2 of 4")).toBeInTheDocument()
  })

  it("ends on the confirmation with nothing left and no way back in the rail", async () => {
    render(<SignupSteps variant="rail" steps={STEPS} />)
    await answerEmail()
    await userEvent.type(screen.getByLabelText("Team name"), "Northgate")
    await userEvent.click(screen.getByRole("checkbox"))
    await userEvent.click(finishButton())
    expect(await screen.findByRole("heading", { name: /^Check your inbox\./ })).toHaveFocus()
    expect(rail().getByText("Nothing left.")).toBeInTheDocument()
    expect(rail().queryByRole("button")).not.toBeInTheDocument()
  })
})

describe("SignupSteps conversation", () => {
  it("shows one large question, then moves forward on Enter and focuses the next field", async () => {
    render(<SignupSteps variant="conversation" steps={LONG_STEPS} />)
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1)
    expect(screen.getAllByRole("textbox")).toHaveLength(1)
    expect(screen.getByLabelText("Email")).not.toHaveFocus()
    await answerEmail()
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1)
    expect(screen.getByRole("heading", { name: /Choose a password/ })).toBeInTheDocument()
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toHaveFocus()
  })

  it("moves back with the answer kept, and has no Back on the first question", async () => {
    render(<SignupSteps variant="conversation" steps={LONG_STEPS} />)
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
    await answerEmail()
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByLabelText("Email")).toHaveValue("maya@northgate.studio")
    expect(screen.getByLabelText("Email")).toHaveFocus()
  })

  it("reads the last answer back, but never a password", async () => {
    render(<SignupSteps variant="conversation" steps={LONG_STEPS} />)
    await answerEmail()
    expect(screen.getByText("Got it: maya@northgate.studio")).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText("Password"), "correct horse{Enter}")
    expect(screen.getByRole("heading", { name: /What is your team called/ })).toBeInTheDocument()
    expect(screen.queryByText(/Got it/)).not.toBeInTheDocument()
    expect(screen.queryByText(/correct horse/)).not.toBeInTheDocument()
  })

  it("moves the bar with each answer", async () => {
    render(<SignupSteps variant="conversation" steps={STEPS} />)
    expect(progress()).toHaveAttribute("aria-valuenow", "33")
    await answerEmail()
    expect(progress()).toHaveAttribute("aria-valuenow", "67")
  })

  it("holds an invalid answer and says why", async () => {
    render(<SignupSteps variant="conversation" steps={STEPS} />)
    await userEvent.click(continueButton())
    expect(screen.getByRole("alert")).toHaveTextContent("Fill this in to continue.")
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Fill this in to continue.")
  })

  it("will not finish without consent, then ends on the confirmation with a full bar", async () => {
    const onComplete = vi.fn()
    render(<SignupSteps variant="conversation" steps={STEPS} onComplete={onComplete} />)
    await answerEmail()
    await userEvent.type(screen.getByLabelText("Team name"), "Northgate")
    expect(screen.getByRole("checkbox")).not.toBeChecked()
    await userEvent.click(finishButton())
    expect(onComplete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("checkbox"))
    await userEvent.click(finishButton())
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({ email: "maya@northgate.studio", team: "Northgate" })
    expect(await screen.findByRole("heading", { name: /^Check your inbox\./ })).toHaveFocus()
    expect(progress()).toHaveAttribute("aria-valuenow", "100")
  })
})
