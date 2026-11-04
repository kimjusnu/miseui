import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DocsLayout, type DocsGroup, type DocsLayoutVariant } from "./docs-layout"
import { flattenPages, locatePage } from "./docs-layout-state"

const GROUPS: readonly DocsGroup[] = [
  {
    label: "Start",
    pages: [
      {
        id: "one",
        title: "Page one",
        lead: "The first page.",
        sections: [
          { id: "one-a", title: "Alpha", body: <p>Alpha text.</p>, code: { title: "alpha.ts", code: "const a = 1", language: "ts" } },
          { id: "one-b", title: "Beta", body: <p>Beta text.</p> },
        ],
      },
      { id: "two", title: "Page two", sections: [{ id: "two-a", title: "Gamma", body: <p>Gamma text.</p> }] },
    ],
  },
]

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void
const intersections: ObserverCallback[] = []
let blockWidth = 1280

class IntersectionObserverStub {
  constructor(callback: ObserverCallback) {
    intersections.push(callback)
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {
    this.callback([{ contentRect: { width: blockWidth } } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub)
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollTo = vi.fn()
  window.scrollTo = vi.fn()
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => {
  blockWidth = 1280
  intersections.length = 0
})

const root = (container: HTMLElement) => container.querySelector('[data-slot="docs-layout"]')

describe("docs-layout helpers", () => {
  it("falls back to the first page and knows the neighbours", () => {
    const pages = flattenPages(GROUPS)
    expect(locatePage(pages, "nope").page?.id).toBe("one")
    expect(locatePage(pages, "one").next?.id).toBe("two")
    expect(locatePage(pages, "one").previous).toBeUndefined()
    expect(locatePage(pages, "two").previous?.id).toBe("one")
    expect(locatePage([], "one").page).toBeUndefined()
  })
})

describe("DocsLayout variants", () => {
  it("renders sidebar without the prop and for an unknown value, including constructor", () => {
    const { container, rerender } = render(<DocsLayout groups={GROUPS} />)
    expect(root(container)).toHaveAttribute("data-variant", "sidebar")
    rerender(<DocsLayout groups={GROUPS} variant={"constructor" as DocsLayoutVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "sidebar")
    rerender(<DocsLayout groups={GROUPS} variant={"nonsense" as DocsLayoutVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "sidebar")
  })

  it("differs in structure, not only in colour", () => {
    const { container, rerender } = render(<DocsLayout groups={GROUPS} />)
    expect(container.querySelector('[data-slot="sidebar"]')).not.toBeNull()
    expect(screen.queryByTestId("reference-row")).not.toBeInTheDocument()
    rerender(<DocsLayout groups={GROUPS} variant="centered" />)
    expect(container.querySelector('[data-slot="sidebar"]')).toBeNull()
    expect(screen.queryByTestId("reference-row")).not.toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "In this guide" })).toBeInTheDocument()
    rerender(<DocsLayout groups={GROUPS} variant="reference" />)
    expect(container.querySelector('[data-slot="sidebar"]')).toBeNull()
    expect(screen.getAllByTestId("reference-row")).toHaveLength(2)
  })

  it("says so when there are no pages", () => {
    for (const variant of ["sidebar", "centered", "reference"] as const) {
      const { unmount } = render(<DocsLayout groups={[]} variant={variant} />)
      expect(screen.getByText("There are no pages here yet.")).toBeInTheDocument()
      unmount()
    }
  })

  it("does not put its props on the DOM node", () => {
    const { container } = render(<DocsLayout groups={GROUPS} brandName="Docs" />)
    expect(root(container)).not.toHaveAttribute("groups")
    expect(root(container)).not.toHaveAttribute("brandName")
  })
})

describe("sidebar", () => {
  it("marks the current page and swaps it when the nav is pressed", async () => {
    const onNavigate = vi.fn()
    render(<DocsLayout groups={GROUPS} onNavigate={onNavigate} />)
    const nav = screen.getByRole("navigation", { name: "Documentation" })
    expect(within(nav).getByRole("button", { name: "Page one" })).toHaveAttribute("aria-current", "page")
    await userEvent.click(within(nav).getByRole("button", { name: "Page two" }))
    expect(onNavigate).toHaveBeenCalledWith("two")
    expect(within(nav).getByRole("button", { name: "Page two" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("button", { name: "Page one" })).not.toHaveAttribute("aria-current")
    const title = screen.getByRole("heading", { level: 1 })
    expect(title).toHaveTextContent("Page two")
    await waitFor(() => expect(title).toHaveFocus())
    expect(Element.prototype.scrollTo).toHaveBeenCalledWith({ top: 0 })
  })

  it("does not take focus on arrival", () => {
    render(<DocsLayout groups={GROUPS} />)
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveFocus()
  })

  it("lists this page in the table of contents, marks the jump and moves focus to it", async () => {
    render(<DocsLayout groups={GROUPS} />)
    const toc = screen.getAllByRole("navigation", { name: "On this page" })[0]
    await userEvent.click(within(toc).getByRole("link", { name: "Beta" }))
    expect(within(toc).getByRole("link", { name: "Beta" })).toHaveAttribute("aria-current", "location")
    expect(screen.getByRole("heading", { level: 2, name: "Beta" })).toHaveFocus()
  })

  it("follows the reading position", () => {
    render(<DocsLayout groups={GROUPS} />)
    const toc = screen.getAllByRole("navigation", { name: "On this page" })[0]
    const heading = screen.getByRole("heading", { level: 2, name: "Beta" })
    act(() => {
      intersections.forEach((callback) =>
        callback([{ target: heading, isIntersecting: true, boundingClientRect: { top: 10 }, rootBounds: { top: 0 } } as unknown as IntersectionObserverEntry]),
      )
    })
    expect(within(toc).getByRole("link", { name: "Beta" })).toHaveAttribute("aria-current", "location")
  })

  it("moves through pages with the links at the end", async () => {
    render(<DocsLayout groups={GROUPS} />)
    await userEvent.click(screen.getByRole("button", { name: /Next.*Page two/ }))
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page two")
    expect(screen.getByRole("button", { name: /Previous.*Page one/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Next/ })).not.toBeInTheDocument()
  })

  it("collapses to a drawer when the block is narrow, and returns focus after Escape", async () => {
    blockWidth = 375
    const { container } = render(<DocsLayout groups={GROUPS} />)
    expect(container.querySelector('aside[data-slot="sidebar"]')).toBeNull()
    const trigger = await screen.findByRole("button", { name: "Pages" })
    await userEvent.click(trigger)
    const drawer = await screen.findByRole("dialog")
    expect(within(drawer).getByRole("button", { name: "Page two" })).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it("closes the drawer on a choice and sends focus to the new page", async () => {
    blockWidth = 375
    render(<DocsLayout groups={GROUPS} />)
    await userEvent.click(await screen.findByRole("button", { name: "Pages" }))
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Page two" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveFocus())
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page two")
  })

  it("folds the table of contents above the article when there is no room beside it", async () => {
    render(<DocsLayout groups={GROUPS} />)
    const fold = screen.getByRole("button", { name: "On this page" })
    expect(fold).toHaveAttribute("aria-expanded", "false")
    await userEvent.click(fold)
    expect(screen.getAllByRole("navigation", { name: "On this page" })).toHaveLength(2)
  })
})

describe("centered", () => {
  it("is one column with no nav list, and still moves between pages", async () => {
    const { container } = render(<DocsLayout groups={GROUPS} variant="centered" />)
    expect(container.querySelector('[data-slot="sidebar"]')).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: /Next.*Page two/ }))
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page two")
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveFocus())
  })

  it("reacts to a jump in the guide list", async () => {
    render(<DocsLayout groups={GROUPS} variant="centered" />)
    const toc = screen.getByRole("navigation", { name: "In this guide" })
    await userEvent.click(within(toc).getByRole("link", { name: "Beta" }))
    expect(within(toc).getByRole("link", { name: "Beta" })).toHaveAttribute("aria-current", "location")
  })
})

describe("reference", () => {
  it("keeps each block of code in the same row as its text", () => {
    render(<DocsLayout groups={GROUPS} variant="reference" />)
    const [first, second] = screen.getAllByTestId("reference-row")
    expect(within(first).getByRole("heading", { name: "Alpha" })).toBeInTheDocument()
    expect(within(first).getByRole("region", { name: "alpha.ts" })).toBeInTheDocument()
    expect(within(second).queryByRole("region")).not.toBeInTheDocument()
  })

  it("names the page above the rail, and reacts to a jump", async () => {
    render(<DocsLayout groups={GROUPS} variant="reference" />)
    const rail = screen.getByRole("navigation", { name: "On this page" })
    expect(within(rail).getByText("Page one")).toBeInTheDocument()
    await userEvent.click(within(rail).getByRole("link", { name: "Beta" }))
    expect(within(rail).getByRole("link", { name: "Beta" })).toHaveAttribute("aria-current", "location")
  })

  it("honours the page the owner asks for", () => {
    render(<DocsLayout groups={GROUPS} variant="reference" current="two" />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page two")
  })
})
