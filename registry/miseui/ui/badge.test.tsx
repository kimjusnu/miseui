import { render, screen, waitFor } from "@testing-library/react"
import { Badge } from "./badge"

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

const badgeEl = () => document.querySelector("[data-slot='badge']") as HTMLElement

describe("Badge", () => {
  it("renders its text with the badge slot", () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText("New")
    expect(badge).toHaveAttribute("data-slot", "badge")
    expect(badge.tagName).toBe("SPAN")
  })

  it("falls back to the default variant", () => {
    render(<Badge>Draft</Badge>)
    expect(screen.getByText("Draft")).toHaveAttribute("data-variant", "default")
  })

  it("exposes the chosen variant as a data attribute and class", () => {
    render(<Badge variant="mise">Beta</Badge>)
    const badge = screen.getByText("Beta")
    expect(badge).toHaveAttribute("data-variant", "mise")
    expect(badge).toHaveClass("bg-mise")
  })

  it("renders the child element when asChild is set", () => {
    render(
      <Badge asChild variant="outline">
        <a href="/changelog">Changelog</a>
      </Badge>,
    )
    const link = screen.getByRole("link", { name: "Changelog" })
    expect(link).toHaveAttribute("data-slot", "badge")
    expect(link).toHaveAttribute("data-variant", "outline")
  })

  it("adds no effect attribute and no wrapper by default", () => {
    const { container } = render(<Badge>Plain</Badge>)
    const badge = screen.getByText("Plain")
    expect(badge).not.toHaveAttribute("data-effect")
    expect(badge.parentElement).toBe(container)
  })
})

describe("Badge effect=glow", () => {
  it("puts a pulsing halo behind the badge", () => {
    render(<Badge effect="glow">New</Badge>)
    const badge = screen.getByText("New")
    expect(badge).toHaveAttribute("data-effect", "glow")
    const halo = screen.getByTestId("badge-halo")
    expect(halo).toHaveClass("bg-mise", "blur-md")
    expect(halo).toHaveAttribute("data-reduced", "false")
    expect(halo.parentElement).toContainElement(badge)
  })

  it("holds the halo still under reduced motion", () => {
    setReducedMotion(true)
    render(<Badge effect="glow">New</Badge>)
    expect(screen.getByTestId("badge-halo")).toHaveAttribute("data-reduced", "true")
  })

  it("drops the blurred halo for reduced transparency", () => {
    render(<Badge effect="glow">New</Badge>)
    expect(screen.getByTestId("badge-halo")).toHaveClass("[@media(prefers-reduced-transparency:reduce)]:hidden")
  })

  it("carries a custom radius out to the halo's frame", () => {
    render(
      <Badge effect="glow" className="rounded-full">
        New
      </Badge>,
    )
    expect(screen.getByTestId("badge-halo").parentElement).toHaveClass("rounded-full")
  })
})

describe("Badge effect=beam", () => {
  it("wraps the badge in a beam border", () => {
    render(<Badge effect="beam">Syncing</Badge>)
    const badge = screen.getByText("Syncing")
    expect(badge).toHaveAttribute("data-effect", "beam")
    expect(badge.parentElement).toHaveAttribute("data-slot", "beam-border")
    expect(screen.getByTestId("beam-layer")).toBeInTheDocument()
  })

  it("keeps asChild, with the slot on the child inside the frame", () => {
    render(
      <Badge asChild effect="beam">
        <a href="/sync">Syncing</a>
      </Badge>,
    )
    const link = screen.getByRole("link", { name: "Syncing" })
    expect(link).toHaveAttribute("data-slot", "badge")
    expect(link.parentElement).toHaveAttribute("data-slot", "beam-border")
  })
})

describe("Badge effect=count", () => {
  it("shows the number crisp at rest, and readable to assistive tech", () => {
    render(<Badge effect="count">{12}</Badge>)
    expect(badgeEl()).toHaveAttribute("data-effect", "count")
    expect(screen.getByTestId("badge-count")).toHaveTextContent("12")
    expect(screen.getByTestId("badge-count")).toHaveAttribute("aria-hidden", "true")
    expect(badgeEl().querySelector(".sr-only")).toHaveTextContent("12")
    screen.getAllByTestId("badge-digit").forEach((digit) => {
      expect(digit).toHaveAttribute("data-morphing", "false")
      expect(digit.style.filter).toBe("")
    })
  })

  it("runs only the changed digit through the goo, then settles on the new number", async () => {
    const { rerender } = render(<Badge effect="count">{12}</Badge>)
    rerender(<Badge effect="count">{13}</Badge>)
    const [tens, units] = screen.getAllByTestId("badge-digit")
    expect(tens).toHaveAttribute("data-morphing", "false")
    expect(units).toHaveAttribute("data-morphing", "true")
    const filter = document.querySelector("filter") as SVGFilterElement
    expect(units.style.filter).toContain(`#${filter.id}`)
    expect(badgeEl().querySelector(".sr-only")).toHaveTextContent("13")
    await waitFor(() => expect(units).toHaveAttribute("data-morphing", "false"))
    expect(screen.getByTestId("badge-count")).toHaveTextContent("13")
    expect(units.style.filter).toBe("")
  })

  it("gains a digit on the left and keeps units in place", async () => {
    const { rerender } = render(<Badge effect="count">{9}</Badge>)
    rerender(<Badge effect="count">{10}</Badge>)
    expect(screen.getAllByTestId("badge-digit")).toHaveLength(2)
    await waitFor(() => expect(screen.getByTestId("badge-count")).toHaveTextContent("10"))
  })

  it("swaps with no filter at all under reduced motion", async () => {
    setReducedMotion(true)
    const { rerender } = render(<Badge effect="count">{1}</Badge>)
    rerender(<Badge effect="count">{2}</Badge>)
    expect(document.querySelector("filter")).toBeNull()
    expect(screen.getByTestId("badge-digit").style.filter).toBe("")
    await waitFor(() => expect(screen.getByTestId("badge-count")).toHaveTextContent("2"))
  })

  it("renders plain when the children are not text or when asChild is set", () => {
    render(
      <>
        <Badge effect="count">
          <b>x</b>
        </Badge>
        <Badge asChild effect="count">
          <a href="/inbox">3</a>
        </Badge>
      </>,
    )
    expect(screen.queryByTestId("badge-count")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("data-slot", "badge")
  })
})

describe("Badge effect=live", () => {
  it("puts a breathing dot inside the badge, before the text and hidden from assistive tech", () => {
    render(<Badge effect="live">Recording</Badge>)
    const badge = screen.getByText("Recording")
    const dot = screen.getByTestId("badge-live-dot")
    expect(badge).toHaveAttribute("data-effect", "live")
    expect(badge.firstElementChild).toBe(dot)
    expect(dot).toHaveAttribute("aria-hidden", "true")
    expect(dot).toHaveAttribute("data-reduced", "false")
  })

  it("holds the dot still under reduced motion", () => {
    setReducedMotion(true)
    render(<Badge effect="live">Recording</Badge>)
    expect(screen.getByTestId("badge-live-dot")).toHaveAttribute("data-reduced", "true")
  })

  it("adds the dot inside the child under asChild", () => {
    render(
      <Badge asChild effect="live">
        <a href="/stream">Stream</a>
      </Badge>,
    )
    const link = screen.getByRole("link", { name: "Stream" })
    expect(link).toHaveAttribute("data-slot", "badge")
    expect(link).toContainElement(screen.getByTestId("badge-live-dot"))
  })

  it("takes the ink colour on the warm surface, where a mise dot would vanish", () => {
    render(
      <Badge effect="live" variant="mise">
        Live
      </Badge>,
    )
    expect(screen.getByTestId("badge-live-dot").lastElementChild).toHaveClass("bg-current")
  })
})
