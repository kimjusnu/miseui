import { createRef } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "./button"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for "change",
 * so the mock goes in before the first render and flips the preference by firing that listener.
 */
const originalMatchMedia = window.matchMedia
let reducedMotion = false
let finePointer = true
const changeListeners: Array<() => void> = []
// jsdom has no WebGL; null is what a real browser returns without it.
const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null)

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query.includes("reduced-motion") ? reducedMotion : finePointer
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
  getContext.mockRestore()
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  changeListeners.forEach((listener) => listener())
}

afterEach(() => {
  setReducedMotion(false)
  finePointer = true
})

/** A 100 × 40 button at the origin, pulled by a pointer at its far right edge. */
function pullRight(button: HTMLElement) {
  vi.spyOn(button, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 40))
  fireEvent.pointerMove(button, { clientX: 100, clientY: 20 })
}

describe("Button", () => {
  it("renders its label and calls onClick", async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("ignores clicks while disabled", async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("renders the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/docs">Docs</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Docs" })
    expect(link).toHaveAttribute("data-slot", "button")
  })

  it("applies variant and size classes", () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    )
    const button = screen.getByRole("button", { name: "Delete" })
    expect(button).toHaveClass("bg-destructive")
    expect(button).toHaveAttribute("data-variant", "destructive")
  })

  it("adds no effect attribute and no wrapper by default", () => {
    const { container } = render(<Button>Plain</Button>)
    const button = screen.getByRole("button", { name: "Plain" })
    expect(button).not.toHaveAttribute("data-effect")
    expect(button).not.toHaveAttribute("aria-busy")
    expect(button.parentElement).toBe(container)
  })
})

describe("Button effect=liquid", () => {
  it("wraps the real button in liquid metal and clears its fill so the metal shows", () => {
    render(<Button effect="liquid">Continue</Button>)
    const button = screen.getByRole("button", { name: "Continue" })
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-effect", "liquid")
    expect(button).toHaveClass("bg-transparent", "text-[oklch(0.2_0_0)]")
    expect(button.parentElement).toHaveAttribute("data-slot", "liquid-metal")
  })

  it("keeps silver ink dark but follows the accent on tinted metal, whose foreground may be white", () => {
    render(
      <Button effect="liquid" variant="mise">
        Tinted
      </Button>,
    )
    expect(screen.getByRole("button", { name: "Tinted" })).toHaveClass("text-mise-foreground")
  })

  it("takes the accent tint on the mise variant and silver otherwise", () => {
    const { rerender } = render(
      <Button effect="liquid" variant="mise">
        Go
      </Button>,
    )
    expect(screen.getByRole("button", { name: "Go" }).parentElement).toHaveAttribute("data-tint", "mise")
    rerender(<Button effect="liquid">Go</Button>)
    expect(screen.getByRole("button", { name: "Go" }).parentElement).toHaveAttribute("data-tint", "silver")
  })

  it("moves the press dip to the frame, so label and surface sink together", () => {
    render(<Button effect="liquid">Press</Button>)
    const button = screen.getByRole("button", { name: "Press" })
    expect(button).toHaveClass("active:scale-100")
    expect(button).not.toHaveClass("active:scale-[0.97]")
    expect(button.parentElement).toHaveClass("has-active:scale-[0.97]")
  })

  it("keeps asChild, with the slot on the child inside the frame", () => {
    render(
      <Button asChild effect="liquid">
        <a href="/docs">Docs</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Docs" })
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link.parentElement).toHaveAttribute("data-slot", "liquid-metal")
  })

  it("carries a custom radius and full width out to the frame", () => {
    render(
      <Button effect="liquid" className="w-full rounded-full">
        Wide
      </Button>,
    )
    expect(screen.getByRole("button", { name: "Wide" }).parentElement).toHaveClass("w-full", "rounded-full")
  })
})

describe("Button effect=beam", () => {
  it("wraps the real button in a travelling beam", () => {
    render(<Button effect="beam">Run</Button>)
    const button = screen.getByRole("button", { name: "Run" })
    expect(button).toHaveAttribute("data-effect", "beam")
    expect(button.parentElement).toHaveAttribute("data-slot", "beam-border")
    expect(screen.getByTestId("beam-layer")).toBeInTheDocument()
  })

  it("follows the large button's pill radius", () => {
    render(
      <Button effect="beam" size="lg">
        Run
      </Button>,
    )
    expect(screen.getByRole("button", { name: "Run" }).parentElement).toHaveClass("rounded-full")
  })

  it("stops the beam while disabled", () => {
    render(
      <Button effect="beam" disabled>
        Run
      </Button>,
    )
    expect(screen.queryByTestId("beam-layer")).not.toBeInTheDocument()
  })

  it("keeps asChild", () => {
    render(
      <Button asChild effect="beam">
        <a href="/run">Run</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Run" })
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link.parentElement).toHaveAttribute("data-slot", "beam-border")
  })
})

describe("Button effect=shimmer", () => {
  it("runs the label through shimmer text and marks the button busy, with no wrapper", () => {
    const { container } = render(<Button effect="shimmer">Saving…</Button>)
    const button = screen.getByRole("button", { name: "Saving…" })
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button.parentElement).toBe(container)
    expect(screen.getByTestId("shimmer-band")).toHaveTextContent("Saving…")
    expect(button).toContainElement(screen.getByTestId("shimmer-band"))
  })

  it("stays at full strength while disabled, because loading is not unavailable", () => {
    render(
      <Button effect="shimmer" disabled>
        Saving…
      </Button>,
    )
    expect(screen.getByRole("button", { name: "Saving…" })).toHaveClass("disabled:opacity-100")
  })

  it("names the variant's ink, because currentColor is transparent inside the band", () => {
    render(
      <Button effect="shimmer" variant="mise">
        Saving…
      </Button>,
    )
    const root = screen.getByTestId("shimmer-band").parentElement as HTMLElement
    expect(root.style.getPropertyValue("--foreground")).toBe("var(--mise-foreground)")
  })

  it("leaves the outline variant on the theme tokens instead of re-declaring one from itself", () => {
    render(
      <Button effect="shimmer" variant="outline">
        Saving…
      </Button>,
    )
    const root = screen.getByTestId("shimmer-band").parentElement as HTMLElement
    expect(root.style.getPropertyValue("--foreground")).toBe("")
  })

  it("leaves icons alone and shimmers only the text", () => {
    render(
      <Button effect="shimmer">
        <svg data-testid="icon" />
        Saving…
      </Button>,
    )
    expect(screen.getByTestId("icon").closest("[data-slot='shimmer-text']")).toBeNull()
    expect(screen.getByTestId("shimmer-band")).toHaveTextContent("Saving…")
  })

  it("reaches the text inside an asChild element", () => {
    render(
      <Button asChild effect="shimmer">
        <a href="/s">Saving…</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Saving…" })
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link).toContainElement(screen.getByTestId("shimmer-band"))
  })
})

describe("Button effect=magnetic", () => {
  it("drifts toward the pointer by at most 4 px, and adds no wrapper", async () => {
    const { container } = render(<Button effect="magnetic">Pull</Button>)
    const button = screen.getByRole("button", { name: "Pull" })
    expect(button).toHaveAttribute("data-effect", "magnetic")
    expect(button.parentElement).toBe(container)
    pullRight(button)
    await waitFor(() => expect(parseFloat(button.style.translate)).toBeGreaterThan(0))
    await waitFor(() => expect(parseFloat(button.style.translate)).toBeCloseTo(4, 0))
    expect(parseFloat(button.style.translate)).toBeLessThanOrEqual(4)
  })

  it("returns home when the pointer leaves", async () => {
    render(<Button effect="magnetic">Pull</Button>)
    const button = screen.getByRole("button", { name: "Pull" })
    pullRight(button)
    await waitFor(() => expect(parseFloat(button.style.translate)).toBeGreaterThan(1))
    fireEvent.pointerLeave(button)
    await waitFor(() => expect(parseFloat(button.style.translate)).toBeCloseTo(0, 1))
  })

  it("sits still under reduced motion", async () => {
    setReducedMotion(true)
    render(<Button effect="magnetic">Pull</Button>)
    const button = screen.getByRole("button", { name: "Pull" })
    pullRight(button)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(button.style.translate ?? "").toBe("")
  })

  it("sits still on a coarse pointer", async () => {
    finePointer = false
    render(<Button effect="magnetic">Pull</Button>)
    const button = screen.getByRole("button", { name: "Pull" })
    pullRight(button)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(button.style.translate ?? "").toBe("")
  })

  it("keeps asChild, the consumer's ref and the consumer's handler", async () => {
    const ref = createRef<HTMLButtonElement>()
    const onPointerMove = vi.fn()
    const { rerender } = render(
      <Button effect="magnetic" ref={ref} onPointerMove={onPointerMove}>
        Pull
      </Button>,
    )
    const button = screen.getByRole("button", { name: "Pull" })
    expect(ref.current).toBe(button)
    pullRight(button)
    expect(onPointerMove).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(parseFloat(button.style.translate)).toBeGreaterThan(0))

    rerender(
      <Button asChild effect="magnetic">
        <a href="/pull">Link</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: "Link" })
    expect(link).toHaveAttribute("data-slot", "button")
    pullRight(link)
    await waitFor(() => expect(parseFloat(link.style.translate)).toBeGreaterThan(0))
  })
})
