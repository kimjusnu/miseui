import { renderToString } from "react-dom/server"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Magnet, MagnetGroup, MagnetLayer } from "./magnet"
import { distanceToBox, magnetFalloff, magnetPull, nextLatched } from "./magnet-math"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

const BOX = { left: 100, top: 100, right: 200, bottom: 140 }
type Watch = (entries: { isIntersecting: boolean }[]) => void
const watchers: Watch[] = []

function stubPointer(fine: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: fine, media: query, addEventListener() {}, removeEventListener() {} }))
}

const moveCalls = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([type]) => type === "pointermove").length
const body = () => document.querySelector("[data-slot='magnet-body']") as HTMLElement
const root = () => document.querySelector("[data-slot='magnet']") as HTMLElement
const moveTo = (clientX: number, clientY: number) => fireEvent.pointerMove(document, { clientX, clientY, pointerType: "mouse" })

beforeEach(() => {
  state.reduced = false
  watchers.length = 0
  stubPointer(true)
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Watch) {
        watchers.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ ...BOX, width: 100, height: 40, x: 100, y: 100, toJSON() {} })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const onScreen = (visible: boolean) => act(() => watchers.forEach((watch) => watch([{ isIntersecting: visible }])))

describe("magnet maths", () => {
  it("measures distance to the box edge, zero inside", () => {
    expect(distanceToBox({ x: 150, y: 120 }, BOX)).toBe(0)
    expect(distanceToBox({ x: 230, y: 120 }, BOX)).toBe(30)
    expect(distanceToBox({ x: 203, y: 144 }, BOX)).toBe(5)
  })

  it("falls off from one to nothing, smoothly and only downward", () => {
    expect(magnetFalloff(0, 100)).toBe(1)
    expect(magnetFalloff(100, 100)).toBe(0)
    expect(magnetFalloff(500, 100)).toBe(0)
    expect(magnetFalloff(50, 100)).toBeCloseTo(0.5)
    const samples = [0, 20, 40, 60, 80, 100].map((distance) => magnetFalloff(distance, 100))
    samples.slice(1).forEach((value, index) => expect(value).toBeLessThan(samples[index] as number))
  })

  it("pulls toward the pointer and caps the travel", () => {
    expect(magnetPull({ x: 180, y: 120 }, BOX, 0.5, 1, 100)).toEqual({ x: 15, y: 0 })
    const capped = magnetPull({ x: 400, y: 320 }, BOX, 1, 1, 10)
    expect(Math.hypot(capped.x, capped.y)).toBeCloseTo(10)
  })

  it("latches at a narrow radius and lets go only past a wider one", () => {
    expect(nextLatched(false, 20, 10, 40)).toBe(false)
    expect(nextLatched(false, 10, 10, 40)).toBe(true)
    expect(nextLatched(true, 30, 10, 40)).toBe(true)
    expect(nextLatched(true, 41, 10, 40)).toBe(false)
  })

  it("does not flip back and forth for a pointer resting between the radii", () => {
    const walk = [12, 9, 12, 9, 12, 30, 39, 12].reduce<boolean[]>((seen, distance) => [...seen, nextLatched(seen[seen.length - 1] ?? false, distance, 10, 40)], [])
    expect(walk).toEqual([false, true, true, true, true, true, true, true])
  })
})

describe("Magnet", () => {
  it("asks nothing about the pointer during a server render, so it hydrates", () => {
    const media = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    vi.stubGlobal("matchMedia", media)
    expect(renderToString(<Magnet>Press</Magnet>)).toContain("magnet-body")
    expect(media).not.toHaveBeenCalled()
  })

  it("moves the inner element and never the box that holds its place", async () => {
    render(<Magnet>Press</Magnet>)
    onScreen(true)
    moveTo(190, 120)
    await waitFor(() => expect(body().style.transform).toMatch(/translateX\([1-9]/))
    expect(root().style.transform).toBe("")
  })

  it("does not write anything for a far pointer, or re-render on a stream", async () => {
    render(<Magnet reach={40}>Press</Magnet>)
    onScreen(true)
    moveTo(900, 900)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(body().style.transform === "" || body().style.transform === "none").toBe(true)
  })

  it("adds one passive document listener, only on screen, and removes it", () => {
    const add = vi.spyOn(document, "addEventListener")
    const remove = vi.spyOn(document, "removeEventListener")
    const { unmount } = render(<Magnet>Press</Magnet>)
    expect(moveCalls(add)).toBe(0)
    onScreen(true)
    expect(moveCalls(add)).toBe(1)
    expect(add.mock.calls.find(([type]) => type === "pointermove")?.[2]).toEqual({ passive: true })
    onScreen(false)
    expect(moveCalls(remove)).toBe(1)
    unmount()
    expect(moveCalls(remove)).toBeGreaterThanOrEqual(2)
  })

  it("adds no listener on a touch device or under reduced motion", () => {
    const add = vi.spyOn(document, "addEventListener")
    stubPointer(false)
    const first = render(<Magnet>Press</Magnet>)
    onScreen(true)
    expect(moveCalls(add)).toBe(0)
    first.unmount()
    watchers.length = 0
    stubPointer(true)
    state.reduced = true
    render(<Magnet>Press</Magnet>)
    onScreen(true)
    expect(moveCalls(add)).toBe(0)
  })

  it("ignores a finger", async () => {
    render(<Magnet>Press</Magnet>)
    onScreen(true)
    fireEvent.pointerMove(document, { clientX: 190, clientY: 120, pointerType: "touch" })
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(body().style.transform === "" || body().style.transform === "none").toBe(true)
  })

  it("never takes a click from what is inside or nearby", async () => {
    const inside = vi.fn()
    const neighbour = vi.fn()
    const user = userEvent.setup()
    render(
      <div>
        <Magnet>
          <button type="button" onClick={inside}>
            Inside
          </button>
        </Magnet>
        <button type="button" onClick={neighbour}>
          Neighbour
        </button>
      </div>,
    )
    await user.click(screen.getByRole("button", { name: "Inside" }))
    await user.click(screen.getByRole("button", { name: "Neighbour" }))
    expect(inside).toHaveBeenCalledOnce()
    expect(neighbour).toHaveBeenCalledOnce()
  })

  it("sticky latches once close and releases past the wider radius", () => {
    render(
      <Magnet effect="sticky" reach={100}>
        Press
      </Magnet>,
    )
    onScreen(true)
    moveTo(240, 120)
    expect(root()).not.toHaveAttribute("data-latched")
    moveTo(205, 120)
    expect(root()).toHaveAttribute("data-latched", "true")
    moveTo(240, 120)
    expect(root()).toHaveAttribute("data-latched", "true")
    moveTo(270, 120)
    expect(root()).not.toHaveAttribute("data-latched")
  })

  it("halo leaves the element still and moves a ring around it", async () => {
    render(<Magnet variant="halo">Press</Magnet>)
    onScreen(true)
    const halo = document.querySelector("[data-slot='magnet-halo']") as HTMLElement
    expect(halo).toHaveAttribute("aria-hidden", "true")
    expect(halo).toHaveClass("pointer-events-none")
    moveTo(190, 120)
    await waitFor(() => expect(halo.style.transform).toMatch(/translateX\([1-9]/))
    expect(body().style.transform === "" || body().style.transform === "none").toBe(true)
  })

  it("layers carry an inner part further than the surface", async () => {
    render(
      <Magnet variant="layers" strength={0.2} maxOffset={100}>
        <MagnetLayer depth={2} data-testid="layer">
          Icon
        </MagnetLayer>
      </Magnet>,
    )
    onScreen(true)
    moveTo(190, 120)
    const travel = (element: HTMLElement) => Number(/translateX\(([\d.]+)px\)/.exec(element.style.transform)?.[1] ?? 0)
    const layer = screen.getByTestId("layer")
    await waitFor(() => expect(travel(body())).toBeGreaterThan(1))
    await waitFor(() => expect(travel(layer)).toBeGreaterThan(travel(body()) * 1.5))
  })

  it("a layer outside a magnet renders plainly", () => {
    render(<MagnetLayer data-testid="layer">Icon</MagnetLayer>)
    expect(screen.getByTestId("layer")).toHaveTextContent("Icon")
  })
})

describe("MagnetGroup", () => {
  it("shares one listener across the row and marks items as a field", () => {
    const add = vi.spyOn(document, "addEventListener")
    render(
      <MagnetGroup>
        <Magnet>One</Magnet>
        <Magnet>Two</Magnet>
        <Magnet>Three</Magnet>
      </MagnetGroup>,
    )
    onScreen(true)
    expect(moveCalls(add)).toBe(1)
    expect(document.querySelectorAll("[data-variant='field']")).toHaveLength(3)
  })

  it("moves each item from the shared stream", async () => {
    render(
      <MagnetGroup>
        <Magnet>One</Magnet>
        <Magnet>Two</Magnet>
      </MagnetGroup>,
    )
    onScreen(true)
    moveTo(190, 120)
    const bodies = [...document.querySelectorAll<HTMLElement>("[data-slot='magnet-body']")]
    await waitFor(() => bodies.forEach((element) => expect(element.style.transform).toMatch(/translateX\([1-9]/)))
  })

  it("keeps a field item short of its neighbour, by default less than half of an 8 px gap plus margin", async () => {
    render(
      <MagnetGroup>
        <Magnet>One</Magnet>
      </MagnetGroup>,
    )
    onScreen(true)
    moveTo(200, 120)
    await act(() => new Promise((resolve) => setTimeout(resolve, 700)))
    const travel = Number(/translateX\(([\d.]+)px\)/.exec(body().style.transform)?.[1] ?? 0)
    expect(travel).toBeGreaterThan(3)
    expect(travel).toBeLessThanOrEqual(4.01)
  })

  it("adds no extra box or layout change around children", () => {
    render(
      <Magnet>
        <span>Press</span>
      </Magnet>,
    )
    expect(root()).toHaveClass("inline-block")
    expect(root().children).toHaveLength(1)
  })
})
