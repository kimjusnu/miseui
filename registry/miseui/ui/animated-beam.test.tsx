import { useRef, useState } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { AnimatedBeam, AnimatedBeamHub, type AnimatedBeamProps } from "./animated-beam"
import { beamEnds, beamPath, boxWithin, isDrawable, type BeamBox } from "./animated-beam-math"

const LEFT: BeamBox = { x: 0, y: 40, width: 40, height: 40 }
const RIGHT: BeamBox = { x: 200, y: 40, width: 40, height: 40 }
const BELOW: BeamBox = { x: 0, y: 200, width: 40, height: 40 }

type RectMap = Map<string, { left: number; top: number; width: number; height: number }>
let rects: RectMap
const observers: Array<() => void> = []

beforeEach(() => {
  rects = new Map([
    ["box", { left: 10, top: 10, width: 300, height: 120 }],
    ["a", { left: 20, top: 50, width: 40, height: 40 }],
    ["b", { left: 240, top: 50, width: 40, height: 40 }],
  ])
  observers.length = 0
  vi.stubGlobal("ResizeObserver", class {
    private callback: () => void
    constructor(callback: () => void) {
      this.callback = callback
      observers.push(callback)
    }
    observe() {
      this.callback()
    }
    disconnect() {}
  })
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function rect(this: HTMLElement) {
    const found = rects.get(this.dataset.testid ?? "") ?? { left: 0, top: 0, width: 0, height: 0 }
    return { ...found, right: found.left + found.width, bottom: found.top + found.height, x: found.left, y: found.top, toJSON: () => ({}) }
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

type HarnessProps = Omit<AnimatedBeamProps, "containerRef" | "fromRef" | "toRef">

/** The beam comes first inside its container on purpose: that is where a layout effect would find the refs still empty. */
function Harness(props: HarnessProps) {
  const box = useRef<HTMLDivElement>(null)
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  return (
    <div ref={box} data-testid="box" className="relative isolate">
      <AnimatedBeam containerRef={box} fromRef={a} toRef={b} {...props} />
      <div ref={a} data-testid="a" />
      <div ref={b} data-testid="b" />
    </div>
  )
}

const basePath = (container: HTMLElement) => container.querySelector('[data-slot="animated-beam-base"]')?.getAttribute("d")
const lights = (container: HTMLElement) => container.querySelectorAll('[data-slot="animated-beam-light"]')

describe("beam maths", () => {
  it("measures against the inside of the container's border", () => {
    expect(boxWithin({ left: 30, top: 40, width: 10, height: 10 }, { left: 10, top: 10, width: 300, height: 200 }, 1, 2)).toEqual({ x: 19, y: 28, width: 10, height: 10 })
  })

  it("runs edge to edge across the larger clearance", () => {
    expect(beamEnds(LEFT, RIGHT)).toEqual({ startX: 40, startY: 60, endX: 200, endY: 60, axis: "x" })
    expect(beamEnds(LEFT, BELOW)).toEqual({ startX: 20, startY: 80, endX: 20, endY: 200, axis: "y" })
    expect(beamEnds(RIGHT, LEFT).startX).toBe(200)
  })

  it("follows a reflow: a stacked pair gets a vertical beam from the same call", () => {
    expect(beamPath(LEFT, RIGHT, "line")).toBe("M 40 60 L 200 60")
    expect(beamPath(LEFT, BELOW, "line")).toBe("M 20 80 L 20 200")
  })

  it("draws nothing to an element with no box", () => {
    const hidden = { x: 0, y: 0, width: 0, height: 0 }
    expect(isDrawable(LEFT, hidden)).toBe(false)
    expect(beamPath(LEFT, hidden, "curve")).toBeNull()
  })

  it("bows a curve by the curvature, on the side its sign says", () => {
    expect(beamPath(LEFT, RIGHT, "curve", 30)).toBe("M 40 60 Q 120 30 200 60")
    expect(beamPath(LEFT, RIGHT, "curve", -30)).toBe("M 40 60 Q 120 90 200 60")
  })

  it("steps with rounded corners, clamped to the room, and goes straight when aligned", () => {
    const low: BeamBox = { x: 200, y: 140, width: 40, height: 40 }
    expect(beamPath(LEFT, low, "step")).toBe("M 40 60 L 108 60 Q 120 60 120 72 L 120 148 Q 120 160 132 160 L 200 160")
    expect(beamPath(LEFT, RIGHT, "step")).toBe("M 40 60 L 200 60")
    const tight: BeamBox = { x: 200, y: 44, width: 40, height: 40 }
    expect(beamPath(LEFT, tight, "step")).toContain("Q 120 60 120 62")
  })

  it("arrives square in a hub, along either axis", () => {
    const low: BeamBox = { x: 200, y: 140, width: 40, height: 40 }
    expect(beamPath(LEFT, low, "hub")).toBe("M 40 60 C 120 60 120 160 200 160")
    expect(beamPath(LEFT, BELOW, "hub")).toContain("C 20 140 20 140")
  })

  it("reverses by swapping the ends, so the bright head still leads", () => {
    expect(beamPath(LEFT, RIGHT, "line", 0, true)).toBe("M 200 60 L 40 60")
    expect(beamPath(LEFT, RIGHT, "curve", 30, true)).toBe("M 200 60 Q 120 30 40 60")
  })
})

describe("AnimatedBeam", () => {
  it("measures after its parents' refs attach, even when placed first, against the container", async () => {
    const { container } = render(<Harness />)
    await waitFor(() => expect(basePath(container)).toBe("M 50 60 L 230 60"))
    expect(container.querySelector('[data-slot="animated-beam"]')).toHaveAttribute("aria-hidden", "true")
  })

  it("draws no path on the server and renders nothing that shifts layout", () => {
    const html = renderToString(<Harness />)
    expect(html).toContain('data-slot="animated-beam"')
    expect(html).not.toContain("animated-beam-base")
    expect(html).toContain("absolute inset-0")
  })

  it("never points at empty space after a reflow", async () => {
    const { container } = render(<Harness />)
    await waitFor(() => expect(basePath(container)).toBe("M 50 60 L 230 60"))
    rects.set("b", { left: 20, top: 150, width: 40, height: 40 })
    act(() => observers.forEach((observer) => observer()))
    expect(basePath(container)).toBe("M 30 80 L 30 140")
    rects.set("b", { left: 0, top: 0, width: 0, height: 0 })
    act(() => observers.forEach((observer) => observer()))
    expect(basePath(container)).toBeUndefined()
  })

  it("gives each variant its own shape", async () => {
    rects.set("b", { left: 240, top: 100, width: 40, height: 40 })
    const shapes = new Set<string | null | undefined>()
    for (const variant of ["line", "curve", "step", "hub"] as const) {
      const { container, unmount } = render(<Harness variant={variant} />)
      await waitFor(() => expect(basePath(container)).toBeTruthy())
      shapes.add(basePath(container))
      unmount()
    }
    expect(shapes.size).toBe(4)
  })

  it("runs a tapering light along the same path, with timing from props, and pauses", async () => {
    const { container, rerender } = render(<Harness duration={5} delay={1} />)
    await waitFor(() => expect(lights(container)).toHaveLength(1))
    const parts = [...(lights(container)[0] as Element).querySelectorAll<SVGPathElement>("path")]
    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(part.getAttribute("d")).toBe("M 50 60 L 230 60")
      expect(part.getAttribute("pathLength")).toBe("1")
      expect(part.style.animationDuration).toBe("5s")
      expect(part.style.animationDelay).toBe("1s")
    }
    expect(new Set(parts.map((part) => part.getAttribute("stroke-dasharray"))).size).toBe(3)
    const layer = container.querySelector('[data-slot="animated-beam"]') as HTMLElement
    expect(layer.style.getPropertyValue("--mise-bg-play")).toBe("running")
    rerender(<Harness duration={5} delay={1} paused />)
    expect(layer.style.getPropertyValue("--mise-bg-play")).toBe("paused")
  })

  it("sends exactly one light per change of the trigger, none on mount", async () => {
    function Pulse() {
      const [count, setCount] = useState(0)
      return (
        <>
          <button onClick={() => setCount(count + 1)}>Send</button>
          <Harness effect="pulse" trigger={count} />
        </>
      )
    }
    const user = userEvent.setup()
    const { container } = render(<Pulse />)
    await waitFor(() => expect(basePath(container)).toBeTruthy())
    expect(lights(container)).toHaveLength(0)
    await user.click(screen.getByRole("button", { name: "Send" }))
    expect(lights(container)).toHaveLength(1)
    act(() => {
      fireEvent((lights(container)[0] as Element).querySelector("path") as Element, new Event("webkitAnimationEnd", { bubbles: true }))
    })
    expect(lights(container)).toHaveLength(0)
  })

  it("renders the pulse effect on the server, where there is no window", () => {
    expect(renderToString(<Harness effect="pulse" trigger={1} />)).toContain('data-effect="pulse"')
  })

  it("cleans its observers up on unmount", async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect")
    const { container, unmount } = render(<Harness />)
    await waitFor(() => expect(basePath(container)).toBeTruthy())
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})

describe("AnimatedBeamHub", () => {
  const SOURCES = ["Payments", "Email", "Calendar"].map((label) => ({ id: label, label, icon: <svg aria-hidden="true" /> }))

  it("draws one beam per source from data and names every node", () => {
    const { container } = render(<AnimatedBeamHub label="Sources feeding the inbox" sources={SOURCES} center={{ id: "inbox", label: "Inbox", icon: <svg aria-hidden="true" /> }} />)
    expect(container.querySelectorAll('[data-slot="animated-beam"]')).toHaveLength(3)
    expect(screen.getByRole("group", { name: "Sources feeding the inbox" })).toHaveAttribute("data-variant", "hub")
    expect(screen.getByRole("img", { name: "Inbox" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
  })

  it("shares the width in a narrow cell and only lies down when there is room", () => {
    const { container } = render(<AnimatedBeamHub sources={SOURCES} center={{ id: "inbox", label: "Inbox", icon: null }} />)
    expect(container.querySelector('[data-slot="animated-beam-hub-sources"]')?.className).toContain("minmax(40px,1fr)")
    expect(container.firstElementChild?.className).toContain("@container")
    expect(container.querySelector('[data-slot="animated-beam-hub-sources"]')?.parentElement?.className).toContain("@md:flex-row")
  })
})
