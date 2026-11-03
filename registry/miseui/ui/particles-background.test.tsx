import { act, fireEvent, render, screen } from "@testing-library/react"
import { ParticlesBackground } from "./particles-background"
import { fieldGrid, PARTICLE_CEILING, particleCount, seedParticles, type ParticleVariant } from "./particles-background-engine"
import { createLinkBuffer, linkDistance, linkParticles, SHADES, shadeOf } from "./particles-background-links"
import { resizeParticles, stepParticles } from "./particles-background-step"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

type Watch = (entries: { isIntersecting: boolean }[]) => void

const env = {
  frames: [] as FrameRequestCallback[],
  views: [] as Watch[],
  sizeWatchers: [] as (() => void)[],
  sizeDisconnect: vi.fn(),
  themeWatchers: [] as (() => void)[],
  schemeListeners: new Set<() => void>(),
  ctx: null as ReturnType<typeof fakeContext> | null,
  windowListener: vi.fn(),
}

function fakeContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  }
}

beforeEach(() => {
  state.reduced = false
  env.frames = []
  env.views = []
  env.sizeWatchers = []
  env.sizeDisconnect.mockClear()
  env.themeWatchers = []
  env.schemeListeners = new Set()
  const ctx = fakeContext()
  env.ctx = ctx
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ctx as unknown as ReturnType<HTMLCanvasElement["getContext"]>)
  Object.defineProperty(HTMLCanvasElement.prototype, "clientWidth", { configurable: true, get: () => 400 })
  Object.defineProperty(HTMLCanvasElement.prototype, "clientHeight", { configurable: true, get: () => 200 })
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => env.frames.push(callback))
  vi.stubGlobal("cancelAnimationFrame", () => {
    env.frames = []
  })
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Watch) {
        env.views.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        env.sizeWatchers.push(callback)
      }
      observe() {}
      disconnect = env.sizeDisconnect
    },
  )
  vi.stubGlobal(
    "MutationObserver",
    class {
      constructor(callback: () => void) {
        env.themeWatchers.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: (_: string, listener: () => void) => env.schemeListeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => env.schemeListeners.delete(listener),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLCanvasElement.prototype, "clientWidth")
  Reflect.deleteProperty(HTMLCanvasElement.prototype, "clientHeight")
})

function runFrame(time: number) {
  const pending = env.frames
  env.frames = []
  pending.forEach((callback) => callback(time))
}

const root = () => document.querySelector("[data-slot='particles-background']") as HTMLElement
const canvas = () => document.querySelector("[data-slot='particles-background-canvas']") as HTMLCanvasElement

describe("particle counts", () => {
  it("scales with area and stops at a ceiling", () => {
    expect(particleCount("drift", 263, 200)).toBe(18)
    expect(particleCount("constellation", 800, 600)).toBe(80)
    expect(particleCount("constellation", 4000, 3000)).toBe(PARTICLE_CEILING.constellation)
    expect(particleCount("rise", 4000, 3000)).toBe(PARTICLE_CEILING.rise)
    expect(particleCount("drift", 40, 40)).toBe(16)
  })

  it("opens the field spacing on a huge box instead of passing the ceiling", () => {
    expect(fieldGrid(263, 200).spacing).toBe(24)
    expect(particleCount("field", 3840, 2160)).toBeLessThanOrEqual(PARTICLE_CEILING.field)
    expect(fieldGrid(3840, 2160).spacing).toBeGreaterThan(24)
  })
})

describe("seeding and stepping", () => {
  const sameSeed = (variant: ParticleVariant) => {
    const first = seedParticles(variant, 400, 200, 5)
    const second = seedParticles(variant, 400, 200, 5)
    expect([...first.x]).toEqual([...second.x])
    expect([...first.y]).toEqual([...second.y])
  }

  it("seeds the same points from the same seed", () => {
    sameSeed("drift")
    sameSeed("constellation")
    sameSeed("rise")
    sameSeed("field")
    expect([...seedParticles("drift", 400, 200, 5).x]).not.toEqual([...seedParticles("drift", 400, 200, 6).x])
  })

  it("wraps drifting points back into the box with no teleport inside it", () => {
    const field = seedParticles("drift", 200, 200, 1)
    for (let frame = 0; frame < 2000; frame += 1) stepParticles(field, 0.05, null)
    for (let i = 0; i < field.count; i += 1) {
      expect(field.x[i]).toBeGreaterThanOrEqual(-9)
      expect(field.x[i]).toBeLessThanOrEqual(209)
    }
  })

  it("parts drift points around the pointer", () => {
    const field = seedParticles("drift", 400, 200, 1)
    const without = seedParticles("drift", 400, 200, 1)
    field.x[0] = 100
    field.y[0] = 100
    without.x[0] = 100
    without.y[0] = 100
    stepParticles(field, 0.05, { x: 90, y: 100 })
    stepParticles(without, 0.05, null)
    expect(field.x[0]).toBeGreaterThan(without.x[0] as number)
  })

  it("bounces constellation points rather than wrapping, so links never snap", () => {
    const field = seedParticles("constellation", 200, 200, 1)
    let largestJump = 0
    for (let frame = 0; frame < 1500; frame += 1) {
      const before = field.x[0] as number
      stepParticles(field, 0.05, null)
      largestJump = Math.max(largestJump, Math.abs((field.x[0] as number) - before))
    }
    expect(largestJump).toBeLessThan(2)
  })

  it("lifts rising points and brings them back low when a life ends", () => {
    const field = seedParticles("rise", 400, 200, 1)
    field.y[0] = 150
    field.life[0] = 0.1
    stepParticles(field, 0.05, null)
    expect(field.y[0]).toBeLessThan(150)
    field.life[0] = 0.999
    stepParticles(field, 0.05, null)
    expect(field.life[0]).toBe(0)
    expect(field.y[0]).toBeGreaterThan(200 * 0.5)
  })

  it("rests the field with a clearing in the middle and spends no frames", () => {
    const field = seedParticles("field", 400, 200, 1)
    const middle = Array.from({ length: field.count }, (_, i) => i).sort(
      (a, b) => Math.hypot((field.homeX[a] as number) - 200, (field.homeY[a] as number) - 100) - Math.hypot((field.homeX[b] as number) - 200, (field.homeY[b] as number) - 100),
    )
    expect(shadeOf(field, middle[0] as number)).toBe(0)
    expect(shadeOf(field, middle[middle.length - 1] as number)).toBe(2)
    expect(stepParticles(field, 0.016, null)).toBe(false)
  })

  it("bends the field away from the pointer, then settles back", () => {
    const field = seedParticles("field", 400, 200, 1)
    expect(stepParticles(field, 0.05, { x: 60, y: 60 })).toBe(true)
    for (let frame = 0; frame < 300; frame += 1) stepParticles(field, 0.05, { x: 60, y: 60 })
    expect(field.dentX).toBeCloseTo(60, 0)
    const near = Array.from({ length: field.count }, (_, i) => i).find((i) => Math.hypot((field.homeX[i] as number) - 60, (field.homeY[i] as number) - 60) < 40) as number
    const away = Math.hypot((field.x[near] as number) - 60, (field.y[near] as number) - 60)
    expect(away).toBeGreaterThan(Math.hypot((field.homeX[near] as number) - 60, (field.homeY[near] as number) - 60))
    let frames = 0
    while (stepParticles(field, 0.05, null) && frames < 600) frames += 1
    expect(frames).toBeLessThan(600)
    expect(field.dentX).toBeCloseTo(200, 0)
    expect(field.heat).toBeLessThan(0.05)
  })

  it("keeps points by proportion on a resize, and reseeds when the count changes", () => {
    const field = seedParticles("constellation", 300, 200, 1)
    const stretched = resizeParticles(field, 330, 200, 1)
    expect(stretched.count).toBe(field.count)
    expect(stretched.x[0]).toBeCloseTo((field.x[0] as number) * 1.1, 2)
    expect(resizeParticles(field, 1200, 800, 1).count).toBeGreaterThan(field.count)
  })
})

describe("links", () => {
  const pairsOf = (a: Uint16Array, b: Uint16Array, count: number) =>
    Array.from({ length: count }, (_, n) => {
      const pair = [a[n] as number, b[n] as number].sort((left, right) => left - right)
      return `${pair[0]}-${pair[1]}`
    }).sort()

  it("finds exactly what a brute force check finds", () => {
    const field = seedParticles("constellation", 800, 600, 3)
    const distance = 60
    const buffer = createLinkBuffer(field, distance)
    const found = linkParticles(field, buffer, distance, false, Number.MAX_SAFE_INTEGER)
    const brute: string[] = []
    for (let i = 0; i < field.count; i += 1) {
      for (let j = i + 1; j < field.count; j += 1) {
        if (Math.hypot((field.x[i] as number) - (field.x[j] as number), (field.y[i] as number) - (field.y[j] as number)) < distance) brute.push(`${i}-${j}`)
      }
    }
    expect(brute.length).toBeGreaterThan(5)
    expect(pairsOf(buffer.a, buffer.b, found)).toEqual(brute.sort())
  })

  it("holds each point to three links, so a cluster is not a hairball", () => {
    const field = seedParticles("constellation", 200, 200, 2)
    const distance = 130
    const buffer = createLinkBuffer(field, distance)
    linkParticles(field, buffer, distance)
    const uses = new Map<number, number>()
    for (let n = 0; n < buffer.count; n += 1) {
      for (const end of [buffer.a[n] as number, buffer.b[n] as number]) uses.set(end, (uses.get(end) ?? 0) + 1)
    }
    expect(Math.max(...uses.values())).toBeLessThanOrEqual(3)
  })

  it("links to the pointer through the slot past the last point", () => {
    const field = seedParticles("constellation", 400, 200, 2)
    stepParticles(field, 0, { x: 200, y: 100 })
    const buffer = createLinkBuffer(field, 80)
    linkParticles(field, buffer, 80, true)
    expect(Array.from(buffer.a.subarray(0, buffer.count)).includes(field.count)).toBe(true)
  })

  it("sets the link distance from the gap between points, within limits", () => {
    expect(linkDistance(120, 100, 16)).toBe(64)
    expect(linkDistance(800, 600, 80)).toBeCloseTo(93, 0)
    expect(linkDistance(4000, 3000, 90)).toBe(200)
  })

  it("connects a hero as well as a card, so neither is a hairball or scattered points", () => {
    for (const [width, height] of [[263, 200], [800, 600], [1920, 1080]] as const) {
      const field = seedParticles("constellation", width, height, 1)
      const distance = linkDistance(width, height, field.count)
      const links = linkParticles(field, createLinkBuffer(field, distance), distance)
      expect(links).toBeGreaterThan(field.count * 0.4)
      expect(links).toBeLessThanOrEqual(field.count * 1.5)
    }
  })

  it("stays cheap at the ceiling", () => {
    const field = seedParticles("constellation", 2560, 1440, 1)
    expect(field.count).toBe(PARTICLE_CEILING.constellation)
    const distance = linkDistance(2560, 1440, field.count)
    const buffer = createLinkBuffer(field, distance)
    const started = performance.now()
    for (let frame = 0; frame < 600; frame += 1) {
      stepParticles(field, 1 / 60, null)
      linkParticles(field, buffer, distance)
    }
    // A very wide margin on the 16 ms budget of a frame, so a busy test machine does not fail this.
    expect((performance.now() - started) / 600).toBeLessThan(4)
  })
})

describe("shades", () => {
  it("always picks an entry that exists", () => {
    for (const variant of ["drift", "constellation", "rise", "field"] as const) {
      const field = seedParticles(variant, 400, 200, 1)
      for (let i = 0; i < field.count; i += 1) {
        const shade = shadeOf(field, i)
        expect(shade).toBeGreaterThanOrEqual(0)
        expect(shade).toBeLessThan(SHADES[variant].length)
      }
    }
  })

  it("tints only the ring around a pointer, in the accent", () => {
    const field = seedParticles("field", 400, 200, 1)
    field.life[0] = 0.5
    field.heat = 0
    expect(SHADES.field[shadeOf(field, 0)]?.tone).toBe("neutral")
    field.heat = 1
    expect(SHADES.field[shadeOf(field, 0)]?.tone).toBe("accent")
  })
})

describe("ParticlesBackground", () => {
  it("draws one hidden, click-through canvas behind the content", () => {
    render(
      <ParticlesBackground className="h-50">
        <button>Open the map</button>
      </ParticlesBackground>,
    )
    expect(canvas()).toHaveAttribute("aria-hidden", "true")
    expect(canvas()).toHaveClass("pointer-events-none", "absolute", "inset-0")
    expect(document.querySelectorAll("canvas")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Open the map" }).closest("[aria-hidden]")).toBeNull()
    expect(root()).toHaveClass("relative", "isolate", "overflow-clip", "h-50")
  })

  it("draws differently for each variant", () => {
    const drawCalls = (variant: ParticleVariant) => {
      const ctx = env.ctx as ReturnType<typeof fakeContext>
      ctx.arc.mockClear()
      ctx.stroke.mockClear()
      const { unmount } = render(<ParticlesBackground variant={variant} />)
      const result = { dots: ctx.arc.mock.calls.length, strokes: ctx.stroke.mock.calls.length }
      unmount()
      return result
    }
    expect(drawCalls("drift").strokes).toBe(0)
    expect(drawCalls("constellation").strokes).toBeGreaterThan(0)
    expect(drawCalls("field").dots).toBeGreaterThan(drawCalls("drift").dots)
    expect(root()).toBeNull()
  })

  it("caps the pixel ratio at 2", () => {
    const ratio = vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(3)
    render(<ParticlesBackground />)
    expect(canvas().width).toBe(800)
    expect(canvas().height).toBe(400)
    ratio.mockRestore()
  })

  it("runs frames only while playing, and cancels on pause and unmount", () => {
    const { rerender, unmount } = render(<ParticlesBackground />)
    expect(root()).toHaveAttribute("data-playing", "true")
    expect(env.frames).toHaveLength(1)
    runFrame(16)
    expect(env.frames).toHaveLength(1)
    rerender(<ParticlesBackground paused />)
    expect(env.frames).toHaveLength(0)
    rerender(<ParticlesBackground />)
    expect(env.frames).toHaveLength(1)
    act(() => env.views[0]?.([{ isIntersecting: false }]))
    expect(root()).toHaveAttribute("data-playing", "false")
    expect(env.frames).toHaveLength(0)
    unmount()
    expect(env.sizeDisconnect).toHaveBeenCalled()
    expect(env.schemeListeners.size).toBe(0)
  })

  it("draws one finished frame under reduced motion and asks for no more", () => {
    state.reduced = true
    render(<ParticlesBackground variant="constellation" />)
    const ctx = env.ctx as ReturnType<typeof fakeContext>
    expect(ctx.arc).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
    expect(env.frames).toHaveLength(0)
    expect(root()).not.toHaveAttribute("data-playing")
    fireEvent.pointerMove(root(), { clientX: 10, clientY: 10, pointerType: "mouse" })
    expect(env.frames).toHaveLength(0)
  })

  it("reads the theme again on a class change and on a colour scheme change, and repaints", () => {
    render(<ParticlesBackground />)
    const ctx = env.ctx as ReturnType<typeof fakeContext>
    ctx.clearRect.mockClear()
    env.themeWatchers.forEach((watch) => watch())
    expect(ctx.clearRect).toHaveBeenCalledTimes(1)
    env.schemeListeners.forEach((listener) => listener())
    expect(ctx.clearRect).toHaveBeenCalledTimes(2)
  })

  it("leaves the canvas alone when the size observer fires with the same size", () => {
    render(<ParticlesBackground />)
    const ctx = env.ctx as ReturnType<typeof fakeContext>
    ctx.setTransform.mockClear()
    env.sizeWatchers.forEach((watch) => watch())
    expect(ctx.setTransform).not.toHaveBeenCalled()
  })

  it("wakes a resting field for a mouse, ignores touch, and never listens on window", () => {
    const toWindow = vi.spyOn(window, "addEventListener")
    render(<ParticlesBackground variant="field" />)
    runFrame(16)
    runFrame(32)
    expect(env.frames).toHaveLength(0)
    fireEvent.pointerMove(root(), { clientX: 40, clientY: 40, pointerType: "touch" })
    expect(env.frames).toHaveLength(0)
    fireEvent.pointerMove(root(), { clientX: 40, clientY: 40, pointerType: "mouse" })
    expect(env.frames).toHaveLength(1)
    expect(toWindow.mock.calls.filter(([type]) => String(type).startsWith("pointer"))).toHaveLength(0)
  })

  it("ignores the pointer on a drift without the effect, and on rise with it", () => {
    const onPointerMove = vi.fn()
    const { unmount } = render(<ParticlesBackground variant="rise" effect="pointer" onPointerMove={onPointerMove} paused />)
    fireEvent.pointerMove(root(), { clientX: 40, clientY: 40, pointerType: "mouse" })
    expect(onPointerMove).toHaveBeenCalledTimes(1)
    expect(env.frames).toHaveLength(0)
    unmount()
    render(<ParticlesBackground variant="constellation" effect="pointer" />)
    expect(root()).toHaveAttribute("data-effect", "pointer")
  })
})
