import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PasswordInput, type PasswordInputVariant } from "./password-input"
import { effectiveLength, passwordChecks, scorePassword } from "./password-input-strength"

const VARIANTS: readonly PasswordInputVariant[] = ["plain", "strength", "checklist", "inline"]
const field = (container: HTMLElement) => container.querySelector("input") as HTMLInputElement
const meter = () => screen.getByRole("meter", { name: "Password strength" })
const STRONG = "Glacier!Tram7Lantern$Fig"

describe("effectiveLength", () => {
  it("counts a repeat and a run as next to nothing", () => {
    expect(effectiveLength("aaaaaaaa")).toBe(1)
    expect(effectiveLength("abcdefgh")).toBe(2)
    expect(effectiveLength("87654321")).toBe(2)
    expect(effectiveLength("tram")).toBe(4)
  })
})

describe("scorePassword", () => {
  it("is zero for nothing", () => {
    expect(scorePassword("")).toBe(0)
  })

  it("rates a long repeat or run as weak despite its length", () => {
    expect(scorePassword("aaaaaaaaaaaaaaaaaa")).toBe(1)
    expect(scorePassword("abcdefghijklmnop")).toBe(1)
    expect(scorePassword("111111111111")).toBe(1)
  })

  it("caps a short password at fair however mixed it is", () => {
    expect(scorePassword("xK9$mQ2!")).toBe(2)
    expect(scorePassword("xK9$mQ2!", 8)).toBe(3)
  })

  it("rates length and variety up to strong", () => {
    expect(scorePassword("harbourlantern")).toBe(3)
    expect(scorePassword(STRONG)).toBe(4)
    expect(scorePassword("correct horse battery staple")).toBe(4)
  })

  it("counts non-Latin characters towards the search space", () => {
    expect(scorePassword("한국어비밀번호입니다고")).toBeGreaterThanOrEqual(2)
  })
})

describe("passwordChecks", () => {
  const met = (password: string, length?: number) =>
    passwordChecks(password, length)
      .filter((check) => check.met)
      .map((check) => check.id)

  it("reports each requirement separately", () => {
    expect(met("")).toEqual([])
    expect(met("abc")).toEqual([])
    expect(met("aB")).toEqual(["case"])
    expect(met("a1!")).toEqual(["number", "symbol"])
    expect(met("abcdefghijkl")).toEqual(["length"])
    expect(met("abcd", 4)).toEqual(["length"])
  })
})

describe("PasswordInput", () => {
  it.each(VARIANTS)("%s reveals and hides the text with a stable, pressed button", async (variant) => {
    const user = userEvent.setup()
    const { container } = render(<PasswordInput variant={variant} aria-label="Password" />)
    expect(container.querySelector("[data-slot='password-input']")).toHaveAttribute("data-variant", variant)
    const toggle = screen.getByRole("button", { name: "Show password" })
    expect(field(container)).toHaveAttribute("type", "password")
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    await user.click(toggle)
    expect(field(container)).toHaveAttribute("type", "text")
    expect(toggle).toHaveAttribute("aria-pressed", "true")
    toggle.focus()
    await user.keyboard("{Enter}")
    expect(field(container)).toHaveAttribute("type", "password")
  })

  it("keeps the caret in the field when the reveal button is pressed", async () => {
    const user = userEvent.setup()
    const { container } = render(<PasswordInput aria-label="Password" />)
    field(container).focus()
    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(field(container)).toHaveFocus()
  })

  it("has a different structure per variant", () => {
    const plain = render(<PasswordInput />)
    expect(screen.queryByRole("meter")).not.toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
    plain.unmount()

    const strength = render(<PasswordInput variant="strength" />)
    expect(strength.container.querySelectorAll("[data-slot='password-input-segment']")).toHaveLength(4)
    strength.unmount()

    const checklist = render(<PasswordInput variant="checklist" />)
    expect(screen.getByRole("list")).toBeInTheDocument()
    expect(screen.queryByRole("meter")).not.toBeInTheDocument()
    checklist.unmount()

    const inline = render(<PasswordInput variant="inline" />)
    expect(inline.container.querySelectorAll("[data-slot='password-input-segment']")).toHaveLength(1)
    expect(meter().parentElement).toContainElement(field(inline.container))
  })

  it("moves the meter and its words as the person types", async () => {
    const user = userEvent.setup()
    const { container } = render(<PasswordInput variant="strength" effect="spring" />)
    expect(meter()).toHaveAttribute("aria-valuenow", "0")
    await user.type(field(container), "abc")
    expect(meter()).toHaveAttribute("aria-valuenow", "1")
    expect(meter()).toHaveAttribute("aria-valuetext", "Weak")
    await user.clear(field(container))
    await user.type(field(container), STRONG)
    expect(meter()).toHaveAttribute("aria-valuenow", "4")
    expect(screen.getByText("Strong")).toBeInTheDocument()
    expect(container.querySelectorAll("[data-filled='true']")).toHaveLength(4)
  })

  it("follows a controlled value", () => {
    const { rerender } = render(<PasswordInput variant="strength" value="abc" onChange={() => undefined} />)
    expect(meter()).toHaveAttribute("aria-valuenow", "1")
    rerender(<PasswordInput variant="strength" value={STRONG} onChange={() => undefined} />)
    expect(meter()).toHaveAttribute("aria-valuenow", "4")
  })

  it("ticks off the checklist with text for assistive tech", async () => {
    const user = userEvent.setup()
    const { container } = render(<PasswordInput variant="checklist" requiredLength={4} />)
    expect(container.querySelectorAll("[data-met='true']")).toHaveLength(0)
    await user.type(field(container), "aB1!")
    expect(container.querySelectorAll("[data-met='true']")).toHaveLength(4)
    expect(screen.getByText("At least 4 characters")).toBeInTheDocument()
    expect(screen.getAllByText("Met")).toHaveLength(4)
  })

  it("shows the caps lock hint from key events and drops it on blur", () => {
    const { container } = render(<PasswordInput />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    fireEvent.keyDown(field(container), { key: "A", modifierCapsLock: true })
    expect(screen.getByRole("status")).toHaveTextContent("Caps Lock is on")
    fireEvent.blur(field(container))
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("hides a revealed password when the form submits", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <form onSubmit={(event) => event.preventDefault()}>
        <PasswordInput />
        <button type="submit">Save</button>
      </form>,
    )
    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(field(container)).toHaveAttribute("type", "text")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(field(container)).toHaveAttribute("type", "password")
  })

  it("asks the password manager for the right thing and passes field attributes on", () => {
    const login = render(<PasswordInput name="password" />)
    expect(field(login.container)).toHaveAttribute("autocomplete", "current-password")
    expect(field(login.container)).toHaveAttribute("name", "password")
    login.unmount()
    const signup = render(<PasswordInput variant="strength" disabled aria-invalid />)
    expect(field(signup.container)).toHaveAttribute("autocomplete", "new-password")
    expect(field(signup.container)).toBeDisabled()
    expect(field(signup.container)).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled()
  })
})
