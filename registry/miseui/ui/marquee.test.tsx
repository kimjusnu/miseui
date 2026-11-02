import { fireEvent, render, screen } from "@testing-library/react"
import { act } from "react"
import { Marquee, MarqueeItem, type MarqueeProps, type MarqueeVariant } from "./marquee"

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

const VARIANTS: readonly MarqueeVariant[] = ["plain", "fade", "cards", "logos"]
const root = (container: HTMLElement) => container.querySelector("[data-slot='marquee']") as HTMLElement
const copies = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>("[data-slot='marquee-copy']"))

function Row(props: MarqueeProps) {
  return (
    <Marquee aria-label="Release notes" {...props}>
      <MarqueeItem>
        <a href="#dark">Dark mode</a>
      </MarqueeItem>
      <MarqueeItem>Faster search</MarqueeItem>
    </Marquee>
  )
}

describe("Marquee", () => {
  it.each(VARIANTS)("%s renders two copies that travel with a CSS animation", (variant) => {
    const { container } = render(<Row variant={variant} />)
    expect(root(container)).toHaveAttribute("data-variant", variant)
    const [first, second] = copies(container)
    expect(copies(container)).toHaveLength(2)
    expect(first.className).toContain("animate-[mise-marquee-x")
    expect(second.className).toContain("animate-[mise-marquee-x")
  })

  it("hides the duplicate from assistive tech and from the tab order", () => {
    const { container } = render(<Row />)
    const [first, second] = copies(container)
    expect(first).not.toHaveAttribute("aria-hidden")
    expect(second).toHaveAttribute("aria-hidden", "true")
    expect(second).toHaveAttribute("inert")
    expect(screen.getAllByRole("link")).toHaveLength(1)
  })

  it("pauses on hover and focus, and on demand", () => {
    const { container, rerender } = render(<Row />)
    const [first] = copies(container)
    expect(first.className).toContain("group-hover/marquee:[animation-play-state:paused]")
    expect(first.className).toContain("group-focus-within/marquee:[animation-play-state:paused]")
    rerender(<Row paused />)
    expect(root(container)).toHaveAttribute("data-paused", "true")
    expect(copies(container)[0]).toHaveClass("[animation-play-state:paused]")
  })

  it("reverses, runs vertically and sets the speed", () => {
    const { container, rerender } = render(<Row reverse duration={12} />)
    expect(copies(container)[0]).toHaveClass("[animation-direction:reverse]")
    expect(root(container).style.getPropertyValue("--mise-marquee-duration")).toBe("12s")
    rerender(<Row vertical />)
    expect(root(container)).toHaveAttribute("data-orientation", "vertical")
    expect(copies(container)[0].className).toContain("animate-[mise-marquee-y")
  })

  it("masks the edges only in fade, and sizes items by variant", () => {
    const fade = render(<Row variant="fade" />)
    expect(root(fade.container).className).toContain("mask-image")
    fade.unmount()
    const cards = render(<Row variant="cards" />)
    expect(root(cards.container).className).not.toContain("mask-image")
    expect(cards.container.querySelector("[data-slot='marquee-item']")).toHaveClass("rounded-lg", "border")
  })

  it("becomes one still, scrollable row with reduced motion", () => {
    setReducedMotion(true)
    const { container } = render(<Row variant="fade" />)
    expect(copies(container)).toHaveLength(0)
    expect(root(container)).toHaveAttribute("data-static", "true")
    expect(root(container)).toHaveAttribute("tabindex", "0")
    expect(root(container)).toHaveClass("overflow-x-auto")
    expect(root(container).className).not.toContain("mask-image")
    expect(screen.getAllByText("Faster search")).toHaveLength(1)
  })

  it("undoes the scroll a focused off-screen link caused, once focus leaves", () => {
    const { container } = render(<Row />)
    const scrollTo = vi.fn()
    root(container).scrollTo = scrollTo
    fireEvent.blur(screen.getByRole("link"), { relatedTarget: screen.getByRole("link") })
    expect(scrollTo).not.toHaveBeenCalled()
    fireEvent.blur(screen.getByRole("link"), { relatedTarget: null })
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
