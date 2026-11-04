import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LogoWall, placeholderLogos, type LogoWallLogo, type LogoWallVariant } from "./logo-wall"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

beforeEach(() => {
  state.reduced = false
})

function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="logo-wall"]') as HTMLElement
const ALL = ["row", "grid", "marquee"] as const

const OWNER_LOGOS: readonly LogoWallLogo[] = [
  { name: "First owner logo", src: "/first.svg" },
  { name: "Second owner logo", src: "/second.svg", href: "/case-study" },
  { name: "Third owner logo", mark: <svg viewBox="0 0 8 8" /> },
  { name: "Wordmark only" },
]

describe("LogoWall", () => {
  it("renders row with no variant, and for a name it does not know", () => {
    const { container: plain } = render(<LogoWall logos={OWNER_LOGOS} />)
    expect(root(plain)).toHaveAttribute("data-variant", "row")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<LogoWall logos={OWNER_LOGOS} variant={unknown as LogoWallVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "row")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants, not only in colour", () => {
    const seen = ALL.map((variant) => {
      const { container } = render(<LogoWall logos={OWNER_LOGOS} variant={variant} />)
      return shape(root(container)).join("|")
    })
    expect(new Set(seen).size).toBe(3)
  })

  it("renders the owner's logos with their accessible names on every variant", () => {
    for (const variant of ALL) {
      const { unmount } = render(<LogoWall logos={OWNER_LOGOS} variant={variant} />)
      expect(screen.getByRole("img", { name: "First owner logo" })).toHaveAttribute("src", "/first.svg")
      expect(screen.getByRole("link", { name: "Second owner logo" })).toHaveAttribute("href", "/case-study")
      expect(screen.getByRole("img", { name: "Third owner logo" })).toBeInTheDocument()
      // getByText also sees the hidden second copy of the marquee.
      expect(screen.getAllByText("Wordmark only")[0]).toBeInTheDocument()
      unmount()
    }
  })

  it("renders nothing at all for an empty list, with no orphaned heading", () => {
    for (const variant of ALL) {
      const { container, unmount } = render(<LogoWall logos={[]} variant={variant} />)
      expect(root(container)).toBeNull()
      expect(screen.queryByRole("heading")).not.toBeInTheDocument()
      unmount()
    }
  })

  it("gives a linked logo a 40 px target and keeps owner props off the DOM node", () => {
    const { container } = render(<LogoWall logos={OWNER_LOGOS} monochrome={false} />)
    expect(screen.getByRole("link").className).toContain("min-h-10")
    expect(root(container)).not.toHaveAttribute("logos")
    expect(root(container)).not.toHaveAttribute("monochrome")
  })

  it("flattens images to one colour unless told not to", () => {
    const { rerender } = render(<LogoWall logos={OWNER_LOGOS} />)
    expect(screen.getByRole("img", { name: "First owner logo" }).className).toContain("brightness-0")
    rerender(<LogoWall logos={OWNER_LOGOS} monochrome={false} />)
    expect(screen.getByRole("img", { name: "First owner logo" }).className).not.toContain("brightness-0")
  })

  it("drops the line on a null title", () => {
    for (const variant of ALL) {
      const { unmount } = render(<LogoWall logos={OWNER_LOGOS} variant={variant} title={null} />)
      expect(screen.queryByRole("heading")).not.toBeInTheDocument()
      unmount()
    }
  })

  describe("placeholders", () => {
    it("read as placeholders both on screen and to a screen reader, and never as a company", () => {
      const { container } = render(<LogoWall logos={placeholderLogos(3)} />)
      expect(screen.getByRole("img", { name: "Placeholder logo 1" })).toHaveTextContent("Logo 1")
      expect(screen.getAllByRole("img")).toHaveLength(3)
      expect(container.querySelector('[data-slot="logo-wall-placeholder"]')?.className).toContain("border-dashed")
    })
  })

  describe("row", () => {
    it("is a list with one line above it", () => {
      render(<LogoWall logos={OWNER_LOGOS} title="Teams." titleQuiet="And more." />)
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Teams. And more.")
      expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(4)
    })
  })

  describe("grid", () => {
    it("gives each logo its own plate", () => {
      render(<LogoWall logos={OWNER_LOGOS} variant="grid" />)
      for (const item of screen.getAllByRole("listitem")) expect(item.className).toContain("rounded-2xl")
    })
  })

  describe("marquee", () => {
    it("runs two copies but reads the list to a screen reader once", () => {
      const { container } = render(<LogoWall logos={OWNER_LOGOS} variant="marquee" />)
      const copies = container.querySelectorAll('[data-slot="marquee-copy"]')
      expect(copies).toHaveLength(2)
      expect(copies[1]).toHaveAttribute("aria-hidden", "true")
      expect(screen.getAllByRole("img", { name: "First owner logo" })).toHaveLength(1)
      expect(screen.getAllByRole("link", { name: "Second owner logo" })).toHaveLength(1)
    })

    it("names the moving group after the title", () => {
      render(<LogoWall logos={OWNER_LOGOS} variant="marquee" title="Teams." />)
      expect(screen.getByRole("group", { name: "Teams." })).toBeInTheDocument()
    })

    it("can be paused from a real button, for touch and keyboard", async () => {
      const { container } = render(<LogoWall logos={OWNER_LOGOS} variant="marquee" />)
      await userEvent.click(screen.getByRole("button", { name: "Pause logos" }))
      expect(container.querySelector('[data-slot="marquee"]')).toHaveAttribute("data-paused", "true")
      await userEvent.click(screen.getByRole("button", { name: "Play logos" }))
      expect(container.querySelector('[data-slot="marquee"]')).not.toHaveAttribute("data-paused")
    })

    it("stops under reduced motion: one still copy, and no pause button left to explain", () => {
      state.reduced = true
      const { container } = render(<LogoWall logos={OWNER_LOGOS} variant="marquee" />)
      expect(container.querySelector('[data-slot="marquee"]')).toHaveAttribute("data-static", "true")
      expect(container.querySelectorAll('[data-slot="marquee-copy"]')).toHaveLength(0)
      expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
      expect(screen.getAllByRole("img", { name: "First owner logo" })).toHaveLength(1)
    })
  })
})
