import { act, useRef } from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TableOfContents, type TableOfContentsProps, type TableOfContentsVariant, type TocItem } from "./table-of-contents"
import { atScrollEnd, depths, headingStatus, nextActive, outlineNumbers, readHeadings, scrollTopFor, slugify } from "./table-of-contents-math"

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

const observers: { callback: ObserverCallback; options?: IntersectionObserverInit }[] = []

class IntersectionObserverStub {
  constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
    observers.push({ callback, options })
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

class ResizeObserverStub {
  callback: (entries: ResizeObserverEntry[]) => void
  constructor(callback: (entries: ResizeObserverEntry[]) => void) {
    this.callback = callback
  }
  // A real ResizeObserver reports once on observe, and the marker relies on that.
  observe = () => this.callback([])
  unobserve = vi.fn()
  disconnect = vi.fn()
}

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub)
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  window.scrollTo = vi.fn()
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
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => {
  observers.length = 0
  vi.mocked(window.scrollTo).mockClear()
  setReducedMotion(false)
})

const ITEMS: readonly TocItem[] = [
  { id: "returns", title: "Returns", level: 2 },
  { id: "refunds", title: "Refunds", level: 3 },
  { id: "shipping", title: "Shipping", level: 2 },
]

function Page(props: TableOfContentsProps) {
  return (
    <>
      <TableOfContents items={ITEMS} {...props} />
      <h2 id="returns">Returns</h2>
      <h3 id="refunds">Refunds</h3>
      <h2 id="shipping">Shipping</h2>
    </>
  )
}

function intersect(id: string, isIntersecting: boolean, top = 0) {
  const observer = observers.at(-1)
  act(() =>
    observer?.callback([
      {
        target: document.getElementById(id),
        isIntersecting,
        boundingClientRect: { top },
        rootBounds: { top: 0 },
      } as unknown as IntersectionObserverEntry,
    ]),
  )
}

const link = (name: string) => screen.getByRole("link", { name })

describe("TableOfContents landmark", () => {
  it("is a named nav of real links to the sections", () => {
    render(<Page />)
    const nav = screen.getByRole("navigation", { name: "On this page" })
    expect(within(nav).getAllByRole("link").map((entry) => entry.getAttribute("href"))).toEqual(["#returns", "#refunds", "#shipping"])
  })

  it("renders nothing when there is nothing to list", () => {
    const { container } = render(<TableOfContents items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("watches a reading band below the offset", () => {
    render(<Page scrollOffset={80} />)
    expect(observers.at(-1)?.options?.rootMargin).toBe("-80px 0px -60% 0px")
  })
})

describe("TableOfContents current section", () => {
  it("sets aria-current from the observer, and moves on", () => {
    render(<Page />)
    expect(link("Returns")).not.toHaveAttribute("aria-current")
    intersect("returns", true)
    expect(link("Returns")).toHaveAttribute("aria-current", "location")
    intersect("returns", false, -300)
    intersect("shipping", true, 40)
    expect(link("Shipping")).toHaveAttribute("aria-current", "location")
    expect(link("Returns")).not.toHaveAttribute("aria-current")
  })

  it("keeps the last passed heading while inside a long section", () => {
    render(<Page />)
    intersect("returns", true)
    intersect("returns", false, -500)
    expect(link("Returns")).toHaveAttribute("aria-current", "location")
  })
})

describe("TableOfContents jumping", () => {
  it("scrolls smoothly past the offset, selects at once and moves focus to the heading", async () => {
    const user = userEvent.setup()
    render(<Page scrollOffset={80} />)
    await user.click(link("Shipping"))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: -80, behavior: "smooth" })
    expect(link("Shipping")).toHaveAttribute("aria-current", "location")
    expect(document.getElementById("shipping")).toHaveFocus()
  })

  it("jumps without animation when motion is reduced", async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<Page />)
    await user.click(link("Refunds"))
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }))
  })

  it("does not let the observer pull the marker away during the jump", async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.click(link("Shipping"))
    intersect("refunds", true, 30)
    expect(link("Shipping")).toHaveAttribute("aria-current", "location")
  })

  it("scrolls the given element instead of the page", async () => {
    const scrollTo = vi.fn()
    function Inner() {
      const scrollRef = useRef<HTMLDivElement>(null)
      return (
        <>
          <TableOfContents items={ITEMS} scrollRef={scrollRef} />
          <div ref={(node) => {
            scrollRef.current = node
            if (node) node.scrollTo = scrollTo
          }}>
            <h2 id="returns">Returns</h2>
            <h3 id="refunds">Refunds</h3>
            <h2 id="shipping">Shipping</h2>
          </div>
        </>
      )
    }
    const user = userEvent.setup()
    render(<Inner />)
    await user.click(link("Returns"))
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it("reports the jump and works from the keyboard", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<Page onNavigate={onNavigate} />)
    await user.tab()
    await user.keyboard("{Enter}")
    expect(onNavigate).toHaveBeenCalledWith("returns")
  })
})

describe("TableOfContents reading from a container", () => {
  function Article() {
    const ref = useRef<HTMLDivElement>(null)
    return (
      <>
        <TableOfContents containerRef={ref} />
        <div ref={ref}>
          <h2>Getting started</h2>
          <h3 id="custom">Install</h3>
          <h2>Getting started</h2>
          <h4>Skipped</h4>
        </div>
      </>
    )
  }

  it("lists the matching headings, keeps ids and adds unique ones", async () => {
    render(<Article />)
    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(3))
    expect(screen.getAllByRole("link").map((entry) => entry.getAttribute("href"))).toEqual(["#getting-started", "#custom", "#getting-started-2"])
    expect(screen.queryByText("Skipped", { selector: "a *" })).toBeNull()
  })

  it("picks up headings added later", async () => {
    const { container } = render(<Article />)
    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(3))
    const heading = document.createElement("h2")
    heading.textContent = "Later"
    const article = container.querySelector("h2")?.parentElement
    await act(async () => {
      article?.append(heading)
    })
    await waitFor(() => expect(link("Later")).toHaveAttribute("href", "#later"))
  })
})

describe("TableOfContents pure helpers", () => {
  it("slugifies every alphabet and drops punctuation", () => {
    expect(slugify("  Hello, World! ")).toBe("hello-world")
    expect(slugify("배송 안내")).toBe("배송-안내")
    expect(slugify("!!!")).toBe("")
  })

  it("numbers an outline and caps indentation", () => {
    const levels = [2, 3, 3, 2, 3, 5].map((level, index) => ({ id: String(index), title: "x", level }))
    expect(outlineNumbers(levels)).toEqual(["1", "1.1", "1.2", "2", "2.1", "2.1.1"])
    expect(depths(levels)).toEqual([0, 1, 1, 0, 1, 2])
  })

  it("classifies a heading against the band", () => {
    expect(headingStatus(true, 10, 0)).toBe("inside")
    expect(headingStatus(false, -10, 0)).toBe("above")
    expect(headingStatus(false, 900, 0)).toBe("below")
  })

  it("prefers the first in the band, then the last passed, then nothing", () => {
    const ids = ["a", "b", "c"]
    expect(nextActive(ids, new Map([["a", "above"], ["b", "inside"], ["c", "inside"]]))).toBe("b")
    expect(nextActive(ids, new Map([["a", "above"], ["b", "above"], ["c", "below"]]))).toBe("b")
    expect(nextActive(ids, new Map([["a", "below"], ["b", "below"], ["c", "below"]]))).toBeNull()
  })

  it("knows the end of a scroll only when there is something to scroll", () => {
    expect(atScrollEnd(500, 500, 1000)).toBe(true)
    expect(atScrollEnd(100, 500, 1000)).toBe(false)
    expect(atScrollEnd(0, 500, 500)).toBe(false)
  })

  it("computes the scroll target", () => {
    expect(scrollTopFor(300, 100, 50, 16)).toBe(234)
  })

  it("reads levels from the tag and leaves existing ids alone", () => {
    const article = document.createElement("div")
    article.innerHTML = "<h2 id='keep'>One</h2><h3>Two</h3>"
    expect(readHeadings(article, "h2, h3")).toEqual([
      { id: "keep", title: "One", level: 2 },
      { id: "two", title: "Two", level: 3 },
    ])
  })
})

describe("TableOfContents variants", () => {
  const VARIANTS: readonly TableOfContentsVariant[] = ["line", "plain", "dots", "floating"]

  it.each(VARIANTS)("%s marks itself", (variant) => {
    render(<Page variant={variant} />)
    expect(screen.getByRole("navigation")).toHaveAttribute("data-variant", variant)
  })

  it("line has a rail with a marker on it", () => {
    render(<Page variant="line" />)
    intersect("returns", true)
    expect(screen.getByRole("list")).toHaveClass("border-l")
    expect(link("Returns").querySelector("[data-slot='toc-marker']")).toHaveClass("bg-mise")
  })

  it("plain has no marker at rest", () => {
    render(<Page variant="plain" />)
    intersect("returns", true)
    expect(screen.getByRole("list")).not.toHaveClass("border-l")
    expect(screen.queryByRole("navigation")?.querySelector("[data-slot='toc-marker']")).toBeNull()
    expect(link("Returns")).toHaveClass("font-medium")
  })

  it("dots shows outline numbers, hidden from assistive tech", () => {
    const { container } = render(<Page variant="dots" />)
    const marks = Array.from(container.querySelectorAll("[data-slot='toc-mark']"))
    expect(marks.map((mark) => mark.textContent)).toEqual(["1", "1.1", "2"])
    expect(marks[0]).toHaveAttribute("aria-hidden", "true")
    expect(link("Refunds")).toHaveAccessibleName("Refunds")
  })

  it("floating is a card that folds into a button naming the section on phones", () => {
    const { container } = render(<Page variant="floating" />)
    expect(container.querySelector("[data-slot='toc-card']")).toHaveClass("max-sm:hidden")
    const trigger = container.querySelector("[data-slot='toc-trigger']")
    expect(trigger).toHaveClass("sm:hidden")
    expect(trigger).toHaveAccessibleName("On this page")
    intersect("shipping", true)
    expect(trigger).toHaveAccessibleName("On this page: Shipping")
  })

  it("floating jumps from the phone menu and closes it", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = render(<Page variant="floating" />)
    await user.click(container.querySelector("[data-slot='toc-trigger']") as Element)
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("link", { name: "Shipping" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(document.getElementById("shipping")).toHaveFocus()
  })
})

describe("TableOfContents spring", () => {
  it("draws one travelling marker at list level", () => {
    const { container } = render(<Page variant="line" effect="spring" />)
    intersect("returns", true)
    expect(screen.getByRole("navigation")).toHaveAttribute("data-effect", "spring")
    const markers = container.querySelectorAll("[data-slot='toc-marker']")
    expect(markers).toHaveLength(1)
    expect(markers[0].parentElement).toBe(screen.getByRole("list"))
  })

  it("falls back to a marker in the row when motion is reduced", () => {
    setReducedMotion(true)
    const { container } = render(<Page variant="line" effect="spring" />)
    intersect("returns", true)
    expect(container.querySelector("[data-slot='toc-marker']")?.parentElement).toBe(link("Returns"))
  })
})
