import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Switch } from "./switch"

const thumbOf = (control: HTMLElement) => control.querySelector<HTMLElement>("[data-slot='switch-thumb']")
const tailOf = (control: HTMLElement) => control.querySelector<HTMLElement>("[data-slot='switch-tail']")

describe("Switch effect=gooey", () => {
  it("runs the thumb and a trailing tail through one gooey filter", () => {
    render(<Switch aria-label="Wi-Fi" effect="gooey" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    expect(control).toHaveAttribute("data-effect", "gooey")
    expect(tailOf(control)).not.toBeNull()
    const filter = control.querySelector("filter")
    expect(filter).not.toBeNull()
    expect(thumbOf(control)?.parentElement?.getAttribute("style")).toContain(`#${filter?.id}`)
  })

  it("moves the thumb to the far end when toggled, and toggles with Space", async () => {
    render(<Switch aria-label="Wi-Fi" effect="gooey" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.tab()
    await userEvent.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "true")
    expect(thumbOf(control)).toHaveAttribute("data-state", "checked")
    await waitFor(() => expect(thumbOf(control)?.style.transform).toContain("translateX(16px)"))
  })

  it("holds the thumb when the owner keeps the value", async () => {
    render(<Switch aria-label="Wi-Fi" effect="gooey" checked={false} onCheckedChange={vi.fn()} />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.click(control)
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(thumbOf(control)?.style.transform ?? "").not.toContain("translateX")
  })
})

describe("Switch effect=haptic", () => {
  it("dips the thumb on pointer-down, before any click, and restores it on release", async () => {
    render(<Switch aria-label="Wi-Fi" effect="haptic" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    expect(control).toHaveAttribute("data-effect", "haptic")
    fireEvent.pointerDown(control)
    expect(control).toHaveAttribute("data-pressed", "true")
    expect(control).toHaveAttribute("aria-checked", "false")
    await waitFor(() => expect(thumbOf(control)?.style.transform).toContain("scale(0.9)"))
    fireEvent.pointerUp(window)
    expect(control).not.toHaveAttribute("data-pressed")
    await waitFor(() => expect(thumbOf(control)?.style.transform ?? "").not.toContain("scale"))
  })

  it("releases when the pointer lifts outside the control", () => {
    render(<Switch aria-label="Wi-Fi" effect="haptic" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    fireEvent.pointerDown(control)
    fireEvent.pointerCancel(window)
    expect(control).not.toHaveAttribute("data-pressed")
  })

  it("does not react while disabled and still calls the owner's handler", () => {
    const onPointerDown = vi.fn()
    render(<Switch aria-label="Wi-Fi" effect="haptic" disabled onPointerDown={onPointerDown} />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    fireEvent.pointerDown(control)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
    expect(control).not.toHaveAttribute("data-pressed")
  })

  it("dips for the keyboard too, and still toggles", async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Wi-Fi" effect="haptic" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await user.tab()
    await user.keyboard("[Space>]")
    expect(control).toHaveAttribute("data-pressed", "true")
    await user.keyboard("[/Space]")
    expect(control).not.toHaveAttribute("data-pressed")
    expect(control).toHaveAttribute("aria-checked", "true")
  })
})

describe("Switch effects under reduced motion", () => {
  async function importReduced() {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const fresh = await import("./switch")
    vi.doUnmock("motion/react")
    return fresh.Switch
  }

  it("gooey drops the tail and the filter but keeps the thumb", async () => {
    const FreshSwitch = await importReduced()
    render(<FreshSwitch aria-label="Wi-Fi" effect="gooey" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    expect(tailOf(control)).toBeNull()
    expect(control.querySelector("filter")).toBeNull()
    expect(thumbOf(control)).not.toBeNull()
  })

  it("haptic keeps the press state without scaling the thumb", async () => {
    const FreshSwitch = await importReduced()
    render(<FreshSwitch aria-label="Wi-Fi" effect="haptic" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    fireEvent.pointerDown(control)
    expect(control).toHaveAttribute("data-pressed", "true")
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(thumbOf(control)?.style.transform ?? "").not.toContain("scale(0.9)")
  })
})

describe("Switch", () => {
  it("toggles aria-checked on click", async () => {
    render(<Switch aria-label="Wi-Fi" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    expect(control).toHaveAttribute("aria-checked", "false")
    await userEvent.click(control)
    expect(control).toHaveAttribute("aria-checked", "true")
    expect(control).toHaveAttribute("data-state", "checked")
  })

  it("toggles with the Space key once focused", async () => {
    render(<Switch aria-label="Wi-Fi" />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.tab()
    expect(control).toHaveFocus()
    await userEvent.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "true")
    await userEvent.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "false")
  })

  it("reports the next value when controlled and leaves the state to the owner", async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Wi-Fi" checked onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.click(control)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    expect(control).toHaveAttribute("aria-checked", "true")
  })

  it("does not change while disabled", async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Wi-Fi" disabled onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.click(control)
    expect(control).toBeDisabled()
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
