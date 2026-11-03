import { act, render, screen } from "@testing-library/react"
import { Indicator, formatIndicatorCount, isIndicatorVisible, type IndicatorVariant } from "./indicator"

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

const mark = (container: HTMLElement) => container.querySelector("[data-slot='indicator-mark']") as HTMLElement | null

describe("indicator helpers", () => {
  it("caps the count with a plus sign and cleans bad numbers", () => {
    expect(formatIndicatorCount(5, 99)).toBe("5")
    expect(formatIndicatorCount(99, 99)).toBe("99")
    expect(formatIndicatorCount(100, 99)).toBe("99+")
    expect(formatIndicatorCount(-3, 99)).toBe("0")
    expect(formatIndicatorCount(Number.NaN, 99)).toBe("0")
    expect(formatIndicatorCount(2.9, 99)).toBe("2")
  })

  it("hides at zero unless asked, and shows when there is no count to judge", () => {
    expect(isIndicatorVisible({ count: 0, showZero: false, text: undefined })).toBe(false)
    expect(isIndicatorVisible({ count: 0, showZero: true, text: undefined })).toBe(true)
    expect(isIndicatorVisible({ count: 3, showZero: false, text: undefined })).toBe(true)
    expect(isIndicatorVisible({ count: undefined, showZero: false, text: undefined })).toBe(true)
    expect(isIndicatorVisible({ count: 0, showZero: false, text: "New" })).toBe(true)
  })
})

describe("Indicator", () => {
  it("shows the capped count over its child and the noun only to assistive tech", () => {
    const { container } = render(
      <Indicator count={120} label="120 unread messages">
        <button type="button">Inbox</button>
      </Indicator>,
    )
    expect(mark(container)).toHaveTextContent("99+")
    expect(container.querySelector("[data-slot='indicator-anchor']")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText("120 unread messages")).toHaveClass("sr-only")
    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument()
  })

  it("removes the mark and the spoken text at zero, and restores them with showZero", () => {
    const { container, rerender } = render(
      <Indicator count={0} label="No unread messages">
        <span>Inbox</span>
      </Indicator>,
    )
    expect(mark(container)).toBeNull()
    expect(screen.queryByText("No unread messages")).not.toBeInTheDocument()
    rerender(
      <Indicator count={0} showZero label="No unread messages">
        <span>Inbox</span>
      </Indicator>,
    )
    expect(mark(container)).toHaveTextContent("0")
    expect(screen.getByText("No unread messages")).toBeInTheDocument()
  })

  it("never takes a click meant for its child", () => {
    const { container } = render(
      <Indicator count={2} label="2 alerts">
        <span>Bell</span>
      </Indicator>,
    )
    expect(container.querySelector("[data-slot='indicator-anchor']")?.className).toContain("pointer-events-none")
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: IndicatorVariant) => {
      const { container, unmount } = render(
        <Indicator variant={variant} count={4} text="New" label="Four new">
          <span>Child</span>
        </Indicator>,
      )
      const result = {
        ring: container.querySelector("[data-slot='indicator-ring']") !== null,
        mark: mark(container)?.textContent ?? null,
      }
      unmount()
      return result
    }
    expect(shape("dot")).toEqual({ ring: false, mark: "" })
    expect(shape("count")).toEqual({ ring: false, mark: "4" })
    expect(shape("ring")).toEqual({ ring: true, mark: null })
    expect(shape("label")).toEqual({ ring: false, mark: "New" })
  })

  it("moves in to the rim for a circular child and follows the chosen corner", () => {
    const { container } = render(
      <Indicator count={1} shape="circle" corner="bottom-left" label="One">
        <span>Avatar</span>
      </Indicator>,
    )
    const anchor = container.querySelector("[data-slot='indicator-anchor']") as HTMLElement
    expect(anchor.className).toContain("left-[14.6%]")
    expect(anchor.className).toContain("bottom-[14.6%]")
  })

  it("pops only on change, replacing the mark so it can scale again", () => {
    const { container, rerender } = render(
      <Indicator count={1} effect="pop" label="One">
        <span>Bell</span>
      </Indicator>,
    )
    const first = mark(container)
    rerender(
      <Indicator count={1} effect="pop" label="One">
        <span>Bell</span>
      </Indicator>,
    )
    expect(mark(container)).toBe(first)
    rerender(
      <Indicator count={2} effect="pop" label="Two">
        <span>Bell</span>
      </Indicator>,
    )
    expect(mark(container)).toHaveTextContent("2")
    expect(mark(container)).not.toBe(first)
  })

  it("keeps the same mark under reduced motion", () => {
    setReducedMotion(true)
    const { container, rerender } = render(
      <Indicator count={1} effect="pop" label="One">
        <span>Bell</span>
      </Indicator>,
    )
    const first = mark(container)
    rerender(
      <Indicator count={2} effect="pop" label="Two">
        <span>Bell</span>
      </Indicator>,
    )
    expect(mark(container)).toBe(first)
    expect(first).toHaveTextContent("2")
  })
})
