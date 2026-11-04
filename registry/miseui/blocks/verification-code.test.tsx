import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VerificationCode, type VerificationCodeProps, type VerificationCodeVariant } from "./verification-code"

const root = (container: HTMLElement) => container.querySelector('[data-slot="verification-code"]')
const field = () => screen.getByRole("textbox", { name: /verification code|enter your code/i })
const instant: Pick<VerificationCodeProps, "onVerify" | "onResend"> = { onVerify: () => undefined, onResend: () => undefined }

async function typeCode(code: string) {
  await userEvent.click(field())
  await userEvent.keyboard(code)
}

describe("VerificationCode variants", () => {
  it("renders card without the prop and for an unknown value, including constructor", () => {
    const { container, rerender } = render(<VerificationCode {...instant} />)
    expect(root(container)).toHaveAttribute("data-variant", "card")
    rerender(<VerificationCode {...instant} variant={"constructor" as VerificationCodeVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "card")
    rerender(<VerificationCode {...instant} variant={"nonsense" as VerificationCodeVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "card")
  })

  it("differs in structure, not only in colour", () => {
    const { container, rerender } = render(<VerificationCode {...instant} />)
    expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument()
    expect(screen.queryByTestId("mail-fragment")).not.toBeInTheDocument()
    rerender(<VerificationCode {...instant} variant="split" />)
    expect(root(container)).toHaveAttribute("data-variant", "split")
    expect(screen.getByTestId("mail-fragment")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("What to look for")
    rerender(<VerificationCode {...instant} variant="inline" />)
    expect(root(container)).toHaveAttribute("data-variant", "inline")
    expect(screen.queryByRole("button", { name: "Verify" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("never says whether the address has an account", () => {
    render(<VerificationCode {...instant} destination="someone@example.com" />)
    expect(screen.getByRole("heading")).toHaveTextContent("If someone@example.com has an account")
  })

  it("does not put its props on the DOM node", () => {
    const { container } = render(<VerificationCode {...instant} variant="split" tips={[]} />)
    expect(root(container)).not.toHaveAttribute("tips")
    expect(root(container)).not.toHaveAttribute("destination")
  })
})

describe("wrong code, then right code", () => {
  it("announces the error, clears the digits and refocuses, then succeeds", async () => {
    const onVerify = vi.fn((code: string) => (code === "246810" ? Promise.resolve() : Promise.reject(new Error("That code did not work."))))
    const onContinue = vi.fn()
    render(<VerificationCode onVerify={onVerify} onResend={() => undefined} onContinue={onContinue} />)
    await typeCode("111111")
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("That code did not work.")
    expect(field()).toHaveValue("")
    expect(field()).toHaveAttribute("aria-invalid", "true")
    expect(field()).toHaveAttribute("aria-describedby", alert.id)
    await waitFor(() => expect(field()).toHaveFocus())

    await userEvent.keyboard("2")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    await userEvent.keyboard("46810")
    expect(onVerify).toHaveBeenLastCalledWith("246810")
    const heading = await screen.findByRole("heading", { name: /Code accepted/ })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it("asks for the rest instead of checking a short code", async () => {
    const onVerify = vi.fn()
    render(<VerificationCode onVerify={onVerify} onResend={() => undefined} />)
    await typeCode("123")
    await userEvent.click(screen.getByRole("button", { name: "Verify" }))
    expect(onVerify).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Enter all 6 digits.")
  })

  it("cannot be checked twice while one check runs, and says it is checking", async () => {
    let finish = () => {}
    const onVerify = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    render(<VerificationCode onVerify={onVerify} onResend={() => undefined} />)
    await typeCode("123456")
    const checking = screen.getByRole("button", { name: "Checking the code" })
    expect(checking).toBeDisabled()
    expect(field()).toBeDisabled()
    expect(onVerify).toHaveBeenCalledOnce()
    await act(async () => finish())
    expect(await screen.findByRole("heading", { name: /Code accepted/ })).toBeInTheDocument()
  })

  it("shows an error the owner already knows about", () => {
    render(<VerificationCode {...instant} error="Too many tries. Send a new code." />)
    expect(screen.getByRole("alert")).toHaveTextContent("Too many tries")
  })
})

describe("resend countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("counts down, then sends once and starts over", async () => {
    const onResend = vi.fn()
    render(<VerificationCode onVerify={() => undefined} onResend={onResend} resendAfterSeconds={3} />)
    const button = screen.getByRole("button", { name: "Send a new code in 3s" })
    expect(button).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(button)
    expect(onResend).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole("button", { name: "Send a new code in 2s" })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    const ready = screen.getByRole("button", { name: "Send a new code" })
    expect(ready).not.toHaveAttribute("aria-disabled")

    await act(async () => {
      fireEvent.click(ready)
    })
    expect(onResend).toHaveBeenCalledOnce()
    expect(screen.getByRole("status")).toHaveTextContent("A new code is on its way")
    expect(screen.getByRole("button", { name: "Send a new code in 3s" })).toBe(ready)
  })

  it("keeps the wait honest when a tab was throttled, because it reads the clock", () => {
    render(<VerificationCode {...instant} resendAfterSeconds={30} />)
    act(() => {
      vi.setSystemTime(Date.now() + 20_000)
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole("button", { name: /Send a new code in (9|10)s/ })).toBeInTheDocument()
  })

  it("announces a failed resend and lets it be tried again", async () => {
    const onResend = vi.fn().mockRejectedValueOnce(new Error("Could not send a new code.")).mockResolvedValueOnce(undefined)
    render(<VerificationCode onVerify={() => undefined} onResend={onResend} resendAfterSeconds={0} />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send a new code" }))
    })
    expect(screen.getByRole("alert")).toHaveTextContent("Could not send a new code.")
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send a new code" }))
    })
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(onResend).toHaveBeenCalledTimes(2)
  })

  it("clears a wrong code once a new one is sent", async () => {
    render(<VerificationCode onVerify={() => undefined} onResend={() => undefined} resendAfterSeconds={0} error={undefined} />)
    fireEvent.change(field(), { target: { value: "12" } })
    expect(field()).toHaveValue("12")
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send a new code" }))
    })
    expect(field()).toHaveValue("")
  })
})

describe("split", () => {
  it("shows what to look for without the code itself", () => {
    render(<VerificationCode {...instant} variant="split" sender="Harbour Books" subject="Your sign-in code" tips={["Look in spam."]} />)
    const fragment = screen.getByTestId("mail-fragment")
    expect(fragment).toHaveTextContent("Harbour Books")
    expect(fragment).toHaveTextContent("Your sign-in code")
    expect(fragment).toHaveAttribute("aria-hidden", "true")
    expect(fragment.textContent).not.toMatch(/\d/)
    expect(screen.getByText("Look in spam.")).toBeInTheDocument()
  })

  it("keeps the help beside the success state", async () => {
    render(<VerificationCode {...instant} variant="split" />)
    await typeCode("123456")
    expect(await screen.findByRole("heading", { name: /Code accepted/ })).toBeInTheDocument()
    expect(screen.getByTestId("mail-fragment")).toBeInTheDocument()
  })
})

describe("inline", () => {
  it("submits on the last digit and turns into a single line", async () => {
    const onVerify = vi.fn()
    render(<VerificationCode {...instant} onVerify={onVerify} variant="inline" />)
    await typeCode("123456")
    expect(onVerify).toHaveBeenCalledWith("123456")
    expect(await screen.findByText("Code accepted.")).toBeInTheDocument()
    expect(screen.getByTestId("verified-mark")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("announces a wrong code there too", async () => {
    render(<VerificationCode onVerify={() => Promise.reject(new Error("That code did not work."))} onResend={() => undefined} variant="inline" />)
    await typeCode("123456")
    expect(await screen.findByRole("alert")).toHaveTextContent("That code did not work.")
    await waitFor(() => expect(field()).toHaveFocus())
  })
})
