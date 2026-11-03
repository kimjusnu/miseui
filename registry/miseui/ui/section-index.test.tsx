import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SectionIndex, type SectionIndexProps } from "./section-index"
import { atScrollEnd, currentSection, overallProgress, sectionProgress, sectionStatus } from "./section-index-math"

const ITEMS = [
  { id: "problem", title: "The problem" },
  { id: "approach", title: "The approach", no: "B" },
  { id: "result", title: "The result" },
]

/** jsdom has no layout. Each section reports where the test says it is; the reading line sits at 40 % of 1000 px. */
function place(tops: Record<string, number>) {
  Object.entries(tops).forEach(([id, top]) => {
    const element = document.getElementById(id) as HTMLElement
    element.getBoundingClientRect = () => ({ top, height: 500, left: 0, right: 0, bottom: top + 500, width: 0, x: 0, y: top, toJSON: () => ({}) })
  })
}

function scrollTo(tops: Record<string, number>) {
  place(tops)
  act(() => {
    fireEvent.scroll(window)
  })
}

function Page(props: Partial<SectionIndexProps>) {
  return (
    <>
      <SectionIndex items={ITEMS} {...props} />
      {ITEMS.map((item) => (
        <section key={item.id} id={item.id}>
          {item.title}
        </section>
      ))}
    </>
  )
}

const originalScrollTo = window.scrollTo
const originalInnerHeight = window.innerHeight

beforeEach(() => {
  window.scrollTo = vi.fn()
  window.innerHeight = 1000
})

afterEach(() => {
  window.scrollTo = originalScrollTo
  window.innerHeight = originalInnerHeight
})

const link = (name: RegExp) => screen.getByRole("link", { name })

describe("SectionIndex", () => {
  it("is a named landmark of numbered links, using the given label when there is one", () => {
    render(<Page label="Chapters" />)
    expect(screen.getByRole("navigation", { name: "Chapters" })).toBeInTheDocument()
    expect(link(/The problem/)).toHaveTextContent("01")
    expect(link(/The approach/)).toHaveTextContent("B")
    expect(link(/The result/)).toHaveAttribute("href", "#result")
  })

  it("marks finished, current and coming sections as the page scrolls", async () => {
    render(<Page />)
    scrollTo({ problem: -700, approach: -200, result: 800 })
    await waitFor(() => expect(link(/The approach/)).toHaveAttribute("aria-current", "location"))
    expect(link(/The problem/)).toHaveAttribute("data-status", "done")
    expect(link(/The result/)).toHaveAttribute("data-status", "ahead")
    expect(link(/The result/)).not.toHaveAttribute("aria-current")
    // A finished section keeps its fill; one still ahead has none.
    expect(link(/The problem/).parentElement?.querySelector("[data-slot='section-index-fill']")).not.toBeNull()
    expect(link(/The result/).parentElement?.querySelector("[data-slot='section-index-fill']")).toBeNull()
  })

  it("jumps to a section, holds there and moves focus into it", async () => {
    const onNavigate = vi.fn()
    render(<Page onNavigate={onNavigate} />)
    place({ problem: 100, approach: 600, result: 1100 })
    await userEvent.click(link(/The result/))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 1084, behavior: "smooth" })
    expect(link(/The result/)).toHaveAttribute("aria-current", "location")
    expect(document.getElementById("result")).toHaveFocus()
    expect(onNavigate).toHaveBeenCalledWith("result")
    // The scroll passing an earlier section does not pull the marker back.
    scrollTo({ problem: -100, approach: 200, result: 700 })
    expect(link(/The result/)).toHaveAttribute("aria-current", "location")
  })

  it("draws a different structure for each variant", () => {
    const { rerender } = render(<Page variant="rail" />)
    expect(document.querySelector("[data-slot='section-index-rail']")).not.toBeNull()

    rerender(<Page variant="strip" />)
    expect(document.querySelector("[data-slot='section-index-strip']")?.className).toContain("overflow-x-auto")
    expect(screen.getAllByRole("link")).toHaveLength(3)

    rerender(<Page variant="counter" />)
    expect(screen.getAllByRole("link")).toHaveLength(1)
    expect(document.querySelector("[data-slot='section-index-counter']")).toHaveTextContent("01 / 03")
  })

  it("steps through sections from the keyboard in the counter", async () => {
    render(<Page variant="counter" />)
    scrollTo({ problem: -200, approach: 800, result: 1400 })
    const previous = await screen.findByRole("button", { name: "Previous section" })
    const next = screen.getByRole("button", { name: "Next section" })
    expect(previous).toBeDisabled()
    next.focus()
    await userEvent.keyboard("{Enter}")
    expect(document.querySelector("[data-slot='section-index-counter']")).toHaveTextContent("B / 03")
    expect(screen.getByRole("link")).toHaveTextContent("The approach")
  })

  it("fills only the current section from the scroll with the progress effect", async () => {
    render(<Page effect="progress" />)
    scrollTo({ problem: -700, approach: 150, result: 800 })
    await waitFor(() => expect(link(/The approach/)).toHaveAttribute("aria-current", "location"))
    const fill = (name: RegExp) => link(name).parentElement?.querySelector("[data-slot='section-index-fill']")
    expect(fill(/The problem/)).not.toHaveAttribute("data-live")
    expect(fill(/The approach/)).toHaveAttribute("data-live", "true")
    await waitFor(() => expect((fill(/The approach/) as HTMLElement).style.transform).toContain("scaleY(0.5)"))
  })

  it("follows its own scroller when it is given one", async () => {
    function Panel() {
      const scrollRef = { current: document.getElementById("panel") as HTMLElement | null }
      return <SectionIndex items={ITEMS} scrollRef={scrollRef} />
    }
    const panel = document.createElement("div")
    panel.id = "panel"
    panel.scrollTo = vi.fn()
    document.body.append(panel)
    render(
      <>
        <Panel />
        {ITEMS.map((item) => (
          <section key={item.id} id={item.id} />
        ))}
      </>,
    )
    Object.defineProperty(panel, "clientHeight", { value: 200 })
    place({ problem: -10, approach: 40, result: 400 })
    act(() => {
      fireEvent.scroll(panel)
    })
    await waitFor(() => expect(link(/The approach/)).toHaveAttribute("aria-current", "location"))
    panel.remove()
  })

  it("renders nothing with no sections", () => {
    render(<SectionIndex items={[]} />)
    expect(screen.queryByRole("navigation")).toBeNull()
  })

  it("works out position, progress and status", () => {
    const boxes = [{ top: -600, height: 500 }, { top: -100, height: 500 }, { top: 500, height: 500 }]
    expect(currentSection(boxes, 400, false)).toBe(1)
    expect(currentSection(boxes, -700, false)).toBe(-1)
    expect(currentSection(boxes, 0, true)).toBe(2)
    expect(sectionProgress(boxes[1], 150)).toBe(0.5)
    expect(sectionProgress(undefined, 150)).toBe(0)
    expect(overallProgress(1, 0.5, 3)).toBe(0.5)
    expect(overallProgress(-1, 0.5, 3)).toBe(0)
    expect(sectionStatus(0, 1)).toBe("done")
    expect(sectionStatus(1, 1)).toBe("current")
    expect(sectionStatus(2, 1)).toBe("ahead")
    expect(atScrollEnd(0, 800, 800)).toBe(false)
    expect(atScrollEnd(200, 800, 1000)).toBe(true)
  })
})
