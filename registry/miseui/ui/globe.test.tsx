import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { Globe, type GlobeVariant } from "./globe"
import { LAND_COLUMNS, LAND_MASK, LAND_ROWS } from "./globe-land"
import { buildGraticule } from "./globe-draw"
import { contrast, legibleAccent, softLand } from "./globe-color"
import {
  createView,
  decodeBase64,
  dotStep,
  dragDegrees,
  greatCirclePoints,
  isArcPointVisible,
  isLand,
  landMask,
  normalizeDegrees,
  projectDots,
  rotatePoint,
  rowDotCount,
  sampleLandDots,
  stepSpin,
  toUnitVector,
} from "./globe-math"
import { buildSolidFrame, landTexture, paintSolidFrame, TEXTURE_HEIGHT, TEXTURE_WIDTH } from "./globe-solid"

const SEOUL = { lat: 37.6, lng: 127, label: "Seoul" }
const LISBON = { lat: 38.7, lng: -9.1, label: "Lisbon" }

function fakeContext() {
  const gradient = { addColorStop: vi.fn() }
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    fill: vi.fn(),
    fillRect: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray([200, 120, 40, 255]) }),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    putImageData: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
  }
}

let context = fakeContext()

beforeEach(() => {
  context = fakeContext()
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => context) as never)
  vi.spyOn(HTMLCanvasElement.prototype, "clientWidth", "get").mockReturnValue(263)
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("land data", () => {
  it("decodes base64 without Buffer or atob, matching known bytes", () => {
    expect([...decodeBase64("TWFu")]).toEqual([77, 97, 110])
    expect([...decodeBase64("TWE=")]).toEqual([77, 97])
    expect([...decodeBase64("TQ==")]).toEqual([77])
    expect(landMask()).toHaveLength(Math.ceil((LAND_COLUMNS * LAND_ROWS) / 8))
    expect(LAND_MASK.startsWith("AAAA")).toBe(true)
  })

  it("puts land and sea where a map has them", () => {
    for (const [lat, lng] of [[5, 20], [45, 90], [40, -100], [-10, -55], [-25, 135]] as const) expect(isLand(lat, lng)).toBe(true)
    for (const [lat, lng] of [[0, -150], [30, -40], [-30, 75], [20, -160]] as const) expect(isLand(lat, lng)).toBe(false)
  })

  it("samples fewer dots per row toward the poles, and land only", () => {
    expect(rowDotCount(0, 2.5)).toBe(144)
    expect(rowDotCount(60, 2.5)).toBe(72)
    expect(rowDotCount(89.9, 2.5)).toBe(1)
    const dots = sampleLandDots(2.5)
    expect(dots.length % 3).toBe(0)
    expect(dots.length / 3).toBeGreaterThan(1000)
    expect(dots.length / 3).toBeLessThan(3500)
    expect(Math.hypot(dots[0] as number, dots[1] as number, dots[2] as number)).toBeCloseTo(1, 4)
  })

  it("keeps dot spacing with size, within what the mask can show", () => {
    expect(dotStep(130)).toBeCloseTo(2.47, 1)
    expect(dotStep(240)).toBeGreaterThanOrEqual(1.5)
    expect(dotStep(10_000)).toBe(1.5)
    expect(dotStep(0)).toBe(2.5)
  })
})

describe("projection", () => {
  it("brings the view centre to the middle of the disc, facing the viewer", () => {
    const view = createView(127, 37.6)
    const unit = toUnitVector(SEOUL)
    const [x, y, z] = rotatePoint(unit[0], unit[1], unit[2], view)
    expect(x).toBeCloseTo(0, 5)
    expect(y).toBeCloseTo(0, 5)
    expect(z).toBeCloseTo(1, 5)
  })

  it("culls the far side and writes only the near side", () => {
    const units = Float32Array.from([...toUnitVector({ lat: 0, lng: 10 }), ...toUnitVector({ lat: 0, lng: 170 })])
    const out = new Float32Array(units.length)
    expect(projectDots(units, createView(10, 0), out)).toBe(1)
    expect(out[2]).toBeCloseTo(1, 5)
  })

  it("draws a great circle that keeps its radius and lifts in the middle", () => {
    const flat = greatCirclePoints({ lat: 0, lng: 0 }, { lat: 0, lng: 90 }, 8)
    expect(Math.hypot(flat[12] as number, flat[13] as number, flat[14] as number)).toBeCloseTo(1, 5)
    expect(flat[12]).toBeCloseTo(Math.SQRT1_2, 4)
    const lifted = greatCirclePoints({ lat: 0, lng: 0 }, { lat: 0, lng: 90 }, 8, 0.2)
    expect(Math.hypot(lifted[12] as number, lifted[13] as number, lifted[14] as number)).toBeCloseTo(1.2, 4)
    expect(Number.isFinite(greatCirclePoints({ lat: 0, lng: 0 }, { lat: 0, lng: 180 }, 8)[12])).toBe(true)
  })

  it("hides an arc point only when it is behind the disc", () => {
    expect(isArcPointVisible(0, 0, 0.5)).toBe(true)
    expect(isArcPointVisible(0.2, 0.2, -0.5)).toBe(false)
    expect(isArcPointVisible(1.05, 0, -0.1)).toBe(true)
  })

  it("draws meridians and parallels without a point at either pole", () => {
    expect(buildGraticule()).toHaveLength(12 + 5)
  })
})

describe("spin", () => {
  it("decays a flick toward the slow turn, with no seam", () => {
    const after = stepSpin({ angle: 0, velocity: 200 }, -6, 0.1)
    expect(after.velocity).toBeLessThan(200)
    expect(after.velocity).toBeGreaterThan(-6)
    let spin = after
    for (let step = 0; step < 300; step += 1) spin = stepSpin(spin, -6, 0.05)
    expect(spin.velocity).toBeCloseTo(-6, 2)
  })

  it("wraps angles and follows the finger", () => {
    expect(normalizeDegrees(190)).toBe(-170)
    expect(normalizeDegrees(-190)).toBe(170)
    expect(dragDegrees(100, 100)).toBeCloseTo(-57.3, 1)
    expect(dragDegrees(5, 0)).toBe(0)
  })
})

describe("colour", () => {
  it("lifts a near-black accent on a dark page and leaves amber alone", () => {
    const dark = [24, 24, 28] as const
    const lifted = legibleAccent([20, 20, 22], dark, [242, 242, 245])
    expect(contrast(lifted, dark)).toBeGreaterThanOrEqual(2.2)
    const amber = [223, 150, 60] as const
    expect(legibleAccent(amber, [250, 250, 252], [36, 36, 40])).toEqual(amber)
  })
})

describe("solid land colour", () => {
  const paleOcean = [238, 238, 241] as const
  const darkOcean = [38, 38, 42] as const
  const amber = [240, 145, 50] as const

  it("sits back from the full accent, so a whole continent does not shout", () => {
    const land = softLand(amber, paleOcean, [36, 36, 40])
    expect(contrast(land, paleOcean)).toBeLessThan(contrast(amber, paleOcean))
    expect(contrast(land, paleOcean)).toBeGreaterThanOrEqual(1.5)
  })

  it("stays a colour and not brown in dark", () => {
    const land = softLand(amber, darkOcean, [242, 242, 245])
    expect(land[0]).toBeGreaterThan(190)
  })

  it("keeps a near-black accent visible on a dark ocean", () => {
    const land = softLand([20, 20, 22], darkOcean, [242, 242, 245])
    expect(contrast(land, darkOcean)).toBeGreaterThanOrEqual(1.5)
  })
})

describe("solid shading", () => {
  it("covers only the disc and turns by moving land, not shading", () => {
    const size = 64
    const frame = buildSolidFrame(size, 18, { ocean: [200, 200, 205], land: [223, 150, 60] })
    expect(frame.pixels.length).toBeGreaterThan(size * size * 0.7)
    expect(frame.pixels.length).toBeLessThan(size * size * 0.85)
    const one = new Uint32Array(size * size)
    const two = new Uint32Array(size * size)
    paintSolidFrame(frame, 15, one)
    paintSolidFrame(frame, 100, two)
    expect(one[0]).toBe(0)
    expect(one.some((pixel, index) => pixel !== two[index])).toBe(true)
  })

  it("has soft coasts, and a limb darker than the lit side", () => {
    const coverage = landTexture()
    expect(coverage).toHaveLength(TEXTURE_WIDTH * TEXTURE_HEIGHT)
    expect(coverage.some((value) => value > 0 && value < 255)).toBe(true)
    const frame = buildSolidFrame(101, 0, { ocean: [200, 200, 200], land: [200, 200, 200] })
    const brightness = (pixel: number) => frame.ocean[frame.pixels.indexOf(pixel)]! & 255
    expect(brightness(50 * 101 + 30)).toBeGreaterThan(brightness(50 * 101 + 99))
  })
})

describe("Globe", () => {
  it("reserves a square before anything paints, on the server too", () => {
    const html = renderToString(<Globe markers={[SEOUL]} />)
    expect(html).toContain("aspect-square")
    expect(html).toContain('role="img"')
    expect(html).toContain("Seoul")
  })

  it("names the picture and lists markers and named arcs for assistive tech", () => {
    render(<Globe label="Where the team works" variant="arcs" markers={[SEOUL, LISBON]} arcs={[{ from: SEOUL, to: LISBON, label: "Seoul to Lisbon" }]} />)
    expect(screen.getByRole("img", { name: "Where the team works" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Seoul", "Lisbon", "Seoul to Lisbon"])
  })

  it("draws dots with one batched path, and the variants differ in structure", async () => {
    const counts: Partial<Record<GlobeVariant, { arcs: number; strokes: number; images: number }>> = {}
    for (const variant of ["dots", "wire", "solid", "arcs"] as const) {
      context = fakeContext()
      const { unmount } = render(<Globe variant={variant} paused arcs={[{ from: SEOUL, to: LISBON }]} />)
      await waitFor(() => expect(context.beginPath.mock.calls.length + context.putImageData.mock.calls.length).toBeGreaterThan(0))
      counts[variant] = { arcs: context.arc.mock.calls.length, strokes: context.stroke.mock.calls.length, images: context.putImageData.mock.calls.length }
      if (variant === "dots") expect(context.fill.mock.calls.length).toBe(2)
      unmount()
    }
    expect(counts.dots).toMatchObject({ strokes: 0, images: 0 })
    expect(counts.dots?.arcs).toBeGreaterThan(300)
    expect(counts.wire?.strokes).toBeGreaterThanOrEqual(3)
    expect(counts.solid?.images).toBeGreaterThan(0)
    expect(counts.solid?.arcs).toBe(0)
    expect(counts.arcs?.strokes).toBeGreaterThan(0)
  })

  it("turns with Left and Right only when draggable, and scrolls vertically", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Globe label="Earth" />)
    expect(screen.getByRole("img").getAttribute("tabindex")).toBeNull()
    rerender(<Globe label="Earth" effect="drag" />)
    const canvas = screen.getByRole("img", { name: /Left and Right arrow keys/ })
    expect(canvas).toHaveAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight")
    expect(canvas.parentElement?.className).toContain("touch-pan-y")
    await user.tab()
    expect(canvas).toHaveFocus()
    const before = context.beginPath.mock.calls.length
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(context.beginPath.mock.calls.length).toBeGreaterThan(before))
  })

  it("spins under a drag without any React render, and survives cancel", async () => {
    render(<Globe effect="drag" paused />)
    const root = screen.getByRole("img").parentElement as HTMLElement
    await waitFor(() => expect(context.arc.mock.calls.length).toBeGreaterThan(0))
    context.arc.mockClear()
    act(() => {
      fireEvent.pointerDown(root, { button: 0, clientX: 100, pointerId: 1 })
      fireEvent.pointerMove(root, { clientX: 140, pointerId: 1 })
    })
    await waitFor(() => expect(context.arc.mock.calls.length).toBeGreaterThan(0))
    fireEvent.pointerCancel(root, { pointerId: 1 })
    expect(root).toHaveAttribute("data-playing", "false")
  })

  it("holds its slow turn when paused and cancels frames on unmount", () => {
    const cancel = vi.spyOn(window, "cancelAnimationFrame")
    const { unmount, rerender } = render(<Globe />)
    const root = screen.getByRole("img").parentElement as HTMLElement
    expect(root).toHaveAttribute("data-playing", "true")
    rerender(<Globe paused />)
    expect(root).toHaveAttribute("data-playing", "false")
    unmount()
    expect(cancel).toHaveBeenCalled()
  })
})
