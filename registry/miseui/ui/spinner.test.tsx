import { render, screen } from "@testing-library/react"
import { act } from "react"
import { Spinner, type SpinnerVariant } from "./spinner"

/** motion's useReducedMotion reads matchMedia once per module, so the preference flips through the change listener. */
const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly SpinnerVariant[] = ["ring", "dots", "bars", "orbit"]

describe("Spinner", () => {
  it("is a status region whose text is the label, with a default for the careless", () => {
    const { rerender } = render(<Spinner />)
    expect(screen.getByRole("status")).toHaveTextContent("Loading")
    rerender(<Spinner label="Saving draft" />)
    expect(screen.getByRole("status")).toHaveTextContent("Saving draft")
    expect(screen.getByRole("status")).toHaveAttribute("data-slot", "spinner")
  })

  it("keeps the label for assistive tech only until showLabel asks for it on screen", () => {
    const { rerender } = render(<Spinner label="Saving" />)
    expect(screen.getByText("Saving")).toHaveClass("sr-only")
    rerender(<Spinner label="Saving" showLabel />)
    expect(screen.getByText("Saving")).not.toHaveClass("sr-only")
  })

  it("draws a different structure for every variant", () => {
    const shape = (variant: SpinnerVariant) => {
      const { container, unmount } = render(<Spinner variant={variant} />)
      const counts = {
        ring: container.querySelectorAll("[data-slot='spinner-ring'] circle").length,
        dot: container.querySelectorAll("[data-slot='spinner-dot']").length,
        bar: container.querySelectorAll("[data-slot='spinner-bar']").length,
        orbit: container.querySelectorAll("[data-slot='spinner-orbit']").length,
      }
      unmount()
      return counts
    }
    expect(shape("ring")).toEqual({ ring: 2, dot: 0, bar: 0, orbit: 0 })
    expect(shape("dots")).toEqual({ ring: 0, dot: 3, bar: 0, orbit: 0 })
    expect(shape("bars")).toEqual({ ring: 0, dot: 0, bar: 8, orbit: 0 })
    expect(shape("orbit")).toEqual({ ring: 0, dot: 0, bar: 0, orbit: 1 })
  })

  it("keeps the orbit dot round, because a stretching flex parent pulls it into a bar", () => {
    const { container } = render(<Spinner variant="orbit" />)
    expect(container.querySelector("[data-slot='spinner-orbit']")).toHaveClass("items-start")
  })

  it.each([
    ["sm", "size-4"],
    ["md", "size-6"],
    ["lg", "size-8"],
  ] as const)("size %s sets the mark to %s and hides the mark from assistive tech", (size, expected) => {
    render(<Spinner size={size} />)
    const mark = screen.getByRole("status").querySelector("[aria-hidden='true']")
    expect(mark).toHaveClass(expected)
  })

  it.each(VARIANTS)("stops every transform under reduced motion, variant=%s", (variant) => {
    setReducedMotion(true)
    const { container } = render(<Spinner variant={variant} />)
    expect(screen.getByRole("status")).toHaveAttribute("data-reduced", "true")
    expect(container.querySelector(".animate-spin")).toBeNull()
  })

  it("spins with CSS when motion is allowed, so a busy main thread cannot stall it", () => {
    const { container } = render(<Spinner variant="ring" />)
    expect(container.querySelector(".animate-spin")).not.toBeNull()
    expect(screen.getByRole("status")).not.toHaveAttribute("data-reduced")
  })

  it("passes attributes and classes to the root", () => {
    render(<Spinner className="text-mise" aria-live="off" data-testid="busy" />)
    const root = screen.getByTestId("busy")
    expect(root).toHaveClass("text-mise")
    expect(root).toHaveAttribute("aria-live", "off")
  })
})
