import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { Alert, AlertAction, type AlertVariant } from "./alert"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
  // motion restores the scroll position after measuring height: auto; jsdom has no scrollTo.
  window.scrollTo = vi.fn()
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

const part = (root: HTMLElement, name: string) => root.querySelector(`[data-part="${name}"]`)

describe("Alert roles", () => {
  it("interrupts a screen reader only for errors", () => {
    const { rerender } = render(<Alert tone="error" title="Payment failed" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Payment failed")
    for (const tone of ["neutral", "success", "warning"] as const) {
      rerender(<Alert tone={tone} title="Saved" />)
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      expect(screen.getByRole("status")).toHaveAttribute("data-tone", tone)
    }
  })

  it("draws a different glyph for every tone, so meaning never rests on colour", () => {
    const glyphOf = (tone: "neutral" | "success" | "warning" | "error") => {
      const { unmount, container } = render(<Alert tone={tone} title="Note" />)
      const markup = container.querySelector("[data-part='chip'] svg")?.innerHTML
      unmount()
      return markup
    }
    const glyphs = [glyphOf("neutral"), glyphOf("success"), glyphOf("warning"), glyphOf("error")]
    expect(new Set(glyphs).size).toBe(4)
  })

  it("keeps success green and warning amber whatever the accent is, so an amber accent never reads as a warning", () => {
    const chipOf = (tone: "success" | "warning") => {
      const { unmount, container } = render(<Alert tone={tone} title="Note" />)
      const chip = container.querySelector("[data-part='chip']")?.className ?? ""
      unmount()
      return chip
    }
    expect(chipOf("success")).toContain("bg-emerald-600")
    expect(chipOf("warning")).toContain("bg-amber-400")
    expect(chipOf("success")).not.toContain("mise")
  })

  it("darkens the text on a solid error in dark mode, where the error colour is too light for white", () => {
    render(<Alert variant="banner" tone="error" title="Payment failed" />)
    expect(screen.getByRole("alert")).toHaveClass("text-white", "dark:text-background")
  })
})

describe("Alert designs", () => {
  const full = (variant: AlertVariant) => (
    <Alert
      variant={variant}
      tone="warning"
      title="Storage almost full"
      description="You have 2 GB left."
      action={<AlertAction>Upgrade</AlertAction>}
      dismissible
    />
  )

  it("soft leads with a small chip and stacks the action under the text", () => {
    render(full("soft"))
    const root = screen.getByRole("status")
    expect(part(root, "chip")).toHaveClass("size-5")
    expect(part(root, "text")).toContainElement(part(root, "action") as HTMLElement)
  })

  it("outline leads with a large chip and puts the action beside the text", () => {
    render(full("outline"))
    const root = screen.getByRole("status")
    expect(root).toHaveClass("border")
    expect(part(root, "chip")).toHaveClass("size-8")
    expect(part(root, "text")).not.toContainElement(part(root, "action") as HTMLElement)
  })

  it("banner is one solid line with the title and description in the same sentence", () => {
    render(full("banner"))
    const root = screen.getByRole("status")
    expect(root).toHaveClass("w-full", "bg-amber-400", "text-amber-950")
    expect(root).not.toHaveClass("rounded-lg")
    expect(part(root, "line")?.tagName).toBe("P")
    expect(part(root, "line")).toHaveTextContent("Storage almost full You have 2 GB left.")
    expect(part(root, "chip")).toBeNull()
    expect(part(root, "glyph")).not.toBeNull()
  })

  it("side marks severity with a rail and keeps the icon inside the title", () => {
    render(full("side"))
    const root = screen.getByRole("status")
    expect(part(root, "rail")).toHaveClass("absolute", "bg-amber-400")
    expect(part(root, "chip")).toBeNull()
    expect(part(root, "text")?.querySelector("p")).toContainElement(part(root, "glyph") as HTMLElement)
  })

  it("pins the close button on the layouts that wrap, and keeps the text clear of it", () => {
    const { rerender } = render(full("outline"))
    const close = () => screen.getByRole("button", { name: "Dismiss" })
    expect(close()).toHaveClass("absolute")
    expect(screen.getByRole("status")).toHaveClass("relative", "pr-12")
    rerender(full("banner"))
    expect(close()).toHaveClass("absolute")
    rerender(full("soft"))
    expect(close()).not.toHaveClass("absolute")
  })

  it("lets an icon replace the tone's mark", () => {
    render(<Alert title="Note" icon={<svg data-testid="custom" />} />)
    expect(screen.getByTestId("custom")).toBeInTheDocument()
    expect(part(screen.getByRole("status"), "chip")).toBeNull()
  })
})

describe("Alert dismiss", () => {
  it("shows no close button unless asked", () => {
    render(<Alert title="Saved" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("removes itself and reports it", async () => {
    const onDismiss = vi.fn()
    render(<Alert title="Saved" dismissible onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("is reachable and operable with the keyboard", async () => {
    const onDismiss = vi.fn()
    render(<Alert title="Saved" dismissible dismissLabel="Close notice" onDismiss={onDismiss} />)
    await userEvent.tab()
    expect(screen.getByRole("button", { name: "Close notice" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("follows a controlled open, not the click", async () => {
    const onDismiss = vi.fn()
    const { rerender } = render(<Alert open title="Saved" dismissible onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    expect(onDismiss).toHaveBeenCalled()
    expect(screen.getByRole("status")).toBeInTheDocument()
    rerender(<Alert open={false} title="Saved" dismissible onDismiss={onDismiss} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("renders nothing when defaultOpen is false", () => {
    render(<Alert defaultOpen={false} title="Saved" />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})

describe("Alert materialize effect", () => {
  it("wraps the alert so its height can spring, and removes it once the exit ends", async () => {
    render(<Alert effect="materialize" title="Saved" dismissible />)
    const alert = screen.getByRole("status")
    expect(alert).toHaveAttribute("data-effect", "materialize")
    expect(alert.closest("[data-slot='alert-presence']")).toHaveClass("overflow-hidden")
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument(), { timeout: 3000 })
  })

  it("fires onDismiss once even if the button is hit again during the exit", async () => {
    const onDismiss = vi.fn()
    render(<Alert effect="materialize" title="Saved" dismissible onDismiss={onDismiss} />)
    const close = screen.getByRole("button", { name: "Dismiss" })
    await userEvent.click(close)
    close.click()
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("comes back when reopened", async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type="button" onClick={() => setOpen((value) => !value)}>
            Toggle
          </button>
          <Alert effect="materialize" open={open} title="Saved" />
        </>
      )
    }
    render(<Harness />)
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument(), { timeout: 3000 })
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    expect(await screen.findByRole("status")).toBeInTheDocument()
  })

  it("leaves in one step under reduced motion", async () => {
    reducedMotion = true
    act(() => changeListeners.forEach((listener) => listener()))
    render(<Alert effect="materialize" title="Saved" dismissible />)
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument())
    reducedMotion = false
    act(() => changeListeners.forEach((listener) => listener()))
  })
})

describe("AlertAction", () => {
  it("is a real button that fires", async () => {
    const onClick = vi.fn()
    render(<AlertAction onClick={onClick}>Retry</AlertAction>)
    const button = screen.getByRole("button", { name: "Retry" })
    expect(button).toHaveAttribute("type", "button")
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })

  it("can render a link", () => {
    render(
      <AlertAction asChild>
        <a href="/billing">Open billing</a>
      </AlertAction>,
    )
    const link = screen.getByRole("link", { name: "Open billing" })
    expect(link).toHaveAttribute("data-slot", "alert-action")
    expect(link).not.toHaveAttribute("type")
  })
})
