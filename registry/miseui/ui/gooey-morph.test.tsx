import { render, screen } from "@testing-library/react"
import { GooeyMorph } from "./gooey-morph"

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

const ITEMS = [{ id: "draft", label: "Draft" }, { id: "review", label: "Review" }, { id: "done" }] as const

describe("GooeyMorph", () => {
  it("draws one dot per item and names the group after them", () => {
    render(<GooeyMorph items={ITEMS} />)
    expect(screen.getAllByTestId("gooey-dot")).toHaveLength(3)
    expect(screen.getByRole("img", { name: "Draft, Review, done" })).toHaveAttribute("data-slot", "gooey-morph")
  })

  it("reports whether the dots are merged", () => {
    const { rerender } = render(<GooeyMorph items={ITEMS} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-merged", "false")
    rerender(<GooeyMorph items={ITEMS} merged />)
    expect(screen.getByRole("img")).toHaveAttribute("data-merged", "true")
  })

  it("gives every instance its own filter so two on one page never share", () => {
    render(
      <>
        <GooeyMorph items={ITEMS} />
        <GooeyMorph items={ITEMS} />
      </>,
    )
    const ids = Array.from(document.querySelectorAll("filter"), (filter) => filter.id)
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
    const fields = screen.getAllByTestId("gooey-field")
    expect(fields[0].style.filter).toContain(`#${ids[0]}`)
    expect(fields[1].style.filter).toContain(`#${ids[1]}`)
  })

  it("drops the filter and snaps into place under reduced motion", () => {
    setReducedMotion(true)
    render(<GooeyMorph items={ITEMS} merged />)
    expect(screen.getByRole("img")).toHaveAttribute("data-reduced", "true")
    expect(document.querySelector("filter")).toBeNull()
    expect(screen.getByTestId("gooey-field").style.filter).toBe("")
  })
})
