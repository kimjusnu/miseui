import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RingGallery, type RingGalleryEntry, type RingGalleryProps, type RingGalleryVariant } from "./ring-gallery"
import { dragToTurns, nearestTurn, ringDim, ringFacing, ringItemShare, ringLabelOpacity, ringRadius, settleTurn, wrapIndex } from "./ring-gallery-state"

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

const VARIANTS: readonly RingGalleryVariant[] = ["ring", "medallion", "cylinder"]
const ITEMS: readonly RingGalleryEntry[] = [
  { id: "first", label: "First deploy", detail: "Shipped to production" },
  { id: "review", label: "Ten reviews", detail: "Reviewed ten changes" },
  { id: "streak", label: "Thirty days", detail: "A month without a missed day" },
  { id: "mentor", label: "Mentor", detail: "Helped a new teammate" },
  { id: "fix", label: "Bug hunter", detail: "Closed fifty bugs" },
  { id: "docs", label: "Docs hero", detail: "Wrote the setup guide" },
]

function Ring(props: Partial<RingGalleryProps>) {
  return <RingGallery label="Badges" items={ITEMS} {...props} />
}

const selected = () => screen.getByRole("option", { selected: true })

describe("RingGallery helpers", () => {
  it("wraps an index in both directions", () => {
    expect(wrapIndex(-1, 6)).toBe(5)
    expect(wrapIndex(6, 6)).toBe(0)
    expect(wrapIndex(3, 0)).toBe(0)
  })

  it("picks the shorter way round, keeping the turn continuous", () => {
    expect(nearestTurn(0, 5, 6)).toBe(-1)
    expect(nearestTurn(0, 1, 6)).toBe(1)
    expect(nearestTurn(11, 0, 6)).toBe(12)
    expect(nearestTurn(-1, 0, 6)).toBe(0)
  })

  it("grows the radius with the count and shrinks the item to fit the stage", () => {
    expect(ringRadius(12)).toBeGreaterThan(ringRadius(6))
    expect(ringItemShare(12)).toBeLessThan(ringItemShare(6))
    expect(ringRadius(2)).toBeGreaterThan(0)
  })

  it("dims with distance from the front", () => {
    expect(ringFacing(0, 0, 6)).toBeCloseTo(1)
    expect(ringFacing(0, 3, 6)).toBeCloseTo(-1)
    expect(ringDim(1)).toBe(0)
    expect(ringDim(-1)).toBeGreaterThan(ringDim(0))
  })

  it("turns half the ring for a full stage of drag", () => {
    expect(dragToTurns(300, 300, 6)).toBe(3)
    expect(dragToTurns(10, 0, 6)).toBe(0)
  })

  it("limits a flick to one item unless momentum is on", () => {
    expect(settleTurn(2.2, 0, false, 6)).toBe(2)
    expect(settleTurn(2, 20, false, 6)).toBe(3)
    expect(settleTurn(2, 20, true, 6)).toBe(8)
    expect(settleTurn(2, 4, true, 6)).toBe(4)
  })
})

describe("RingGallery", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("is a listbox whose arrow keys move the selection around, wrapping past the ends", async () => {
      const user = userEvent.setup()
      const onIndexChange = vi.fn()
      const { container } = render(<Ring variant={variant} onIndexChange={onIndexChange} />)
      const root = container.querySelector("[data-slot='ring-gallery']")
      expect(root).toHaveAttribute("data-variant", variant)
      const list = screen.getByRole("listbox", { name: "Badges" })
      expect(screen.getAllByRole("option")).toHaveLength(6)
      await user.tab()
      expect(list).toHaveFocus()
      await user.keyboard("{ArrowLeft}")
      expect(onIndexChange).toHaveBeenLastCalledWith(5)
      expect(selected()).toHaveAttribute("aria-label", "Docs hero")
      expect(list).toHaveAttribute("aria-activedescendant", selected().id)
      await user.keyboard("{ArrowRight}")
      expect(selected()).toHaveAttribute("aria-label", "First deploy")
      await user.keyboard("{End}")
      expect(onIndexChange).toHaveBeenLastCalledWith(5)
      await user.keyboard("{Home}")
      expect(onIndexChange).toHaveBeenLastCalledWith(0)
    })

    it("brings an item to the front on click and names it in the caption", async () => {
      const user = userEvent.setup()
      render(<Ring variant={variant} />)
      await user.click(screen.getByRole("option", { name: "Mentor" }))
      expect(selected()).toHaveAttribute("aria-label", "Mentor")
      expect(screen.getByText("Helped a new teammate")).toBeInTheDocument()
    })
  })

  it("builds each variant differently in 3D", () => {
    const shape = (variant: RingGalleryVariant) => {
      const { container, unmount } = render(<Ring variant={variant} />)
      const item = container.querySelector<HTMLElement>("[data-slot='ring-gallery-item']")
      const found = {
        layout: container.querySelector("[data-slot='ring-gallery-stage']")?.getAttribute("data-layout"),
        back: container.querySelector("[data-slot='ring-gallery-back']") !== null,
        inward: item?.style.transform.includes("* -1") ?? false,
      }
      unmount()
      return found
    }
    expect(shape("ring")).toEqual({ layout: "ring", back: true, inward: false })
    expect(shape("medallion")).toEqual({ layout: "medallion", back: false, inward: false })
    expect(shape("cylinder")).toEqual({ layout: "cylinder", back: false, inward: true })
  })

  it.each(VARIANTS)("variant=%s writes a valid stage transform, including a tilt of zero", (variant) => {
    const { container } = render(<Ring variant={variant} />)
    const stage = container.querySelector("[data-slot='ring-gallery-stage'] > div") as HTMLElement
    // useMotionTemplate drops a static 0, which turned this into rotateX(deg) and stopped the cylinder from turning at all.
    expect(stage.style.transform).toMatch(/rotateX\(-?\d+deg\)/)
  })

  it("hides the name on cards turned away from the viewer, where perspective makes it unreadable", () => {
    expect(ringLabelOpacity(1)).toBe(1)
    expect(ringLabelOpacity(0.5)).toBe(0)
    expect(ringLabelOpacity(-1)).toBe(0)
    expect(ringLabelOpacity(0.9)).toBeGreaterThan(0)
    expect(ringLabelOpacity(0.9)).toBeLessThan(1)
  })

  it("moves with the buttons", async () => {
    const user = userEvent.setup()
    render(<Ring />)
    await user.click(screen.getByRole("button", { name: "Next item" }))
    expect(selected()).toHaveAttribute("aria-label", "Ten reviews")
    await user.click(screen.getByRole("button", { name: "Previous item" }))
    await user.click(screen.getByRole("button", { name: "Previous item" }))
    expect(selected()).toHaveAttribute("aria-label", "Docs hero")
  })

  it("spins with a drag and lands on an item", () => {
    render(<Ring />)
    const stage = screen.getByRole("listbox")
    vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({ width: 300 } as DOMRect)
    fireEvent.pointerDown(stage, { clientX: 200, button: 0, pointerId: 1 })
    fireEvent.pointerMove(stage, { clientX: 100, pointerId: 1 })
    fireEvent.pointerUp(stage, { clientX: 100, pointerId: 1 })
    expect(selected()).not.toHaveAttribute("aria-label", "First deploy")
  })

  it("becomes a flat list under reduced motion, with the same selection", async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<Ring />)
    const list = screen.getByRole("listbox", { name: "Badges" })
    expect(list).toHaveAttribute("data-layout", "flat")
    expect(list.querySelector(".transform-3d")).toBeNull()
    await user.click(screen.getByRole("option", { name: "Mentor" }))
    expect(selected()).toHaveTextContent("Mentor")
    await user.tab()
    list.focus()
    await user.keyboard("{ArrowRight}")
    expect(selected()).toHaveTextContent("Bug hunter")
  })

  it("follows a controlled index", async () => {
    const user = userEvent.setup()
    const onIndexChange = vi.fn()
    render(<Ring index={2} onIndexChange={onIndexChange} />)
    await user.click(screen.getByRole("button", { name: "Next item" }))
    expect(onIndexChange).toHaveBeenCalledWith(3)
    expect(selected()).toHaveAttribute("aria-label", "Thirty days")
  })
})
