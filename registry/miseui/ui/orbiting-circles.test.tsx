import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { OrbitingCircles, type OrbitItem, type OrbitingCirclesVariant } from "./orbiting-circles"
import { assignRings, labelPlacement, orbitPose, orbitShape, orbitSlots, poseTransform, ringVelocity, turnToTop } from "./orbiting-circles-math"

const ITEMS: readonly OrbitItem[] = ["Mail", "Files", "Maps", "Music", "Notes", "Photos"].map((label) => ({
  id: label,
  label,
  icon: <svg aria-hidden="true" />,
  href: `#${label}`,
}))
const PLAIN = ITEMS.map((item) => ({ id: item.id, label: item.label, icon: item.icon }))
const VARIANTS: readonly OrbitingCirclesVariant[] = ["ring", "rings", "tilted", "arc"]
const NARROW_CELL = 263
const ITEM_PX = 40

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query.includes("reduced-motion") ? reducedMotion : false
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

afterEach(() => {
  setReducedMotion(false)
})

const itemNodes = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('[data-slot="orbiting-circles-item"]')]

describe("orbit maths", () => {
  it("spaces a single orbit evenly", () => {
    expect(orbitSlots("ring", 4).map((slot) => slot.start)).toEqual([0, 90, 180, 270])
  })

  it("gives inner orbits fewer items, and exactly as many items as asked", () => {
    const radii = orbitShape("rings").radii
    for (const count of [1, 2, 3, 6, 8, 13]) expect(assignRings(count, radii)).toHaveLength(count)
    const six = assignRings(6, radii)
    expect(six.filter((ring) => ring === 0).length).toBeLessThan(six.filter((ring) => ring === 2).length)
  })

  it("runs alternate orbits in opposite directions, the further ones slower", () => {
    expect(ringVelocity(0, 28)).toBeGreaterThan(0)
    expect(ringVelocity(1, 28)).toBeLessThan(0)
    expect(Math.abs(ringVelocity(2, 28))).toBeLessThan(Math.abs(ringVelocity(0, 28)))
  })

  it("fits every orbit plus an item inside the narrowest cell", () => {
    for (const variant of VARIANTS) {
      const outer = Math.max(...orbitShape(variant).radii)
      expect((outer / 100) * NARROW_CELL + ITEM_PX / 2).toBeLessThanOrEqual(NARROW_CELL / 2)
    }
  })

  it("shrinks and dims the far half of a tilted orbit, and sends it behind", () => {
    const slot = { ring: 0, start: 0 }
    const far = orbitPose("tilted", slot, 0)
    const near = orbitPose("tilted", slot, 180)
    expect(far.behind).toBe(true)
    expect(near.behind).toBe(false)
    expect(far.scale).toBeLessThan(near.scale)
    expect(far.opacity).toBeLessThan(near.opacity)
    expect(Math.abs(far.y)).toBeLessThan(far.x === 0 ? 16 : 99)
  })

  it("keeps items upright: the transform holds no rotation", () => {
    expect(poseTransform(orbitPose("ring", { ring: 0, start: 45 }, 30))).not.toContain("rotate")
    expect(poseTransform(orbitPose("tilted", { ring: 0, start: 45 }, 30))).not.toContain("rotate")
  })

  it("fades an arc item out before the bottom edge cuts it in half", () => {
    expect(orbitPose("arc", { ring: 0, start: 90 }, 0).opacity).toBeCloseTo(0, 5)
    expect(orbitPose("arc", { ring: 0, start: 180 }, 0).opacity).toBe(0)
    expect(orbitPose("arc", { ring: 0, start: 0 }, 0).opacity).toBe(1)
    const lowering = orbitPose("arc", { ring: 0, start: 80 }, 0).opacity
    expect(lowering).toBeGreaterThan(0)
    expect(lowering).toBeLessThan(1)
    for (const slot of orbitSlots("arc", 5, true)) expect(orbitPose("arc", slot, 0).opacity).toBe(1)
  })

  it("spreads a still arc across its visible half", () => {
    const slots = orbitSlots("arc", 5, true)
    for (const slot of slots) expect(orbitPose("arc", slot, 0).y).toBeLessThan(0)
  })

  it("takes the short way to bring an item to the top", () => {
    expect(turnToTop(90, 0)).toBe(-90)
    expect(turnToTop(270, 0)).toBe(90)
    expect(turnToTop(350, 20)).toBe(-10)
    expect(orbitPose("arc", { ring: 0, start: 300 }, turnToTop(300, 0)).x).toBeCloseTo(0, 5)
  })

  it("grows a label inward from the rim", () => {
    expect(labelPlacement(30, -30, 50)).toEqual({ side: "end", below: true })
    expect(labelPlacement(-30, 30, 50)).toEqual({ side: "start", below: false })
    expect(labelPlacement(0, -30, 100)).toEqual({ side: "center", below: false })
  })
})

describe("OrbitingCircles", () => {
  it("places items in the first server frame, already spread out", () => {
    const html = renderToString(<OrbitingCircles items={ITEMS} />)
    const places = [...html.matchAll(/translate\(-50%, -50%\) translate\(([-\d.]+)cqw, ([-\d.]+)cqw\)/g)].map((match) => `${match[1]},${match[2]}`)
    expect(places).toHaveLength(ITEMS.length)
    expect(new Set(places).size).toBe(ITEMS.length)
  })

  it("draws a different structure per variant", () => {
    const shapes = VARIANTS.map((variant) => {
      const { container, unmount } = render(<OrbitingCircles variant={variant} items={ITEMS} paused />)
      const root = container.firstElementChild as HTMLElement
      const shape = { variant: root.dataset.variant, lines: container.querySelectorAll('[data-slot="orbiting-circles-line"]').length, svg: container.querySelectorAll('svg[data-slot="orbiting-circles-line"]').length, clipped: root.className.includes("overflow-clip") }
      unmount()
      return shape
    })
    expect(shapes.map((shape) => shape.lines)).toEqual([1, 3, 2, 1])
    expect(shapes[2]?.svg).toBe(2)
    expect(shapes[3]?.clipped).toBe(true)
  })

  it("names every item, as links when given a href", () => {
    render(<OrbitingCircles items={ITEMS} label="Connected apps" paused />)
    expect(screen.getByRole("group", { name: "Connected apps" })).toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length)
    expect(screen.getByRole("link", { name: "Mail" })).toHaveAttribute("href", "#Mail")
  })

  it("moves items through direct style writes while playing, and holds them when paused", async () => {
    const { container, rerender } = render(<OrbitingCircles items={ITEMS} seconds={1} />)
    const first = itemNodes(container)[0] as HTMLElement
    const before = first.style.transform
    await waitFor(() => expect(first.style.transform).not.toBe(before))
    rerender(<OrbitingCircles items={ITEMS} seconds={1} paused />)
    const held = first.style.transform
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(first.style.transform).toBe(held)
  })

  it("stops under focus, so a moving link can be caught, and starts again on blur", async () => {
    const user = userEvent.setup()
    const { container } = render(<OrbitingCircles items={ITEMS} seconds={1} />)
    const node = itemNodes(container)[0] as HTMLElement
    await user.tab()
    expect(screen.getByRole("link", { name: "Mail" })).toHaveFocus()
    // Speed eases to zero, so give it a moment before reading.
    await new Promise((resolve) => setTimeout(resolve, 700))
    const held = node.style.transform
    await new Promise((resolve) => setTimeout(resolve, 80))
    const heldTurn = (value: string) => Number(value.match(/cqw, ([-\d.]+)cqw/)?.[1])
    expect(Math.abs(heldTurn(node.style.transform) - heldTurn(held))).toBeLessThan(0.6)
    await user.tab({ shift: true })
    const moving = node.style.transform
    await waitFor(() => expect(node.style.transform).not.toBe(moving))
  })

  it("shows the label on hover and focus with the effect, and not without", async () => {
    const user = userEvent.setup()
    const { container, unmount } = render(<OrbitingCircles effect="hover" items={PLAIN} paused />)
    fireEvent.pointerEnter(itemNodes(container)[1] as HTMLElement)
    expect(screen.getByText("Files")).toHaveAttribute("data-slot", "orbiting-circles-label")
    fireEvent.pointerLeave(itemNodes(container)[1] as HTMLElement)
    expect(screen.queryByText("Files")).toBeNull()
    await user.tab()
    expect(screen.getByRole("img", { name: "Mail" })).toHaveFocus()
    expect(screen.getByText("Mail")).toBeInTheDocument()
    unmount()
    const plain = render(<OrbitingCircles items={PLAIN} paused />)
    fireEvent.pointerEnter(itemNodes(plain.container)[1] as HTMLElement)
    expect(screen.queryByText("Files")).toBeNull()
    expect(screen.getByRole("img", { name: "Mail" })).not.toHaveAttribute("tabindex")
  })

  it("keeps the label after a tap lifts, while focus stays", async () => {
    const { container } = render(<OrbitingCircles effect="hover" items={PLAIN} paused />)
    const item = screen.getByRole("img", { name: "Maps" })
    const node = itemNodes(container)[2] as HTMLElement
    fireEvent.pointerEnter(node)
    act(() => item.focus())
    fireEvent.pointerLeave(node)
    await waitFor(() => expect(screen.getByText("Maps")).toBeInTheDocument())
  })

  it("holds a readable still frame under reduced motion, with the arc fully in view", async () => {
    setReducedMotion(true)
    const { container } = render(<OrbitingCircles variant="arc" items={ITEMS} seconds={1} />)
    const first = itemNodes(container)[0] as HTMLElement
    await waitFor(() => expect(first.style.transform).not.toContain(", -42.00cqw"))
    expect(container.firstElementChild).not.toHaveAttribute("data-playing")
    const ys = itemNodes(container).map((node) => Number(node.style.transform.match(/cqw, ([-\d.]+)cqw/)?.[1]))
    for (const y of ys) expect(y).toBeLessThan(0)
    const held = first.style.transform
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(first.style.transform).toBe(held)
  })
})
