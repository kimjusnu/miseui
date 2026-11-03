import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ClickSpark, type ClickSparkProps } from "./click-spark"
import { burstProgress, canvasRect, confettiPiece, createBurst, dotPosition, LIFE_MS, ringBand, sparkLine } from "./click-spark-math"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

const context = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
}

const frames: FrameRequestCallback[] = []

function runFrame(now: number) {
  const pending = frames.splice(0)
  pending.forEach((callback) => callback(now))
  return pending.length
}

function Sample(props: ClickSparkProps) {
  return (
    <ClickSpark {...props}>
      <button type="button">Like</button>
    </ClickSpark>
  )
}

const button = () => screen.getByRole("button", { name: "Like" })
const canvas = () => document.querySelector("[data-slot='click-spark-canvas']") as HTMLCanvasElement | null

beforeEach(() => {
  state.reduced = false
  frames.length = 0
  vi.clearAllMocks()
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal("cancelAnimationFrame", () => {
    frames.length = 0
  })
  vi.spyOn(performance, "now").mockReturnValue(1000)
  HTMLCanvasElement.prototype.getContext = vi.fn(() => context) as unknown as HTMLCanvasElement["getContext"]
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("click spark maths", () => {
  it("makes the requested count, and one band for a ring", () => {
    expect(createBurst("spark", 0, 0, 0, 6, 1).particles).toHaveLength(6)
    expect(createBurst("ring", 0, 0, 0, 6, 1).particles).toHaveLength(1)
    expect(createBurst("dots", 0, 0, 0, 0, 1).particles).toHaveLength(1)
  })

  it("is seeded, the same seed gives the same burst", () => {
    expect(createBurst("confetti", 0, 0, 0, 5, 7)).toEqual(createBurst("confetti", 0, 0, 0, 5, 7))
    expect(createBurst("confetti", 0, 0, 0, 5, 7)).not.toEqual(createBurst("confetti", 0, 0, 0, 5, 8))
  })

  it("spreads pieces evenly round the circle", () => {
    const angles = createBurst("spark", 0, 0, 0, 8, 3).particles.map((particle) => particle.angle)
    angles.slice(1).forEach((angle, index) => expect(angle).toBeGreaterThan(angles[index] as number))
  })

  it("measures progress and clamps it", () => {
    const burst = createBurst("spark", 0, 0, 100, 1, 1)
    expect(burstProgress(burst, 100)).toBe(0)
    expect(burstProgress(burst, 100 + LIFE_MS.spark / 2)).toBeCloseTo(0.5)
    expect(burstProgress(burst, 99999)).toBe(1)
  })

  const particle = { angle: 0, speed: 1, size: 1, tone: 0, spin: 2 }

  it("a spark line flies out and shortens to nothing", () => {
    const start = sparkLine(particle, 0)
    const end = sparkLine(particle, 1)
    expect(end.from).toBeGreaterThan(start.from)
    expect(start.to - start.from).toBeCloseTo(12)
    expect(end.to - end.from).toBeCloseTo(0)
  })

  it("dots fall under light gravity and fade", () => {
    const flat = { ...particle, angle: 0 }
    expect(dotPosition(flat, 0).y).toBe(0)
    expect(dotPosition(flat, 1).y).toBeGreaterThan(0)
    expect(dotPosition(flat, 1).alpha).toBe(0)
  })

  it("the ring spreads and dies out", () => {
    expect(ringBand(1).radius).toBeGreaterThan(ringBand(0).radius)
    expect(ringBand(0).alpha).toBe(1)
    expect(ringBand(1).alpha).toBe(0)
  })

  it("confetti ends lower than it starts, tumbling", () => {
    expect(confettiPiece(particle, 1).y).toBeGreaterThan(confettiPiece(particle, 0).y)
    expect(confettiPiece(particle, 1).rotation).toBe(2)
    expect(confettiPiece(particle, 1).alpha).toBeCloseTo(0)
  })

  it("keeps the canvas from growing the page past its right and bottom edge", () => {
    expect(canvasRect(100, 50, 500, 500, 40)).toEqual({ left: -40, top: -40, width: 180, height: 130 })
    expect(canvasRect(100, 50, 10, 0, 40)).toEqual({ left: -40, top: -40, width: 150, height: 90 })
    expect(canvasRect(100, 50, -30, -30, 40)).toEqual({ left: -40, top: -40, width: 140, height: 90 })
  })
})

describe("ClickSpark", () => {
  it("creates no canvas until the first press, then keeps one", async () => {
    const user = userEvent.setup()
    render(<Sample />)
    expect(canvas()).toBeNull()
    await user.click(button())
    expect(canvas()).toBeInTheDocument()
    await user.click(button())
    expect(document.querySelectorAll("canvas")).toHaveLength(1)
  })

  it("the canvas is decoration that never takes a click", async () => {
    const user = userEvent.setup()
    render(<Sample />)
    await user.click(button())
    expect(canvas()).toHaveAttribute("aria-hidden", "true")
    expect(canvas()).toHaveClass("pointer-events-none")
  })

  it("draws while something is alive and stops the loop after the last piece dies", async () => {
    const user = userEvent.setup()
    render(<Sample />)
    await user.click(button())
    expect(runFrame(1100)).toBe(1)
    expect(context.stroke).toHaveBeenCalled()
    expect(frames).toHaveLength(1)
    context.stroke.mockClear()
    context.clearRect.mockClear()
    expect(runFrame(1000 + LIFE_MS.spark + 1)).toBe(1)
    expect(context.clearRect).toHaveBeenCalled()
    expect(context.stroke).not.toHaveBeenCalled()
    expect(frames).toHaveLength(0)
    expect(runFrame(9999)).toBe(0)
  })

  it("a later press starts the loop again", async () => {
    const user = userEvent.setup()
    render(<Sample />)
    await user.click(button())
    runFrame(1000 + LIFE_MS.spark + 1)
    expect(frames).toHaveLength(0)
    await user.click(button())
    expect(frames).toHaveLength(1)
  })

  it("never prevents default or stops the event", () => {
    const outer = vi.fn()
    const inner = vi.fn((event: React.MouseEvent) => expect(event.defaultPrevented).toBe(false))
    render(
      <div onClick={outer}>
        <ClickSpark onClick={inner}>
          <button type="button">Like</button>
        </ClickSpark>
      </div>,
    )
    const notCancelled = fireEvent.click(button())
    expect(notCancelled).toBe(true)
    expect(inner).toHaveBeenCalledOnce()
    expect(outer).toHaveBeenCalledOnce()
  })

  it("bursts from the middle of the target on a keyboard press", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      if (this.tagName === "BUTTON") return { left: 100, top: 200, right: 140, bottom: 240, width: 40, height: 40, x: 100, y: 200, toJSON() {} }
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} }
    })
    render(<Sample />)
    fireEvent.click(button(), { detail: 0 })
    runFrame(1100)
    const [x, y] = context.moveTo.mock.calls[0] as [number, number]
    // Canvas is at 0,0 in this stub, and every line starts about 10 to 36 px from the centre.
    expect(Math.hypot(x - 120, y - 220)).toBeLessThan(40)
  })

  it("draws nothing under reduced motion", async () => {
    state.reduced = true
    const user = userEvent.setup()
    render(<Sample />)
    await user.click(button())
    expect(canvas()).toBeNull()
    expect(frames).toHaveLength(0)
  })

  it("cancels the frame and removes the canvas on unmount", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Sample />)
    await user.click(button())
    expect(frames).toHaveLength(1)
    unmount()
    expect(frames).toHaveLength(0)
    expect(canvas()).toBeNull()
  })

  it("draws differently per variant", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Sample variant="dots" />)
    await user.click(button())
    runFrame(1100)
    expect(context.fill).toHaveBeenCalled()
    expect(context.fillRect).not.toHaveBeenCalled()
    rerender(<Sample variant="confetti" />)
    await user.click(button())
    runFrame(1200)
    expect(context.fillRect).toHaveBeenCalled()
    expect(context.rotate).toHaveBeenCalled()
    context.stroke.mockClear()
    rerender(<Sample variant="ring" />)
    await user.click(button())
    runFrame(5000)
    await user.click(button())
    runFrame(1100)
    expect(context.stroke).toHaveBeenCalledTimes(4)
  })

  it("honours count", async () => {
    const user = userEvent.setup()
    render(<Sample variant="spark" count={3} />)
    await user.click(button())
    runFrame(1100)
    expect(context.stroke).toHaveBeenCalledTimes(3)
  })
})
