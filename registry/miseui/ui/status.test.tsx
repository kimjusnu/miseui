import { act, render, screen } from "@testing-library/react"
import { Status, type StatusState, type StatusVariant } from "./status"

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

const STATES: readonly StatusState[] = ["online", "away", "busy", "offline", "error"]
const mark = (container: HTMLElement) => container.querySelector("[data-slot='status-mark']") as HTMLElement
const pulse = (container: HTMLElement) => container.querySelector("[data-slot='status-pulse']")

describe("Status", () => {
  it("names each state in words by default", () => {
    render(
      <>
        {STATES.map((state) => (
          <Status key={state} state={state} />
        ))}
      </>,
    )
    for (const word of ["Online", "Away", "Busy", "Offline", "Error"]) expect(screen.getByText(word)).toBeInTheDocument()
  })

  it("gives each state its own silhouette, so colour is not the only signal", () => {
    const shapes = STATES.map((state) => {
      const { container, unmount } = render(<Status state={state} />)
      const html = mark(container).querySelector("svg")?.innerHTML
      unmount()
      return html
    })
    expect(new Set(shapes).size).toBe(STATES.length)
  })

  it("keeps the word for assistive tech when only the mark shows", () => {
    const { container } = render(<Status state="busy" variant="dot" detail="until 3 pm" />)
    expect(screen.getByText("Busy")).toHaveClass("sr-only")
    expect(screen.queryByText("until 3 pm")).not.toBeInTheDocument()
    expect(mark(container)).toHaveAttribute("aria-hidden", "true")
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: StatusVariant) => {
      const { container, unmount } = render(<Status state="online" variant={variant} />)
      const root = container.firstElementChild as HTMLElement
      const result = {
        wordHidden: screen.getByText("Online").className.includes("sr-only"),
        tinted: root.className.includes("bg-emerald"),
        rimmed: root.className.includes("border"),
        boxed: root.className.includes("h-6"),
      }
      unmount()
      return result
    }
    expect(shape("dot")).toEqual({ wordHidden: true, tinted: false, rimmed: false, boxed: false })
    expect(shape("badge")).toEqual({ wordHidden: false, tinted: true, rimmed: false, boxed: true })
    expect(shape("pill")).toEqual({ wordHidden: false, tinted: false, rimmed: true, boxed: true })
    expect(shape("plain")).toEqual({ wordHidden: false, tinted: false, rimmed: false, boxed: false })
  })

  it("takes the word and hue of a custom state from its props", () => {
    const { container } = render(
      <Status state="custom" tone="warning" variant="badge">
        Degraded
      </Status>,
    )
    expect(screen.getByText("Degraded")).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain("bg-amber")
    expect(mark(container).className).toContain("text-amber")
  })

  it("pulses only for a live state, and a custom state can opt in", () => {
    const pulsing = (element: React.ReactElement) => {
      const { container, unmount } = render(element)
      const found = pulse(container) !== null
      unmount()
      return found
    }
    expect(pulsing(<Status state="online" effect="pulse" />)).toBe(true)
    expect(pulsing(<Status state="online" />)).toBe(false)
    expect(pulsing(<Status state="offline" effect="pulse" />)).toBe(false)
    expect(pulsing(<Status state="error" effect="pulse" />)).toBe(false)
    expect(
      pulsing(
        <Status state="custom" tone="danger" effect="pulse" live>
          Recording
        </Status>,
      ),
    ).toBe(true)
  })

  it("stops pulsing under reduced motion", () => {
    setReducedMotion(true)
    const { container } = render(<Status state="online" effect="pulse" />)
    expect(pulse(container)).toBeNull()
    expect(screen.getByText("Online")).toBeInTheDocument()
  })

  it("is only a live region when asked", () => {
    const { rerender } = render(<Status state="away" />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    rerender(<Status state="away" announce />)
    expect(screen.getByRole("status")).toHaveTextContent("Away")
  })
})
