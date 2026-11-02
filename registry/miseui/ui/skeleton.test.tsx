import { render, screen } from "@testing-library/react"
import { Skeleton } from "./skeleton"

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
  changeListeners.forEach((listener) => listener())
}

afterEach(() => setReducedMotion(false))

describe("Skeleton", () => {
  it("is hidden from assistive technology", () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true")
  })

  it("pulses by default and merges custom classes", () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-32" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveClass("animate-pulse", "bg-accent", "h-4", "w-32")
  })

  it("lets a custom radius win over the default", () => {
    render(<Skeleton data-testid="skeleton" className="rounded-full" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveClass("rounded-full")
    expect(skeleton).not.toHaveClass("rounded-md")
  })

  it("exposes a data-slot hook and forwards div props", () => {
    render(<Skeleton data-testid="skeleton" title="Loading" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveAttribute("data-slot", "skeleton")
    expect(skeleton).toHaveAttribute("title", "Loading")
  })

  it("has no effect attribute by default", () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId("skeleton")).not.toHaveAttribute("data-effect")
  })
})

describe("Skeleton effect=pulse", () => {
  it("is today's look, named", () => {
    render(<Skeleton data-testid="skeleton" effect="pulse" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveAttribute("data-effect", "pulse")
    expect(skeleton).toHaveClass("animate-pulse", "bg-accent")
  })

  it("stops pulsing under reduced motion", () => {
    render(<Skeleton data-testid="skeleton" effect="pulse" />)
    expect(screen.getByTestId("skeleton")).toHaveClass("motion-reduce:animate-none")
  })
})

describe("Skeleton effect=wave", () => {
  it("replaces the pulse with a band sweeping inside a clipped block", () => {
    render(<Skeleton data-testid="skeleton" effect="wave" className="h-4 w-32" />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveAttribute("data-effect", "wave")
    expect(skeleton).toHaveAttribute("data-slot", "skeleton")
    expect(skeleton).toHaveAttribute("aria-hidden", "true")
    expect(skeleton).not.toHaveClass("animate-pulse")
    expect(skeleton).toHaveClass("overflow-hidden", "h-4", "w-32")
    const band = screen.getByTestId("skeleton-wave")
    expect(skeleton).toContainElement(band)
    expect(band).toHaveAttribute("data-reduced", "false")
    expect(band.style.backgroundImage).toContain("var(--mise)")
  })

  it("parks the band under reduced motion", () => {
    setReducedMotion(true)
    render(<Skeleton effect="wave" />)
    expect(screen.getByTestId("skeleton-wave")).toHaveAttribute("data-reduced", "true")
  })
})

describe("Skeleton effect=gooey", () => {
  it("draws the requested lines, each split into blocks, inside one goo filter", () => {
    render(<Skeleton data-testid="skeleton" effect="gooey" lines={2} />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveAttribute("data-effect", "gooey")
    expect(skeleton).toHaveAttribute("aria-hidden", "true")
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(2)
    expect(screen.getAllByTestId("skeleton-block")).toHaveLength(8)
    const filter = document.querySelector("filter") as SVGFilterElement
    expect(screen.getByTestId("skeleton-field").style.filter).toContain(`#${filter.id}`)
  })

  it("ends on a shorter line so the shape reads as a paragraph", () => {
    render(<Skeleton effect="gooey" lines={3} />)
    const widths = screen.getAllByTestId("skeleton-line").map((line) => line.style.width)
    expect(widths).toEqual(["100%", "100%", "62%"])
  })

  it("defaults to three lines and survives nonsense counts", () => {
    const { rerender } = render(<Skeleton effect="gooey" />)
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(3)
    rerender(<Skeleton effect="gooey" lines={0} />)
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(1)
    rerender(<Skeleton effect="gooey" lines={Number.NaN} />)
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(1)
  })

  it("gives every instance its own filter", () => {
    render(
      <>
        <Skeleton effect="gooey" />
        <Skeleton effect="gooey" />
      </>,
    )
    const ids = Array.from(document.querySelectorAll("filter"), (filter) => filter.id)
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it("shows still solid lines with no filter under reduced motion", () => {
    setReducedMotion(true)
    render(<Skeleton data-testid="skeleton" effect="gooey" lines={2} />)
    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-reduced", "true")
    expect(document.querySelector("filter")).toBeNull()
    expect(screen.getByTestId("skeleton-field").style.filter).toBe("")
    expect(screen.getAllByTestId("skeleton-line")).toHaveLength(2)
    expect(screen.queryByTestId("skeleton-block")).not.toBeInTheDocument()
  })

  it("does not leak lines to the DOM", () => {
    render(<Skeleton data-testid="skeleton" lines={2} />)
    expect(screen.getByTestId("skeleton")).not.toHaveAttribute("lines")
  })
})
