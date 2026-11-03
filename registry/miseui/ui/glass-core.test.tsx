import { act, fireEvent, render } from "@testing-library/react"
import { GlassCore, type GlassCoreVariant } from "./glass-core"
import { buildKnot, knotAngles, knotPoint, leanFrom, projectKnot, rotatePoint } from "./glass-core-knot"
import { rasterizeKnot } from "./glass-core-raster"

const originalMatchMedia = window.matchMedia
const originalGetContext = HTMLCanvasElement.prototype.getContext
let reducedMotion = false
let reducedTransparency = false
const changeListeners: Array<() => void> = []

function fakeContext() {
  return {
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([200, 120, 40, 255]) })),
    createImageData: vi.fn((width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) })),
    putImageData: vi.fn(),
    fillStyle: "",
  }
}

let context = fakeContext()
const frames: FrameRequestCallback[] = []

function runFrame(time = 16) {
  const pending = frames.splice(0)
  act(() => pending.forEach((callback) => callback(time)))
  return pending.length
}

class ObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ObserverStub)
  vi.stubGlobal("IntersectionObserver", ObserverStub)
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal("cancelAnimationFrame", vi.fn())
  // jsdom has no layout, and a canvas of no size has nothing to paint.
  Object.defineProperty(HTMLCanvasElement.prototype, "clientWidth", { configurable: true, value: 32 })
  HTMLCanvasElement.prototype.getContext = vi.fn(() => context) as unknown as typeof HTMLCanvasElement.prototype.getContext
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query.includes("transparency") ? reducedTransparency : reducedMotion
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
  vi.unstubAllGlobals()
  HTMLCanvasElement.prototype.getContext = originalGetContext
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setPreferences(motion: boolean, transparency: boolean) {
  reducedMotion = motion
  reducedTransparency = transparency
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => {
  setPreferences(false, false)
  frames.splice(0)
  context = fakeContext()
})

const VARIANTS: readonly GlassCoreVariant[] = ["knot", "orb", "panes"]

describe("GlassCore helpers", () => {
  it("keeps the knot inside its unit box and closes the loop", () => {
    const points = buildKnot(64)
    expect(points).toHaveLength(64)
    points.forEach((point) => expect(Math.hypot(point.x, point.y, point.z)).toBeLessThanOrEqual(1.01))
    const start = knotPoint(0)
    const end = knotPoint(Math.PI * 2)
    expect(end.x).toBeCloseTo(start.x)
    expect(end.y).toBeCloseTo(start.y)
  })

  it("preserves length under rotation", () => {
    const turned = rotatePoint({ x: 0.3, y: 0.4, z: 0.5 }, 0.7, 1.2)
    expect(Math.hypot(turned.x, turned.y, turned.z)).toBeCloseTo(Math.hypot(0.3, 0.4, 0.5))
  })

  it("projects the whole path inside the canvas", () => {
    const beads = projectKnot(buildKnot(90), 0.5, 0.4, 300)
    expect(beads).toHaveLength(90)
    beads.forEach((bead) => {
      expect(bead.x).toBeGreaterThan(0)
      expect(bead.x).toBeLessThan(300)
      expect(bead.y).toBeGreaterThan(0)
      expect(bead.y).toBeLessThan(300)
    })
  })

  const SHADE = { accent: [240, 140, 40], surface: [255, 255, 255], solid: false } as const
  const SIZE = 120
  const line = (axis: "x" | "y", depth: number) =>
    Array.from({ length: 60 }, (_, step) => ({
      x: axis === "x" ? step * 2 : SIZE / 2,
      y: axis === "x" ? SIZE / 2 : step * 2,
      depth,
      scale: 1,
    }))
  const paint = (beads: Parameters<typeof rasterizeKnot>[0], shade: Parameters<typeof rasterizeKnot>[2] = SHADE) => {
    const data = new Uint8ClampedArray(SIZE * SIZE * 4)
    rasterizeKnot(beads, SIZE, shade, data)
    return (x: number, y: number) => [...data.slice((y * SIZE + x) * 4, (y * SIZE + x) * 4 + 4)]
  }

  it("fills the tube and leaves the rest of the canvas clear", () => {
    const at = paint(line("x", 0))
    expect(at(40, SIZE / 2)[3]).toBeGreaterThan(200)
    expect(at(40, 5)[3]).toBe(0)
  })

  it("shades the same across the whole length of a straight strand, so there are no seams or blobs", () => {
    const at = paint(line("x", 0))
    const offset = SIZE / 2 - 3
    const first = at(30, offset)
    for (const x of [40, 50, 60, 70, 80]) expect(at(x, offset)).toEqual(first)
  })

  it("lets the nearer strand win a crossing, whichever is drawn first", () => {
    const near = paint(line("x", 1))(SIZE / 2, SIZE / 2)
    expect(paint([...line("x", 1), ...line("y", -1)])(SIZE / 2, SIZE / 2)).toEqual(near)
    expect(paint([...line("y", -1), ...line("x", 1)])(SIZE / 2, SIZE / 2)).toEqual(near)
  })

  it("rounds a strand that folds back on screen, instead of fanning into spikes at the tip", () => {
    const out = Array.from({ length: 40 }, (_, step) => ({ x: 20 + step * 2, y: 60, depth: 0, scale: 1 }))
    const back = Array.from({ length: 40 }, (_, step) => ({ x: 98 - step * 2, y: 60.5, depth: 0.2, scale: 1 }))
    const at = paint([...out, ...back])
    const radius = (SIZE * 0.11) / 2
    for (const degrees of [-70, -45, -20, 0, 20, 45, 70]) {
      const angle = (degrees * Math.PI) / 180
      const x = Math.round(98 + Math.cos(angle) * radius * 0.8)
      const y = Math.round(60 + Math.sin(angle) * radius * 0.8)
      expect(at(x, y)[3], `gap at ${degrees} degrees`).toBeGreaterThan(200)
    }
  })

  it("fades a far strand toward the page and drops the highlight when solid", () => {
    const channelSum = (pixel: number[]) => (pixel[0] ?? 0) + (pixel[1] ?? 0) + (pixel[2] ?? 0)
    expect(channelSum(paint(line("x", -1))(40, SIZE / 2))).toBeGreaterThan(channelSum(paint(line("x", 1))(40, SIZE / 2)))
    const brightest = (shade: Parameters<typeof rasterizeKnot>[2]) => {
      const at = paint(line("x", 0), shade)
      return Math.max(...Array.from({ length: 24 }, (_, step) => channelSum(at(40, SIZE / 2 - 12 + step))))
    }
    expect(brightest({ ...SHADE, solid: true })).toBeLessThan(brightest(SHADE))
  })

  it("rests at one pose and leans within a limit", () => {
    expect(knotAngles(0, 0, 0)).toEqual(knotAngles(0, 0, 0))
    expect(knotAngles(0, 1, 0).turn).toBeGreaterThan(knotAngles(0, 0, 0).turn)
    expect(knotAngles(10, 0, 0).turn).toBeGreaterThan(knotAngles(0, 0, 0).turn)
    expect(leanFrom(150, 100, 100)).toBe(0)
    expect(leanFrom(9999, 100, 100)).toBe(1)
    expect(leanFrom(-9999, 100, 100)).toBe(-1)
    expect(leanFrom(10, 0, 0)).toBe(0)
  })
})

describe("GlassCore", () => {
  it.each(VARIANTS)("variant=%s marks the root and is hidden from assistive tech without a label", (variant) => {
    const { container } = render(<GlassCore variant={variant} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-slot", "glass-core")
    expect(root).toHaveAttribute("data-variant", variant)
    expect(root).toHaveAttribute("aria-hidden", "true")
    expect(root).not.toHaveAttribute("role")
  })

  it("becomes an image when it is given a label", () => {
    const { getByRole } = render(<GlassCore label="Sync engine" />)
    expect(getByRole("img", { name: "Sync engine" })).toHaveAttribute("data-slot", "glass-core")
  })

  it("builds each variant from different parts", () => {
    const shape = (variant: GlassCoreVariant) => {
      const { container, unmount } = render(<GlassCore variant={variant} />)
      const found = {
        canvas: container.querySelector("canvas") !== null,
        orb: container.querySelector("[data-slot='glass-core-orb']") !== null,
        panes: container.querySelectorAll("[data-slot='glass-core-pane']").length,
      }
      unmount()
      return found
    }
    expect(shape("knot")).toEqual({ canvas: true, orb: false, panes: 0 })
    expect(shape("orb")).toEqual({ canvas: false, orb: true, panes: 0 })
    expect(shape("panes")).toEqual({ canvas: false, orb: false, panes: 3 })
  })

  it("paints one frame and stops when nothing moves it", () => {
    render(<GlassCore variant="knot" />)
    expect(runFrame()).toBe(1)
    expect(context.putImageData).toHaveBeenCalled()
    expect(runFrame()).toBe(0)
  })

  it("keeps painting frames while it drifts", () => {
    render(<GlassCore variant="knot" effect="drift" />)
    runFrame(16)
    expect(frames.length).toBeGreaterThan(0)
    runFrame(32)
    expect(frames.length).toBeGreaterThan(0)
  })

  it("drops the loop and the pointer under reduced motion", () => {
    setPreferences(true, false)
    const addListener = vi.spyOn(window, "addEventListener")
    render(<GlassCore variant="knot" effect="drift" />)
    expect(addListener.mock.calls.filter(([type]) => type === "pointermove")).toHaveLength(0)
    expect(runFrame()).toBe(1)
    expect(runFrame()).toBe(0)
    addListener.mockRestore()
  })

  it("listens for the pointer only with an effect, and ignores touch", () => {
    const addListener = vi.spyOn(window, "addEventListener")
    const { unmount } = render(<GlassCore variant="orb" />)
    expect(addListener.mock.calls.filter(([type]) => type === "pointermove")).toHaveLength(0)
    unmount()
    render(<GlassCore variant="orb" effect="follow" />)
    expect(addListener.mock.calls.filter(([type]) => type === "pointermove")).toHaveLength(1)
    fireEvent.pointerMove(window, { clientX: 10, clientY: 10, pointerType: "touch" })
    addListener.mockRestore()
  })

  it("drops the light behind and paints solid under reduced transparency", () => {
    setPreferences(false, true)
    const { container } = render(<GlassCore variant="knot" />)
    expect(container.querySelector("[data-slot='glass-core-glow']")).toBeNull()
    expect(container.firstElementChild).toHaveAttribute("data-solid", "true")
    runFrame()
    expect(context.putImageData).toHaveBeenCalled()
  })

  it("shows a mark in the middle", () => {
    const { getByText } = render(<GlassCore variant="orb"><span>Sync</span></GlassCore>)
    expect(getByText("Sync").parentElement).toHaveClass("place-items-center")
  })
})
