import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createRef } from "react"
import { ScrollShadow, type ScrollShadowVariant } from "./scroll-shadow"
import { edgeDistances, fadeMask, isOverflowing, sameEdges } from "./scroll-shadow-math"
import { REST_AFTER_MS } from "./scroll-shadow-state"

const metrics = (overrides = {}) => ({
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 500,
  scrollWidth: 800,
  clientHeight: 200,
  clientWidth: 300,
  ...overrides,
})

function setMetrics(element: HTMLElement, values: Partial<ReturnType<typeof metrics>>) {
  for (const [key, value] of Object.entries({ ...metrics(), ...values })) {
    Object.defineProperty(element, key, { configurable: true, writable: true, value })
  }
}

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => vi.stubGlobal("ResizeObserver", ResizeObserverStub))
afterAll(() => vi.unstubAllGlobals())

describe("scroll-shadow maths", () => {
  it("measures the distance past each edge on the chosen axis only", () => {
    expect(edgeDistances(metrics({ scrollTop: 100 }), "y")).toEqual({ top: 100, bottom: 200, left: 0, right: 0 })
    expect(edgeDistances(metrics({ scrollLeft: 100 }), "x")).toEqual({ top: 0, bottom: 0, left: 100, right: 400 })
    expect(edgeDistances(metrics({ scrollTop: 300, scrollLeft: 500 }), "both")).toEqual({ top: 300, bottom: 0, left: 500, right: 0 })
  })

  it("treats a fractional position at the end as the end", () => {
    expect(edgeDistances(metrics({ scrollTop: 299.5 }), "y").bottom).toBe(0)
    expect(edgeDistances(metrics({ scrollTop: 0.4 }), "y").top).toBe(0)
  })

  it("reads negative scrollLeft correctly right to left", () => {
    expect(edgeDistances(metrics({ scrollLeft: 0 }), "x", true)).toEqual({ top: 0, bottom: 0, left: 500, right: 0 })
    expect(edgeDistances(metrics({ scrollLeft: -100 }), "x", true)).toEqual({ top: 0, bottom: 0, left: 400, right: 100 })
  })

  it("compares edges and detects overflow", () => {
    const a = edgeDistances(metrics(), "y")
    expect(sameEdges(a, { ...a })).toBe(true)
    expect(sameEdges(a, { ...a, top: 4 })).toBe(false)
    expect(isOverflowing(a)).toBe(true)
    expect(isOverflowing({ top: 0, bottom: 0, left: 0, right: 0 })).toBe(false)
  })

  it("grows the fade with the distance and caps it", () => {
    expect(fadeMask({ top: 0, bottom: 0, left: 0, right: 0 }, 32)).toBeUndefined()
    expect(fadeMask({ top: 10, bottom: 500, left: 0, right: 0 }, 32)).toBe("linear-gradient(to bottom, transparent, black 10px, black calc(100% - 32px), transparent)")
    expect(fadeMask({ top: 10, bottom: 0, left: 5, right: 0 }, 32)).toContain("to right")
  })
})

describe("ScrollShadow", () => {
  const scroller = (container: HTMLElement) => container.querySelector("[data-slot='scroll-shadow-scroller']") as HTMLElement
  const edge = (container: HTMLElement, name: string) => container.querySelector(`[data-edge='${name}']`) as HTMLElement

  it("shows a mark only at edges with more content, following the real position", async () => {
    const { container } = render(<ScrollShadow>Body</ScrollShadow>)
    const target = scroller(container)
    setMetrics(target, { scrollTop: 0 })
    fireEvent.scroll(target)
    await waitFor(() => expect(edge(container, "bottom")).toHaveAttribute("data-visible", "true"))
    expect(edge(container, "top")).toHaveAttribute("data-visible", "false")
    setMetrics(target, { scrollTop: 300 })
    fireEvent.scroll(target)
    await waitFor(() => expect(edge(container, "top")).toHaveAttribute("data-visible", "true"))
    expect(edge(container, "bottom")).toHaveAttribute("data-visible", "false")
  })

  it("leaves the marks out of the accessibility tree and the pointer path", () => {
    const { container } = render(<ScrollShadow>Body</ScrollShadow>)
    expect(edge(container, "top")).toHaveAttribute("aria-hidden", "true")
    expect(edge(container, "top").className).toContain("pointer-events-none")
  })

  it("becomes focusable only when there is something to scroll, and a named scroller is a region", async () => {
    const { container, rerender } = render(<ScrollShadow aria-label="Release notes">Body</ScrollShadow>)
    const target = scroller(container)
    expect(target).not.toHaveAttribute("tabindex")
    setMetrics(target, {})
    fireEvent.scroll(target)
    await waitFor(() => expect(target).toHaveAttribute("tabindex", "0"))
    expect(screen.getByRole("region", { name: "Release notes" })).toBe(target)
    rerender(<ScrollShadow>Body</ScrollShadow>)
    expect(target).not.toHaveAttribute("role")
  })

  it("wraps your own scroller with asChild and hands out the element", async () => {
    const ref = createRef<HTMLElement | null>()
    render(
      <ScrollShadow asChild scrollerRef={ref}>
        <ul data-testid="list" className="p-2">
          <li>One</li>
        </ul>
      </ScrollShadow>,
    )
    const list = screen.getByTestId("list")
    expect(list).toHaveAttribute("data-slot", "scroll-shadow-scroller")
    expect(list.className).toContain("overflow-y-auto")
    expect(list.className).toContain("p-2")
    await waitFor(() => expect(ref.current).toBe(list))
  })

  it("follows the axis", () => {
    const { container, rerender } = render(<ScrollShadow axis="x">Body</ScrollShadow>)
    expect(scroller(container).className).toContain("overflow-x-auto")
    rerender(<ScrollShadow axis="both">Body</ScrollShadow>)
    expect(scroller(container).className).toContain("overflow-auto")
  })

  it("makes the variants differ in structure", async () => {
    const shape = async (variant: ScrollShadowVariant) => {
      const { container, unmount } = render(<ScrollShadow variant={variant}>Body</ScrollShadow>)
      const target = scroller(container)
      setMetrics(target, { scrollTop: 100 })
      await act(async () => {
        await Promise.resolve()
      })
      const top = edge(container, "top")
      const result = {
        marks: container.querySelectorAll("[data-slot='scroll-shadow-edge']").length,
        mask: target.style.maskImage !== "",
        hairline: top?.className.includes("h-px") ?? false,
        atRest: top?.getAttribute("data-visible") ?? null,
      }
      unmount()
      return result
    }
    expect(await shape("shadow")).toEqual({ marks: 4, mask: false, hairline: false, atRest: "true" })
    expect(await shape("fade")).toEqual({ marks: 0, mask: true, hairline: false, atRest: null })
    expect(await shape("line")).toEqual({ marks: 4, mask: false, hairline: true, atRest: "true" })
    expect(await shape("none-at-rest")).toEqual({ marks: 4, mask: false, hairline: false, atRest: "false" })
  })

  it("none-at-rest shows shadows while scrolling and hides them after a pause", () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<ScrollShadow variant="none-at-rest">Body</ScrollShadow>)
      const target = scroller(container)
      setMetrics(target, { scrollTop: 100 })
      fireEvent.scroll(target)
      expect(edge(container, "top")).toHaveAttribute("data-visible", "true")
      act(() => vi.advanceTimersByTime(REST_AFTER_MS))
      expect(edge(container, "top")).toHaveAttribute("data-visible", "false")
    } finally {
      vi.useRealTimers()
    }
  })

  it("uses black for the shadow, so it cannot glow on a dark theme", () => {
    const { container } = render(<ScrollShadow>Body</ScrollShadow>)
    expect(edge(container, "top").className).toContain("from-black/")
    expect(edge(container, "top").className).not.toContain("foreground")
  })
})
