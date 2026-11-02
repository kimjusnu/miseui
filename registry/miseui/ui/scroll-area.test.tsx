import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ScrollArea, edgeProgress, type ScrollAreaProps } from "./scroll-area"

const observers: ResizeObserverStub[] = []

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(public callback: () => void) {
    observers.push(this)
  }
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function Area(props: ScrollAreaProps) {
  return (
    <ScrollArea data-testid="root" {...props}>
      {props.children ?? <p>Release notes</p>}
    </ScrollArea>
  )
}

const root = () => screen.getByTestId("root")
const viewport = () => root().querySelector("[data-slot='scroll-area-viewport']") as HTMLElement
const bars = () => root().querySelectorAll("[data-slot='scroll-area-scrollbar']")
const part = (name: string) => root().querySelector(`[data-part="${name}"]`)
const startVar = () => root().style.getPropertyValue("--scroll-start")
const endVar = () => root().style.getPropertyValue("--scroll-end")

/** jsdom has no layout, so the scroller's geometry is set by hand. */
function setGeometry(element: HTMLElement, sizes: { scrollHeight?: number; clientHeight?: number; scrollTop?: number }) {
  Object.entries(sizes).forEach(([key, value]) => {
    Object.defineProperty(element, key, { configurable: true, writable: true, value })
  })
}

describe("edgeProgress", () => {
  it("grows from 0 at the edge to 1 at 24 px and stops there", () => {
    expect(edgeProgress(0)).toBe(0)
    expect(edgeProgress(12)).toBe(0.5)
    expect(edgeProgress(24)).toBe(1)
    expect(edgeProgress(400)).toBe(1)
  })

  it("never goes negative when overscroll reports past the end", () => {
    expect(edgeProgress(-8)).toBe(0)
  })
})

describe("ScrollArea accessibility", () => {
  it("lets the keyboard reach the scroller", async () => {
    const user = userEvent.setup()
    render(<Area />)
    expect(viewport()).toHaveAttribute("tabindex", "0")
    await user.tab()
    expect(viewport()).toHaveFocus()
    expect(viewport()).toHaveClass("focus-visible:ring-[3px]")
  })

  it("becomes a named region when given a name", () => {
    render(<Area aria-label="Release notes list" />)
    expect(screen.getByRole("region", { name: "Release notes list" })).toBe(viewport())
    expect(root()).not.toHaveAttribute("aria-label")
  })

  it("adds no landmark without a name", () => {
    render(<Area />)
    expect(screen.queryByRole("region")).not.toBeInTheDocument()
    expect(root()).toHaveAttribute("data-slot", "scroll-area")
  })
})

describe("ScrollArea layout", () => {
  it("undoes the Radix table wrapper only on vertical, where text has to wrap", () => {
    const { rerender } = render(<Area />)
    expect(viewport()).toHaveClass("[&>div]:block!")
    rerender(<Area orientation="horizontal" />)
    expect(viewport()).not.toHaveClass("[&>div]:block!")
  })

  it("adds a bar per axis and a corner only for both", () => {
    const { rerender } = render(<Area type="always" />)
    expect(bars()).toHaveLength(1)
    rerender(<Area type="always" orientation="horizontal" />)
    expect(bars()).toHaveLength(1)
    expect(bars()[0]).toHaveAttribute("data-orientation", "horizontal")
    rerender(<Area type="always" orientation="both" />)
    expect(bars()).toHaveLength(2)
  })
})

describe("ScrollArea designs", () => {
  it("plain and overlay draw different bars", () => {
    const { rerender } = render(<Area type="always" />)
    expect(bars()[0]).toHaveClass("w-3")
    expect(bars()[0]).not.toHaveClass("hover:w-3")
    rerender(<Area type="always" variant="overlay" />)
    expect(bars()[0]).toHaveClass("w-2", "hover:w-3")
  })

  it("only shadow adds edge elements, hidden from assistive tech", () => {
    const { rerender } = render(<Area />)
    expect(part("edge-start")).toBeNull()
    rerender(<Area variant="shadow" />)
    expect(part("edge-start")).toHaveAttribute("aria-hidden", "true")
    expect(part("edge-end")).toHaveClass("pointer-events-none", "opacity-(--scroll-end)")
  })

  it("shadow follows the axis", () => {
    render(<Area variant="shadow" orientation="horizontal" />)
    expect(part("edge-start")).toHaveClass("left-0", "bg-linear-to-r")
  })

  it("snap runs horizontally by default, stops on each child and has no bar", () => {
    render(
      <Area variant="snap" type="always">
        <div>Plan one</div>
        <div>Plan two</div>
      </Area>,
    )
    expect(viewport()).toHaveClass("snap-x", "snap-mandatory")
    expect(part("snap-track")).toHaveClass("flex", "*:snap-start", "*:shrink-0")
    expect(part("snap-track")?.children).toHaveLength(2)
    expect(bars()).toHaveLength(0)
  })

  it("snap can run vertically", () => {
    render(<Area variant="snap" orientation="vertical" />)
    expect(viewport()).toHaveClass("snap-y")
    expect(part("snap-track")).toHaveClass("grid")
  })
})

describe("ScrollArea edge tracking", () => {
  it("tracks both edges for shadow as the content scrolls", () => {
    render(<Area variant="shadow" />)
    setGeometry(viewport(), { scrollHeight: 500, clientHeight: 100, scrollTop: 0 })
    fireEvent.scroll(viewport())
    expect(startVar()).toBe("0")
    expect(endVar()).toBe("1")
    setGeometry(viewport(), { scrollTop: 12 })
    fireEvent.scroll(viewport())
    expect(startVar()).toBe("0.5")
    setGeometry(viewport(), { scrollTop: 400 })
    fireEvent.scroll(viewport())
    expect(startVar()).toBe("1")
    expect(endVar()).toBe("0")
  })

  it("re-measures when the size changes, not just on scroll", () => {
    render(<Area variant="shadow" />)
    setGeometry(viewport(), { scrollHeight: 500, clientHeight: 100, scrollTop: 0 })
    observers[observers.length - 1].callback()
    expect(endVar()).toBe("1")
  })

  it("does no tracking for a design that does not use it", () => {
    render(<Area />)
    fireEvent.scroll(viewport())
    expect(startVar()).toBe("")
  })

  it("stops listening on unmount", () => {
    const { unmount } = render(<Area variant="shadow" />)
    const scroller = viewport()
    const remove = vi.spyOn(scroller, "removeEventListener")
    const observer = observers[observers.length - 1]
    unmount()
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function))
    expect(observer.disconnect).toHaveBeenCalled()
  })
})

describe("ScrollArea edge-fade effect", () => {
  it("masks the viewport from the same variables", () => {
    render(<Area effect="edge-fade" />)
    expect(root()).toHaveAttribute("data-effect", "edge-fade")
    expect(viewport().className).toContain("mask-image:linear-gradient(to_bottom")
    expect(viewport().className).toContain("var(--scroll-start,0)")
    setGeometry(viewport(), { scrollHeight: 500, clientHeight: 100, scrollTop: 24 })
    fireEvent.scroll(viewport())
    expect(startVar()).toBe("1")
  })

  it("drops the mask under reduced transparency", () => {
    render(<Area effect="edge-fade" />)
    expect(viewport()).toHaveClass("[@media(prefers-reduced-transparency:reduce)]:[mask-image:none]")
  })

  it("masks sideways on a horizontal scroller", () => {
    render(<Area effect="edge-fade" orientation="horizontal" />)
    expect(viewport().className).toContain("linear-gradient(to_right")
  })

  it("leaves the viewport unmasked without the effect", () => {
    render(<Area />)
    expect(viewport().className).not.toContain("mask-image")
  })
})
