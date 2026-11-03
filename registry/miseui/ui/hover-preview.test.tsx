import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HoverPreview, HoverPreviewLink, type HoverPreviewProps, type HoverPreviewVariant } from "./hover-preview"
import { keyboardAnchor, previewPosition, tiltFor } from "./hover-preview-state"

const originalMatchMedia = window.matchMedia
let fineHover = true
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query.includes("hover") ? fineHover : reducedMotion
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

function setPreferences(hover: boolean, motion: boolean) {
  fineHover = hover
  reducedMotion = motion
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setPreferences(true, false))

const VARIANTS: readonly HoverPreviewVariant[] = ["card", "media", "tag"]

function List(props: HoverPreviewProps) {
  return (
    <HoverPreview aria-label="Articles" {...props}>
      <HoverPreviewLink
        href="/search"
        aside="2026"
        preview={{ title: "Rebuilding search", text: "What we changed.", meta: "Six minute read", media: <div>Search picture</div> }}
      >
        Search
      </HoverPreviewLink>
      <HoverPreviewLink href="/billing" preview={{ title: "Billing notes", media: <div>Billing picture</div> }}>
        Billing
      </HoverPreviewLink>
    </HoverPreview>
  )
}

const surface = () => document.querySelector("[data-slot='hover-preview-surface']")
const link = (name: string | RegExp) => screen.getByRole("link", { name })

function hover(element: Element, x = 100, y = 100) {
  fireEvent.pointerEnter(element, { clientX: x, clientY: y, pointerType: "mouse" })
}

describe("hover preview helpers", () => {
  const screenSize = { width: 1000, height: 800 }
  const card = { width: 288, height: 200 }

  it("sits to the right of the pointer, vertically centred on it", () => {
    expect(previewPosition({ x: 100, y: 400 }, card, screenSize)).toEqual({ x: 124, y: 300 })
  })

  it("flips near the right edge and stays inside top and bottom", () => {
    expect(previewPosition({ x: 900, y: 400 }, card, screenSize).x).toBe(588)
    expect(previewPosition({ x: 100, y: 10 }, card, screenSize).y).toBe(16)
    expect(previewPosition({ x: 100, y: 790 }, card, screenSize).y).toBe(584)
  })

  it("never goes off the left edge on a narrow window", () => {
    expect(previewPosition({ x: 200, y: 100 }, card, { width: 320, height: 500 }).x).toBe(16)
  })

  it("limits the lean", () => {
    expect(tiltFor(5)).toBe(3)
    expect(tiltFor(500)).toBe(8)
    expect(tiltFor(-500)).toBe(-8)
  })

  it("anchors to the link text for the keyboard", () => {
    expect(keyboardAnchor({ left: 10, top: 100, width: 100, height: 48 })).toEqual({ x: 110, y: 124 })
    expect(keyboardAnchor({ left: 10, top: 100, width: 900, height: 48 }).x).toBe(250)
  })
})

describe("HoverPreview", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("shows a floating preview on hover, hidden from assistive tech, and hides it on leave", async () => {
      render(<List variant={variant} />)
      expect(screen.getByRole("list", { name: "Articles" })).toHaveAttribute("data-slot", "hover-preview")
      expect(surface()).toBeNull()
      hover(link(/Search/))
      expect(surface()).toHaveAttribute("aria-hidden", "true")
      expect(surface()).toHaveAttribute("data-kind", variant)
      expect(surface()).toHaveClass("pointer-events-none")
      fireEvent.pointerLeave(link(/Search/), { pointerType: "mouse" })
      await waitFor(() => expect(surface()).toBeNull(), { timeout: 3000 })
    })

    it("does nothing at all on a touch device, and the links still work", () => {
      setPreferences(false, false)
      render(<List variant={variant} />)
      hover(link(/Search/))
      fireEvent.pointerMove(link(/Search/), { clientX: 120, clientY: 100, pointerType: "mouse" })
      expect(surface()).toBeNull()
      expect(link(/Search/)).toHaveAttribute("href", "/search")
    })
  })

  it("shows different content per variant", () => {
    const shape = (variant: HoverPreviewVariant) => {
      const { unmount } = render(<List variant={variant} />)
      hover(link(/Search/))
      const found = surface()?.textContent
      unmount()
      return found
    }
    expect(shape("card")).toContain("What we changed.")
    expect(shape("media")).toBe("Search picture")
    expect(shape("tag")).toBe("Rebuilding search, Six minute read")
  })

  it("swaps the content when the pointer moves to another row", () => {
    render(<List />)
    hover(link(/Search/))
    expect(surface()).toHaveTextContent("Rebuilding search")
    fireEvent.pointerLeave(link(/Search/), { pointerType: "mouse" })
    hover(link("Billing"), 100, 160)
    expect(surface()).toHaveTextContent("Billing notes")
  })

  it("ignores a touch pointer even where hover exists", () => {
    render(<List />)
    fireEvent.pointerEnter(link(/Search/), { clientX: 10, clientY: 10, pointerType: "touch" })
    expect(surface()).toBeNull()
  })

  it("dismisses on Escape and stays away until the pointer comes back", async () => {
    render(<List />)
    hover(link(/Search/))
    fireEvent.keyDown(window, { key: "Escape" })
    await waitFor(() => expect(surface()).toBeNull(), { timeout: 3000 })
    fireEvent.pointerMove(link(/Search/), { clientX: 120, clientY: 100, pointerType: "mouse" })
    expect(surface()).toBeNull()
    fireEvent.pointerLeave(link(/Search/), { pointerType: "mouse" })
    hover(link(/Search/))
    expect(surface()).not.toBeNull()
  })

  it("hides when the page scrolls under a still pointer", async () => {
    render(<List />)
    hover(link(/Search/))
    fireEvent.scroll(window)
    await waitFor(() => expect(surface()).toBeNull(), { timeout: 3000 })
  })

  it("shows for keyboard focus and hides on blur", async () => {
    const user = userEvent.setup()
    render(<List />)
    await user.tab()
    expect(link(/Search/)).toHaveFocus()
    expect(surface()).toHaveTextContent("Rebuilding search")
    await user.tab({ shift: true })
    await waitFor(() => expect(surface()).toBeNull(), { timeout: 3000 })
  })

  it("keeps the row readable without the preview", () => {
    render(<List />)
    expect(link(/Search/)).toHaveTextContent("Search2026")
  })

  it("still shows with reduced motion", () => {
    setPreferences(true, true)
    render(<List effect="tilt" />)
    hover(link(/Search/))
    expect(surface()).not.toBeNull()
  })

  it("refuses a link outside the list", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<HoverPreviewLink href="/x" preview={{}}>Lost</HoverPreviewLink>)).toThrow(/inside <HoverPreview>/)
    error.mockRestore()
  })
})
