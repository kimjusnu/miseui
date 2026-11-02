import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "./login-form"

const email = () => screen.getByLabelText("Email")
const password = () => screen.getByLabelText("Password")
const submit = () => screen.getByRole("button", { name: /^log(ging)? in$/i })

async function fillIn() {
  await userEvent.type(email(), "maya@northgate.studio")
  await userEvent.type(password(), "correct horse")
}

describe("LoginForm", () => {
  it("hands over trimmed values when the fields are valid", async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.type(email(), " maya@northgate.studio ")
    await userEvent.type(password(), "correct horse{Enter}")
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ email: "maya@northgate.studio", password: "correct horse" })
  })

  it("stops on an empty form, says why inline and moves focus to the first problem", async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.click(submit())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText("Enter your email address.")).toHaveAttribute("role", "alert")
    expect(email()).toHaveAttribute("aria-invalid", "true")
    expect(email()).toHaveAccessibleDescription("Enter your email address.")
    expect(email()).toHaveFocus()
  })

  it("clears a field's error as soon as it is edited", async () => {
    render(<LoginForm onSubmit={vi.fn()} />)
    await userEvent.click(submit())
    await userEvent.type(email(), "m")
    expect(screen.queryByText("Enter your email address.")).not.toBeInTheDocument()
    expect(email()).not.toHaveAttribute("aria-invalid")
  })

  it("rejects an email with no @", async () => {
    render(<LoginForm onSubmit={vi.fn()} />)
    await userEvent.type(email(), "maya.northgate")
    await userEvent.type(password(), "correct horse")
    await userEvent.click(submit())
    expect(screen.getByRole("alert")).toHaveTextContent(/looks incomplete/)
  })

  it("toggles the password between hidden and shown, and keeps what was typed", async () => {
    render(<LoginForm onSubmit={vi.fn()} />)
    await userEvent.type(password(), "secret")
    expect(password()).toHaveAttribute("type", "password")
    await userEvent.click(screen.getByRole("button", { name: "Show password" }))
    expect(password()).toHaveAttribute("type", "text")
    expect(password()).toHaveValue("secret")
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true")
  })

  it("disables submit and social buttons while pending", () => {
    render(<LoginForm pending />)
    expect(submit()).toBeDisabled()
    expect(submit()).toHaveTextContent("Logging in")
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled()
  })

  it("shows its own loading state while the submit promise is open, and the rejection inline", async () => {
    let fail: (reason: Error) => void = () => undefined
    const onSubmit = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)))
    render(<LoginForm onSubmit={onSubmit} />)
    await fillIn()
    await userEvent.click(submit())
    expect(submit()).toBeDisabled()
    fail(new Error("That password does not match this email."))
    expect(await screen.findByRole("alert")).toHaveTextContent("That password does not match this email.")
    expect(submit()).toBeEnabled()
    expect(email()).toHaveValue("maya@northgate.studio")
    expect(password()).toHaveAttribute("aria-invalid", "true")
  })

  it("shows an error passed in from outside under the password", () => {
    render(<LoginForm error="This account is locked." onSubmit={vi.fn()} />)
    expect(screen.getByRole("alert")).toHaveTextContent("This account is locked.")
    expect(password()).toHaveAccessibleDescription("This account is locked.")
  })

  it("reports which social provider was chosen and can drop the row", async () => {
    const onSocial = vi.fn()
    const { rerender } = render(<LoginForm onSocial={onSocial} />)
    await userEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }))
    expect(onSocial).toHaveBeenCalledExactlyOnceWith("github")
    rerender(<LoginForm socialProviders={[]} />)
    expect(screen.queryByRole("button", { name: /continue with/i })).not.toBeInTheDocument()
    expect(screen.queryByText("or with email")).not.toBeInTheDocument()
  })

  it("links to account creation unless told there is none", () => {
    const { rerender } = render(<LoginForm signUpHref="/join" />)
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/join")
    rerender(<LoginForm signUpHref={null} />)
    expect(screen.queryByRole("link", { name: "Create an account" })).not.toBeInTheDocument()
  })

  it("puts the brand and its one sentence on the panel", () => {
    render(<LoginForm brandName="Ledgerline" tagline="Close the month before lunch." />)
    expect(screen.getByRole("heading", { name: /^Log in to Ledgerline\./ })).toBeInTheDocument()
    expect(screen.getByText("Close the month before lunch.")).toBeInTheDocument()
    expect(document.querySelector('[data-slot="login-form"]')).toHaveClass("@container")
  })

  it("sets the heading's second sentence in the muted tone, inside the same heading", () => {
    render(<LoginForm headingNote="Pick up where you stopped." />)
    const note = screen.getByText("Pick up where you stopped.")
    expect(note).toHaveClass("text-muted-foreground")
    expect(note.closest("h2")).not.toBeNull()
  })

  it("hides the sample product pieces from assistive tech and lets you replace or drop them", () => {
    const { rerender } = render(<LoginForm />)
    expect(screen.getByTestId("login-visual")).toHaveAttribute("aria-hidden", "true")
    rerender(<LoginForm visual={<p>Your product here</p>} />)
    expect(screen.queryByTestId("login-visual")).not.toBeInTheDocument()
    expect(screen.getByText("Your product here")).toBeInTheDocument()
    rerender(<LoginForm visual={null} />)
    expect(screen.queryByText("Your product here")).not.toBeInTheDocument()
  })
})
