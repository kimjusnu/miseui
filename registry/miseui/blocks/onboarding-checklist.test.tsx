import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OnboardingChecklist, type OnboardingChecklistVariant } from "./onboarding-checklist"
import { nextOpenScreen } from "./onboarding-checklist-dialog"
import { doneStepIds, firstOpenStep } from "./onboarding-checklist-state"

const root = (container: HTMLElement) => container.querySelector('[data-slot="onboarding-checklist"]')
const STEPS = [
  { id: "a", title: "First", description: "Quiet a.", actionLabel: "Do a" },
  { id: "b", title: "Second", description: "Quiet b.", actionLabel: "Do b" },
  { id: "c", title: "Third", description: "Quiet c.", actionLabel: "Do c" },
]

describe("OnboardingChecklist helpers", () => {
  it("counts only ids that are real steps", () => {
    expect(doneStepIds(STEPS, ["a", "gone"])).toEqual(["a"])
    expect(firstOpenStep(STEPS, ["a"])?.id).toBe("b")
    expect(firstOpenStep(STEPS, ["a", "b", "c"])).toBeUndefined()
  })

  it("finds the next screen past what is done, ending on the closing one", () => {
    expect(nextOpenScreen(0, STEPS, [])).toBe(1)
    expect(nextOpenScreen(0, STEPS, ["a"])).toBe(2)
    expect(nextOpenScreen(1, STEPS, ["b"])).toBe(3)
    expect(nextOpenScreen(3, STEPS, [])).toBe(4)
  })
})

describe("OnboardingChecklist variants", () => {
  it("renders panel without the prop and for an unknown value, including constructor", () => {
    const { container, rerender } = render(<OnboardingChecklist steps={STEPS} />)
    expect(root(container)).toHaveAttribute("data-variant", "panel")
    rerender(<OnboardingChecklist steps={STEPS} variant={"constructor" as OnboardingChecklistVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "panel")
    rerender(<OnboardingChecklist steps={STEPS} variant={"nonsense" as OnboardingChecklistVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "panel")
  })

  it("differs in structure, not only in colour", () => {
    const { container, rerender } = render(<OnboardingChecklist steps={STEPS} />)
    expect(screen.getAllByRole("checkbox")).toHaveLength(3)
    expect(container.querySelector('[data-slot="onboarding-banner"]')).toBeNull()
    rerender(<OnboardingChecklist steps={STEPS} variant="banner" />)
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="onboarding-banner"]')).not.toBeNull()
    rerender(<OnboardingChecklist steps={STEPS} variant="dialog" />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("does not put variant props on the DOM node", () => {
    const { container } = render(<OnboardingChecklist steps={STEPS} onDismiss={() => undefined} defaultOpen />)
    expect(root(container)).not.toHaveAttribute("defaultOpen")
    expect(root(container)).not.toHaveAttribute("onDismiss")
    expect(root(container)).not.toHaveAttribute("steps")
  })
})

describe("panel", () => {
  it("starts at zero when nothing is done", () => {
    render(<OnboardingChecklist steps={STEPS} />)
    expect(screen.getByText("0 of 3 done")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "0")
  })

  it("starts at the true count and ignores ids that are not steps", () => {
    render(<OnboardingChecklist steps={STEPS} defaultCompleted={["a", "not-a-step"]} />)
    expect(screen.getByText("1 of 3 done")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getByRole("checkbox", { name: "First" })).toBeChecked()
  })

  it("opens only the next step, and any other on request", async () => {
    render(<OnboardingChecklist steps={STEPS} />)
    expect(screen.getByRole("button", { name: "Do a" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Do b" })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Second" }))
    expect(screen.getByRole("button", { name: "Do b" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Do a" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true")
  })

  it("moves on and hands focus to the next step when one is finished", async () => {
    const onStep = vi.fn()
    render(<OnboardingChecklist steps={STEPS} onStep={onStep} />)
    await userEvent.click(screen.getByRole("button", { name: "Do a" }))
    expect(onStep).toHaveBeenCalledExactlyOnceWith("a")
    expect(await screen.findByText("1 of 3 done")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Do b" })).toHaveFocus())
  })

  it("shows the failure beside the step and keeps it open", async () => {
    render(<OnboardingChecklist steps={STEPS} onStep={() => Promise.reject(new Error("The bank did not answer."))} />)
    await userEvent.click(screen.getByRole("button", { name: "Do a" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("The bank did not answer.")
    expect(screen.getByText("0 of 3 done")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Do a" })).toBeInTheDocument()
  })

  it("lets the owner decide when a step is done", async () => {
    const onStep = vi.fn()
    render(<OnboardingChecklist steps={STEPS} completed={[]} onStep={onStep} />)
    await userEvent.click(screen.getByRole("button", { name: "Do a" }))
    expect(onStep).toHaveBeenCalledWith("a")
    expect(screen.getByText("0 of 3 done")).toBeInTheDocument()
  })

  it("can be ticked by hand and offers the way forward only at the end", async () => {
    const onFinish = vi.fn()
    render(<OnboardingChecklist steps={STEPS} defaultCompleted={["a", "b"]} onFinish={onFinish} />)
    expect(screen.queryByRole("button", { name: "Open Paperline" })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: "Third" }))
    await userEvent.click(screen.getByRole("button", { name: "Open Paperline" }))
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it("does not claim progress with no steps at all", () => {
    render(<OnboardingChecklist steps={[]} />)
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    expect(screen.getByText("That is everything.")).toBeInTheDocument()
  })
})

describe("banner", () => {
  it("names the next step and steps through them", async () => {
    render(<OnboardingChecklist steps={STEPS} variant="banner" defaultCompleted={["a"]} />)
    expect(screen.getByText("1 of 3 done.")).toBeInTheDocument()
    expect(screen.getByText("Next: Second")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Do b" }))
    expect(await screen.findByText("Next: Third")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "2")
  })

  it("hides without taking the page with it, and keeps focus on the block", async () => {
    const onDismiss = vi.fn()
    const { container } = render(
      <OnboardingChecklist steps={STEPS} variant="banner" onDismiss={onDismiss}>
        <p>The page</p>
      </OnboardingChecklist>,
    )
    await userEvent.click(screen.getByRole("button", { name: "Hide setup for now" }))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-slot="onboarding-banner"]')).toBeNull()
    expect(screen.getByText("The page")).toBeInTheDocument()
    expect(root(container)).toHaveFocus()
  })

  it("offers the finish once everything is done", async () => {
    const onFinish = vi.fn()
    render(<OnboardingChecklist steps={STEPS} variant="banner" defaultCompleted={["a", "b", "c"]} onFinish={onFinish} />)
    await userEvent.click(screen.getByRole("button", { name: "Open Paperline" }))
    expect(onFinish).toHaveBeenCalledOnce()
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })
})

describe("dialog", () => {
  it("greets on arrival, then shows one step at a time", async () => {
    render(<OnboardingChecklist steps={STEPS} variant="dialog" defaultCompleted={["a"]} />)
    expect(screen.getByRole("dialog")).toHaveTextContent("Finish setting up Paperline.")
    await userEvent.click(screen.getByRole("button", { name: "Start" }))
    expect(screen.getByRole("dialog")).toHaveTextContent("Second")
    expect(screen.getByRole("heading", { name: /Second/ })).toHaveFocus()
    await userEvent.click(screen.getByRole("button", { name: "Do b" }))
    expect(await screen.findByRole("heading", { name: /Third/ })).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "2")
  })

  it("is honest on the closing screen when something was skipped", async () => {
    render(<OnboardingChecklist steps={STEPS} variant="dialog" defaultCompleted={["a", "b"]} />)
    await userEvent.click(screen.getByRole("button", { name: "Start" }))
    await userEvent.click(screen.getByRole("button", { name: "Not now" }))
    expect(screen.getByRole("heading", { name: /2 of 3 done/ })).toBeInTheDocument()
  })

  it("closes on Escape, returns focus to the Setup button, and can be reopened", async () => {
    const onOpenChange = vi.fn()
    render(<OnboardingChecklist steps={STEPS} variant="dialog" onOpenChange={onOpenChange} />)
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    const setup = screen.getByRole("button", { name: "Setup, 0 of 3 done" })
    await waitFor(() => expect(setup).toHaveFocus())
    await userEvent.click(setup)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("stays closed when told to", () => {
    render(<OnboardingChecklist steps={STEPS} variant="dialog" defaultOpen={false} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
