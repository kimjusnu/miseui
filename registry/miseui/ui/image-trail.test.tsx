import { renderToString } from "react-dom/server"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { ImageTrail, type ImageTrailProps } from "./image-trail"
import { clearAnimation, pathDirection, POOL_SIZE, seededRotation, spawnAnimation, spawnPoints, speedScale, STILL_LAYOUT } from "./image-trail-math"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

const ITEMS = [<i key="a">a</i>, <i key="b">b</i>, <i key="c">c</i>, <i key="d">d</i>, <i key="e">e</i>]
const INPUT = { x: 50, y: 60, scale: 1, rotation: 10, direction: { x: 1, y: 0 } }

function stubPointer(fine: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: fine, media: query, addEventListener() {}, removeEventListener() {} }))
}

const animate = vi.fn()
const cancel = vi.fn()

function Trail(props: Partial<ImageTrailProps>) {
  return (
    <ImageTrail items={ITEMS} {...props}>
      <p>Walks worth taking</p>
    </ImageTrail>
  )
}

const root = () => document.querySelector("[data-slot='image-trail']") as HTMLElement
const moveTo = (clientX: number, clientY: number, pointerType = "mouse") => fireEvent.pointerMove(root(), { clientX, clientY, pointerType })

beforeEach(() => {
  state.reduced = false
  animate.mockReset()
  cancel.mockReset()
  animate.mockImplementation(() => ({ cancel }))
  Element.prototype.animate = animate
  stubPointer(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("image trail maths", () => {
  it("spawns by distance and keeps the leftover", () => {
    const short = spawnPoints({ x: 0, y: 0 }, { x: 50, y: 0 }, 72)
    expect(short.points).toEqual([])
    expect(short.anchor).toEqual({ x: 0, y: 0 })
    const long = spawnPoints({ x: 0, y: 0 }, { x: 150, y: 0 }, 72)
    expect(long.points).toEqual([
      { x: 72, y: 0 },
      { x: 144, y: 0 },
    ])
    expect(long.anchor).toEqual({ x: 144, y: 0 })
  })

  it("caps a huge jump to the last few along the path", () => {
    const jump = spawnPoints({ x: 0, y: 0 }, { x: 1000, y: 0 }, 10)
    expect(jump.points).toHaveLength(3)
    expect(jump.points[2]).toEqual({ x: 1000, y: 0 })
    expect(jump.anchor).toEqual({ x: 1000, y: 0 })
  })

  it("does not divide by zero on a pointer that did not move", () => {
    expect(pathDirection({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 1, y: 0 })
    expect(spawnPoints({ x: 5, y: 5 }, { x: 5, y: 5 }, 0).points).toEqual([])
  })

  it("scales with speed inside a fixed range", () => {
    expect(speedScale(0)).toBe(0.8)
    expect(speedScale(1)).toBeCloseTo(1.15)
    expect(speedScale(50)).toBe(1.5)
  })

  it("rotates by seed: the same every time, and upright for strip", () => {
    expect(seededRotation("fan", 3)).toBe(seededRotation("fan", 3))
    expect(seededRotation("fan", 3)).not.toBe(seededRotation("fan", 4))
    expect(Math.abs(seededRotation("fan", 3))).toBeLessThanOrEqual(18)
    expect(seededRotation("strip", 3)).toBe(0)
  })

  it("gives each variant its own life", () => {
    const pile = spawnAnimation("pile", INPUT)
    expect(pile.keyframes[pile.keyframes.length - 1]?.opacity).toBe(1)
    const trail = spawnAnimation("trail", INPUT)
    expect(trail.keyframes[trail.keyframes.length - 1]?.opacity).toBe(0)
    const fan = spawnAnimation("fan", INPUT)
    expect(fan.keyframes[0]?.transform).toContain("rotate(0deg)")
    expect(fan.keyframes[1]?.transform).toContain("rotate(10deg)")
    const strip = spawnAnimation("strip", INPUT)
    expect(strip.keyframes[0]?.transform).toContain("translate(10.0px, 60.0px)")
    expect(strip.keyframes[3]?.transform).toContain("translate(66.0px, 60.0px)")
    expect(strip.keyframes[1]?.transform).toContain("rotate(0deg)")
  })

  it("animates only transform and opacity", () => {
    const frames = (["trail", "pile", "fan", "strip"] as const).flatMap((variant) => spawnAnimation(variant, INPUT).keyframes)
    const properties = new Set([...frames, ...clearAnimation("none", 0).keyframes].flatMap((frame) => Object.keys(frame)))
    expect([...properties].sort()).toEqual(["easing", "offset", "opacity", "transform"])
  })

  it("keeps the rest arrangement away from the middle of the box", () => {
    Object.values(STILL_LAYOUT)
      .flat()
      .forEach((place) => expect(place.top >= 60 || place.top <= 25 ? true : Math.abs(place.left - 50) > 25).toBe(true))
  })
})

describe("ImageTrail", () => {
  it("asks nothing about the pointer during a server render, so it hydrates", () => {
    const media = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    vi.stubGlobal("matchMedia", media)
    expect(renderToString(<Trail />)).toContain("image-trail-still")
    expect(media).not.toHaveBeenCalled()
  })

  it("never holds more than the fixed pool, however many items it gets", () => {
    render(<Trail items={Array.from({ length: 40 }, (_, index) => <i key={index}>{index}</i>)} />)
    expect(document.querySelectorAll("[data-slot='image-trail-node']")).toHaveLength(POOL_SIZE)
  })

  it("spawns by distance from the pointer, not per event", () => {
    render(<Trail spacing={72} />)
    moveTo(10, 10)
    moveTo(20, 10)
    moveTo(30, 10)
    expect(animate).not.toHaveBeenCalled()
    moveTo(90, 10)
    expect(animate).toHaveBeenCalledOnce()
  })

  it("reuses the oldest node once the pool has gone round, cancelling what it was doing", () => {
    render(<Trail spacing={10} />)
    moveTo(0, 0)
    Array.from({ length: POOL_SIZE + 1 }, (_, index) => moveTo((index + 1) * 10, 0))
    expect(animate).toHaveBeenCalledTimes(POOL_SIZE + 1)
    expect(cancel).toHaveBeenCalledOnce()
  })

  it("decoration is hidden from assistive tech and focus, words stay in the tree and selectable", () => {
    render(<Trail />)
    const layer = document.querySelector("[data-slot='image-trail-layer']") as HTMLElement
    expect(layer).toHaveAttribute("aria-hidden", "true")
    expect(layer).toHaveAttribute("inert")
    expect(layer).toHaveClass("pointer-events-none")
    const words = screen.getByText("Walks worth taking")
    expect(words.closest("[aria-hidden]")).toBeNull()
    expect(words.closest("[data-slot='image-trail-content']")).not.toHaveClass("select-none")
  })

  it("shows a still arrangement at rest, so the box is never blank", () => {
    render(<Trail variant="fan" />)
    expect(document.querySelectorAll("[data-slot='image-trail-still-item']")).toHaveLength(STILL_LAYOUT.fan.length)
  })

  it("does nothing for a finger or a coarse pointer, leaving the still arrangement up", () => {
    stubPointer(false)
    render(<Trail spacing={10} />)
    moveTo(0, 0)
    moveTo(100, 0)
    fireEvent.pointerMove(root(), { clientX: 200, clientY: 0, pointerType: "touch" })
    expect(animate).not.toHaveBeenCalled()
    expect(root().dataset.active).toBeUndefined()
  })

  it("does nothing under reduced motion", () => {
    state.reduced = true
    render(<Trail spacing={10} />)
    moveTo(0, 0)
    moveTo(100, 0)
    expect(animate).not.toHaveBeenCalled()
  })

  it("marks itself active while moving and comes back to rest after", () => {
    vi.useFakeTimers()
    render(<Trail spacing={10} />)
    moveTo(0, 0)
    moveTo(50, 0)
    expect(root().dataset.active).toBe("true")
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(root().dataset.active).toBeUndefined()
  })

  it("pile stays until the pointer rests, then clears", () => {
    vi.useFakeTimers()
    render(<Trail variant="pile" spacing={10} />)
    moveTo(0, 0)
    moveTo(10, 0)
    moveTo(20, 0)
    expect(animate).toHaveBeenCalledTimes(2)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(animate).toHaveBeenCalledTimes(2)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(animate).toHaveBeenCalledTimes(4)
    const lastFrames = animate.mock.calls[3]?.[0] as Keyframe[]
    expect(lastFrames[lastFrames.length - 1]?.opacity).toBe(0)
  })

  it("speed spawns larger pictures for a faster pointer", () => {
    const stamp = (clientX: number, timeStamp: number) => {
      const event = new PointerEvent("pointermove", { clientX, clientY: 0, pointerType: "mouse", bubbles: true })
      Object.defineProperty(event, "timeStamp", { value: timeStamp })
      fireEvent(root(), event)
    }
    render(<Trail effect="speed" spacing={10} />)
    stamp(0, 100)
    stamp(10, 200)
    stamp(210, 210)
    const scaleOf = (call: number) => Number(/scale\(([\d.]+)\)/.exec((animate.mock.calls[call]?.[0] as Keyframe[])[1]?.transform as string)?.[1])
    const calls = animate.mock.calls.length
    expect(scaleOf(calls - 1)).toBeGreaterThan(scaleOf(0))
  })

  it("does not re-render per spawn", () => {
    const renders = vi.fn()
    function Counted() {
      renders()
      return <i>a</i>
    }
    render(<Trail items={[<Counted key="a" />]} spacing={10} />)
    const before = renders.mock.calls.length
    moveTo(0, 0)
    moveTo(100, 0)
    expect(renders.mock.calls.length).toBe(before)
  })

  it("cancels everything on unmount", () => {
    vi.useFakeTimers()
    const { unmount } = render(<Trail spacing={10} />)
    moveTo(0, 0)
    moveTo(10, 0)
    unmount()
    expect(cancel).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("differs in structure between variants", () => {
    const { rerender } = render(<Trail variant="trail" />)
    const node = () => document.querySelector("[data-slot='image-trail-node']")
    const still = () => document.querySelectorAll("[data-slot='image-trail-still-item']")
    expect(still()).toHaveLength(4)
    expect(node()).toHaveClass("aspect-[4/5]")
    rerender(<Trail variant="pile" />)
    expect(node()).toHaveClass("ring-4")
    expect(still()).toHaveLength(3)
    rerender(<Trail variant="strip" />)
    expect(node()).toHaveClass("aspect-[8/5]")
  })

  it("handles an empty list without drawing anything", () => {
    render(<Trail items={[]} />)
    expect(document.querySelector("[data-slot='image-trail-node']")).toBeNull()
    expect(document.querySelector("[data-slot='image-trail-still-item']")).toBeNull()
    moveTo(0, 0)
    moveTo(200, 0)
    expect(animate).not.toHaveBeenCalled()
  })
})
