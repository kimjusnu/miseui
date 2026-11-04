import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm, type LoginFormVariant } from "./login-form"

/** Tags and classes, not ids: useId differs between two renders of the same markup. */
function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="login-form"]') as HTMLElement
const email = () => screen.getByLabelText("Email")
const password = () => screen.getByLabelText("Password")
const submit = () => screen.getByRole("button", { name: /^log(ging)? in$/i })
const sendButton = () => screen.getByRole("button", { name: /email me a link|sending the link/i })

async function sendTo(address = "maya@northgate.studio") {
  await userEvent.type(email(), `${address}{Enter}`)
}

describe("LoginForm variants", () => {
  it("renders the split layout with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<LoginForm />)
    expect(root(plain)).toHaveAttribute("data-variant", "split")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<LoginForm variant={unknown as LoginFormVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "split")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants", () => {
    const { container: split } = render(<LoginForm variant="split" />)
    const { container: centered } = render(<LoginForm variant="centered" />)
    const { container: magic } = render(<LoginForm variant="magic" />)
    expect(split.querySelector("aside")).not.toBeNull()
    expect(centered.querySelector("aside")).toBeNull()
    expect(magic.querySelector("aside")).toBeNull()
    expect(centered.querySelector('input[type="password"]')).not.toBeNull()
    expect(magic.querySelector('input[type="password"]')).toBeNull()
  })

  it("keeps variant-only props off the DOM", () => {
    const { container, rerender } = render(<LoginForm variant="centered" sentNote="x" resendAfterSeconds={1} />)
    expect(root(container)).not.toHaveAttribute("sentnote")
    rerender(<LoginForm variant="magic" visual={null} tagline="x" forgotPasswordHref="/f" />)
    expect(root(container)).not.toHaveAttribute("tagline")
    expect(root(container)).not.toHaveAttribute("forgotpasswordhref")
  })
})

describe("LoginForm centered", () => {
  it("has no brand panel, and keeps every behaviour of the password form", async () => {
    const onSubmit = vi.fn()
    render(<LoginForm variant="centered" onSubmit={onSubmit} tagline="Close the month before lunch." />)
    expect(screen.queryByText("Close the month before lunch.")).not.toBeInTheDocument()
    expect(screen.queryByTestId("login-visual")).not.toBeInTheDocument()
    await userEvent.type(email(), " maya@northgate.studio ")
    await userEvent.type(password(), "correct horse{Enter}")
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ email: "maya@northgate.studio", password: "correct horse" })
  })

  it("stops on an empty form and moves focus to the first problem", async () => {
    render(<LoginForm variant="centered" onSubmit={vi.fn()} />)
    await userEvent.click(submit())
    expect(screen.getByText("Enter your email address.")).toHaveAttribute("role", "alert")
    expect(email()).toHaveFocus()
  })

  it("keeps social sign-in and the sign-up link, which sits outside the card", async () => {
    const onSocial = vi.fn()
    render(<LoginForm variant="centered" onSocial={onSocial} signUpHref="/join" />)
    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }))
    expect(onSocial).toHaveBeenCalledExactlyOnceWith("google")
    const link = screen.getByRole("link", { name: "Create an account" })
    expect(link).toHaveAttribute("href", "/join")
    expect(email().closest(".rounded-2xl")).not.toContainElement(link)
  })

  it("makes its controls 40 px on touch without changing the shared fields", () => {
    render(<LoginForm variant="centered" />)
    expect(email().closest(".rounded-2xl")).toHaveClass("pointer-coarse:[&_[data-slot=button]]:h-10", "pointer-coarse:[&_input]:h-10")
  })
})

describe("LoginForm magic", () => {
  it("asks for an email and nothing else", () => {
    render(<LoginForm variant="magic" onSendLink={vi.fn()} />)
    expect(email()).toBeInTheDocument()
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /continue with/i })).not.toBeInTheDocument()
  })

  it("holds an empty or broken address and says why", async () => {
    const onSendLink = vi.fn()
    render(<LoginForm variant="magic" onSendLink={onSendLink} />)
    await userEvent.click(sendButton())
    expect(onSendLink).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your email address.")
    expect(email()).toHaveFocus()
    await userEvent.type(email(), "maya.northgate{Enter}")
    expect(screen.getByRole("alert")).toHaveTextContent(/looks incomplete/)
    expect(email()).toHaveAttribute("aria-invalid", "true")
  })

  it("shows the sending state, then a check-your-inbox screen with the address and focus on it", async () => {
    let finish: () => void = () => undefined
    const onSendLink = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(<LoginForm variant="magic" onSendLink={onSendLink} />)
    await sendTo(" maya@northgate.studio ")
    expect(onSendLink).toHaveBeenCalledExactlyOnceWith("maya@northgate.studio")
    expect(sendButton()).toBeDisabled()
    expect(sendButton()).toHaveTextContent("Sending the link")
    finish()
    const heading = await screen.findByRole("heading", { name: /^Check your inbox\./ })
    // Focus moves in an effect, which can still be pending when the heading first appears.
    await waitFor(() => expect(heading).toHaveFocus())
    expect(heading).toHaveTextContent("We sent a link to maya@northgate.studio.")
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument()
  })

  it("stays on the form and shows a failure inline, with the address kept", async () => {
    const onSendLink = vi.fn(() => Promise.reject(new Error("That address is not on the invite list.")))
    render(<LoginForm variant="magic" onSendLink={onSendLink} />)
    await sendTo()
    expect(await screen.findByRole("alert")).toHaveTextContent("That address is not on the invite list.")
    expect(email()).toHaveValue("maya@northgate.studio")
    expect(email()).toHaveAccessibleDescription("That address is not on the invite list.")
    expect(sendButton()).toBeEnabled()
  })

  it("holds Send again through the countdown, then sends again and confirms it", async () => {
    const onSendLink = vi.fn()
    render(<LoginForm variant="magic" onSendLink={onSendLink} resendAfterSeconds={1} />)
    await sendTo()
    expect(await screen.findByRole("button", { name: "Send again in 1s" })).toBeDisabled()
    const again = await screen.findByRole("button", { name: "Send again" }, { timeout: 2500 })
    await userEvent.click(again)
    expect(onSendLink).toHaveBeenCalledTimes(2)
    expect(await screen.findByText("Another link is on its way.")).toHaveAttribute("role", "status")
    expect(await screen.findByRole("button", { name: "Send again in 1s" })).toBeDisabled()
  })

  it("shows a failed resend on the inbox screen", async () => {
    const onSendLink = vi.fn<(address: string) => Promise<void>>().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("Mail is down."))
    render(<LoginForm variant="magic" onSendLink={onSendLink} resendAfterSeconds={0} />)
    await sendTo()
    await userEvent.click(await screen.findByRole("button", { name: "Send again" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Mail is down.")
    expect(screen.queryByText("Another link is on its way.")).not.toBeInTheDocument()
  })

  it("goes back to the form with the address kept and focus in the field", async () => {
    render(<LoginForm variant="magic" onSendLink={vi.fn()} />)
    await sendTo()
    await userEvent.click(await screen.findByRole("button", { name: "Use a different email" }))
    expect(email()).toHaveValue("maya@northgate.studio")
    expect(email()).toHaveFocus()
  })

  it("does not take focus on first paint, and forces the sending state when told to", () => {
    render(<LoginForm variant="magic" onSendLink={vi.fn()} pending error="This account is locked." />)
    expect(email()).not.toHaveFocus()
    expect(sendButton()).toBeDisabled()
    expect(screen.getByRole("alert")).toHaveTextContent("This account is locked.")
  })

  it("says what the link does on the inbox screen, in your words", async () => {
    render(<LoginForm variant="magic" onSendLink={vi.fn()} sentNote="It works for an hour." />)
    await sendTo()
    expect(await screen.findByText("It works for an hour.")).toBeInTheDocument()
  })

  it("links to sign-up only when given somewhere to go", () => {
    const { rerender } = render(<LoginForm variant="magic" onSendLink={vi.fn()} />)
    expect(screen.queryByRole("link", { name: "Create an account" })).not.toBeInTheDocument()
    expect(screen.getByText(/same link creates your account/)).toBeInTheDocument()
    rerender(<LoginForm variant="magic" onSendLink={vi.fn()} signUpHref="/join" />)
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/join")
  })
})
