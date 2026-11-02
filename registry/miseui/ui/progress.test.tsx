import { render, screen } from "@testing-library/react"
import { act } from "react"
import { Progress, type ProgressVariant } from "./progress"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
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

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly ProgressVariant[] = ["plain", "thin", "segmented", "labelled"]
const bar = () => screen.getByRole("progressbar")
const query = (slot: string) => document.querySelector(`[data-slot='${slot}']`) as HTMLElement | null

describe("Progress", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("exposes role, range and value, and marks the variant", () => {
      render(<Progress label="Uploading" value={40} variant={variant} />)
      expect(bar()).toHaveAttribute("aria-valuemin", "0")
      expect(bar()).toHaveAttribute("aria-valuemax", "100")
      expect(bar()).toHaveAttribute("aria-valuenow", "40")
      expect(bar()).toHaveAccessibleName("Uploading")
      expect(query("progress")).toHaveAttribute("data-variant", variant)
    })

    it("drops aria-valuenow while indeterminate, because no value is known", () => {
      render(<Progress label="Connecting" value={null} variant={variant} />)
      expect(bar()).not.toHaveAttribute("aria-valuenow")
      expect(bar()).toHaveAttribute("data-state", "indeterminate")
      expect(query("progress-indeterminate")).not.toBeNull()
    })

    it("runs the shimmer band only while work is running", () => {
      const { rerender } = render(<Progress label="Sync" value={50} variant={variant} effect="shimmer" />)
      expect(query("progress-band")).not.toBeNull()
      rerender(<Progress label="Sync" value={100} variant={variant} effect="shimmer" />)
      expect(query("progress-band")).toBeNull()
    })

    it("does not sweep or loop under reduced motion", () => {
      setReducedMotion(true)
      const { rerender } = render(<Progress label="Sync" value={50} variant={variant} effect="shimmer" />)
      expect(query("progress-band")).toBeNull()
      rerender(<Progress label="Sync" value={null} variant={variant} />)
      expect(query("progress-indeterminate")).toHaveAttribute("data-reduced", "true")
    })
  })

  it("clamps out-of-range values instead of letting the bar overflow", () => {
    const { rerender } = render(<Progress label="Sync" value={140} />)
    expect(bar()).toHaveAttribute("aria-valuenow", "100")
    expect(bar()).toHaveAttribute("data-state", "complete")
    rerender(<Progress label="Sync" value={-5} />)
    expect(bar()).toHaveAttribute("aria-valuenow", "0")
  })

  it("draws the fill as a share of a custom max", () => {
    render(<Progress label="Files" value={3} max={12} />)
    expect(bar()).toHaveAttribute("aria-valuemax", "12")
    expect(query("progress-fill")).toHaveStyle({ width: "25%" })
  })

  it("thin is a hairline and carries no text of its own", () => {
    render(<Progress label="Reading" value={30} variant="thin" />)
    expect(bar()).toHaveClass("h-0.5")
    expect(screen.queryByText("Reading")).toBeNull()
    expect(screen.queryByText("30%")).toBeNull()
  })

  it("segmented draws N cells, fills only completed ones and shimmers the current one", () => {
    render(<Progress label="Step" value={2} max={5} steps={5} variant="segmented" effect="shimmer" />)
    const cells = document.querySelectorAll("[data-slot='progress-segment']")
    expect(cells).toHaveLength(5)
    expect(document.querySelectorAll("[data-slot='progress-segment'][data-filled='true']")).toHaveLength(2)
    expect(cells[2].querySelector("[data-slot='progress-band']")).not.toBeNull()
    expect(cells[1].querySelector("[data-slot='progress-band']")).toBeNull()
    expect(query("progress-fill")).toBeNull()
  })

  it("segmented does not round up: 99 percent never lights the last cell", () => {
    render(<Progress label="Step" value={99} steps={4} variant="segmented" />)
    expect(document.querySelectorAll("[data-slot='progress-segment'][data-filled='true']")).toHaveLength(3)
  })

  it("labelled shows the label and percent above the bar, named by the visible label", () => {
    render(<Progress label="Uploading photos" value={3} max={8} variant="labelled" />)
    const label = screen.getByText("Uploading photos")
    expect(bar().getAttribute("aria-labelledby")).toBe(label.id)
    expect(screen.getByText("38%")).toBeInTheDocument()
    expect(label.compareDocumentPosition(bar()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("labelled hides the percent while indeterminate rather than claiming a number", () => {
    render(<Progress label="Connecting" value={null} variant="labelled" />)
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it("marks the spring effect and draws the fill with motion", () => {
    render(<Progress label="Sync" value={60} effect="spring" />)
    expect(query("progress")).toHaveAttribute("data-effect", "spring")
    expect(query("progress-fill")).toHaveStyle({ width: "60%" })
  })

  it("passes a value label to assistive tech", () => {
    render(<Progress label="Files" value={3} max={12} getValueLabel={(value, max) => `${value} of ${max} files`} />)
    expect(bar()).toHaveAttribute("aria-valuetext", "3 of 12 files")
  })
})
