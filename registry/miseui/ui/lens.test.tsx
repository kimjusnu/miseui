import { renderToString } from "react-dom/server"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Lens, type LensProps } from "./lens"
import { lensBodyPosition, lensCopyOffset, lensFocus, lensNudge, lensPointFromFraction, lensRegion, lensViewSize } from "./lens-math"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

const BOX = { width: 300, height: 200 }

function stubPointer(fine: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: fine, media: query, addEventListener() {}, removeEventListener() {} }))
}

function Sample(props: LensProps) {
  return (
    <Lens {...props}>
      <div>
        <label htmlFor="city">City</label>
        <input id="city" name="city" />
        <a href="#more">Read more</a>
      </div>
    </Lens>
  )
}

const root = () => document.querySelector("[data-slot='lens']") as HTMLElement
const stage = () => document.querySelector("[data-slot='lens-stage']") as HTMLElement
const view = () => document.querySelector("[data-slot='lens-view']") as HTMLElement
const copy = () => document.querySelector("[data-slot='lens-copy']") as HTMLElement | null

beforeEach(() => {
  state.reduced = false
  stubPointer(true)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 300, bottom: 200, width: 300, height: 200, x: 0, y: 0, toJSON() {} })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("lens geometry", () => {
  it("keeps the sampled region inside the content, so the view never shows empty space", () => {
    const lens = { width: 100, height: 100 }
    expect(lensFocus({ x: 0, y: 0 }, BOX, lens, 2)).toEqual({ x: 25, y: 25 })
    expect(lensFocus({ x: 300, y: 200 }, BOX, lens, 2)).toEqual({ x: 275, y: 175 })
    expect(lensFocus({ x: 120, y: 90 }, BOX, lens, 2)).toEqual({ x: 120, y: 90 })
  })

  it("centres content smaller than the sampled region", () => {
    expect(lensFocus({ x: 10, y: 10 }, { width: 40, height: 40 }, { width: 100, height: 100 }, 1)).toEqual({ x: 20, y: 20 })
  })

  it("places the copy so the focus lands in the middle of the view at every corner", () => {
    const lens = { width: 100, height: 100 }
    const zoom = 3
    ;[{ x: 0, y: 0 }, { x: 300, y: 200 }, { x: 0, y: 200 }, { x: 150, y: 100 }].forEach((point) => {
      const offset = lensCopyOffset(lensFocus(point, BOX, lens, zoom), lens, zoom)
      expect(offset.x).toBeLessThanOrEqual(0)
      expect(offset.y).toBeLessThanOrEqual(0)
      expect(offset.x + BOX.width * zoom).toBeGreaterThanOrEqual(lens.width)
      expect(offset.y + BOX.height * zoom).toBeGreaterThanOrEqual(lens.height)
    })
  })

  it("keeps the lens itself inside the box and lifts the loupe off its point", () => {
    const lens = { width: 100, height: 100 }
    expect(lensBodyPosition({ x: 0, y: 0 }, BOX, lens, "centre")).toEqual({ x: 0, y: 0 })
    expect(lensBodyPosition({ x: 300, y: 200 }, BOX, lens, "centre")).toEqual({ x: 200, y: 100 })
    expect(lensBodyPosition({ x: 150, y: 150 }, BOX, lens, "above")).toEqual({ x: 100, y: 34 })
    expect(lensBodyPosition({ x: 150, y: 40 }, BOX, lens, "above")).toEqual({ x: 100, y: 56 })
    expect(lensBodyPosition({ x: 150, y: 150 }, BOX, { width: 300, height: 60 }, "band")).toEqual({ x: 0, y: 120 })
  })

  it("never makes the view larger than the content, and a band fills the width", () => {
    expect(lensViewSize("centre", 500, BOX)).toEqual({ width: 300, height: 200 })
    expect(lensViewSize("band", 64, BOX)).toEqual({ width: 300, height: 64 })
  })

  it("computes the region a panel shows", () => {
    expect(lensRegion({ x: 100, y: 100 }, { width: 200, height: 100 }, 2)).toEqual({ x: 50, y: 75, width: 100, height: 50 })
  })

  it("nudges inside the content and ignores other keys", () => {
    expect(lensNudge({ x: 10, y: 10 }, "ArrowLeft", BOX, 16)).toEqual({ x: 0, y: 10 })
    expect(lensNudge({ x: 300, y: 10 }, "ArrowRight", BOX, 16)).toEqual({ x: 300, y: 10 })
    expect(lensNudge({ x: 10, y: 10 }, "Enter", BOX, 16)).toBeNull()
  })

  it("reads a fractional resting point", () => {
    expect(lensPointFromFraction({ x: 0.25, y: 0.5 }, BOX)).toEqual({ x: 75, y: 100 })
    expect(lensPointFromFraction(undefined, BOX)).toEqual({ x: 150, y: 100 })
  })
})

describe("Lens", () => {
  it("asks nothing about the pointer during a server render, so it hydrates", () => {
    const media = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    vi.stubGlobal("matchMedia", media)
    expect(renderToString(<Sample />)).toContain("lens-stage")
    expect(media).not.toHaveBeenCalled()
  })

  it("does not render a second copy before it is needed", () => {
    render(<Sample />)
    expect(copy()).toBeNull()
  })

  it("follows a fine pointer and hides on leave, with position written directly", () => {
    render(<Sample />)
    fireEvent.pointerMove(stage(), { clientX: 150, clientY: 100, pointerType: "mouse" })
    expect(root()).toHaveAttribute("data-shown", "true")
    expect(view().style.transform).toBe("translate(86px, 36px)")
    expect(copy()?.style.transform).toMatch(/scale\(2\)/)
    fireEvent.pointerLeave(stage(), { pointerType: "mouse" })
    expect(root()).toHaveAttribute("data-shown", "false")
  })

  it("keeps the second copy out of focus, assistive tech and id lookups", () => {
    render(<Sample />)
    fireEvent.pointerMove(stage(), { clientX: 150, clientY: 100, pointerType: "mouse" })
    const clone = copy() as HTMLElement
    expect(clone).toHaveAttribute("aria-hidden", "true")
    expect(clone).toHaveAttribute("inert")
    expect(document.querySelectorAll("#city")).toHaveLength(1)
    expect(document.querySelectorAll("[name='city']")).toHaveLength(1)
    expect(screen.getAllByRole("link", { name: "Read more" })).toHaveLength(1)
    expect(screen.getByLabelText("City")).toBe(document.querySelector("[data-slot='lens-content'] input"))
  })

  it("does not swallow a click on what is inside", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(
      <Lens>
        <a href="#x" onClick={onClick}>
          Details
        </a>
      </Lens>,
    )
    await user.click(screen.getByRole("link", { name: "Details" }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("is keyboard operable: arrows show and move it, Escape hides it", async () => {
    const user = userEvent.setup()
    render(<Sample variant="square" />)
    root().focus()
    await user.keyboard("{ArrowRight}")
    expect(root()).toHaveAttribute("data-shown", "true")
    const first = view().style.transform
    await user.keyboard("{ArrowRight}")
    expect(view().style.transform).not.toBe(first)
    await user.keyboard("{Escape}")
    expect(root()).toHaveAttribute("data-shown", "false")
  })

  it("leaves arrow keys alone inside a field", async () => {
    const user = userEvent.setup()
    render(<Sample />)
    screen.getByLabelText("City").focus()
    await user.keyboard("{ArrowRight}")
    expect(root()).toHaveAttribute("data-shown", "false")
  })

  it("does not follow a finger, but a tap places it and a second tap removes it", () => {
    stubPointer(false)
    render(<Sample />)
    fireEvent.pointerMove(stage(), { clientX: 150, clientY: 100, pointerType: "touch" })
    expect(root()).toHaveAttribute("data-shown", "false")
    expect(stage()).not.toHaveClass("touch-none")
    fireEvent.pointerDown(stage(), { clientX: 150, clientY: 100, pointerType: "touch" })
    fireEvent.pointerUp(stage(), { clientX: 150, clientY: 100, pointerType: "touch" })
    expect(root()).toHaveAttribute("data-shown", "true")
    fireEvent.pointerDown(stage(), { clientX: 150, clientY: 100, pointerType: "touch" })
    fireEvent.pointerUp(stage(), { clientX: 150, clientY: 100, pointerType: "touch" })
    expect(root()).toHaveAttribute("data-shown", "false")
  })

  it("does not follow the pointer under reduced motion", () => {
    state.reduced = true
    render(<Sample />)
    fireEvent.pointerMove(stage(), { clientX: 150, clientY: 100, pointerType: "mouse" })
    expect(root()).toHaveAttribute("data-shown", "false")
  })

  it("press shows only while pressed, a finger drags it, and the page does not scroll for that gesture", () => {
    stubPointer(false)
    render(<Sample effect="press" />)
    expect(stage()).toHaveClass("touch-none")
    fireEvent.pointerMove(stage(), { clientX: 10, clientY: 10, pointerType: "touch" })
    expect(root()).toHaveAttribute("data-shown", "false")
    fireEvent.pointerDown(stage(), { clientX: 150, clientY: 100, pointerType: "touch" })
    expect(root()).toHaveAttribute("data-shown", "true")
    const first = view().style.transform
    fireEvent.pointerMove(stage(), { clientX: 200, clientY: 120, pointerType: "touch" })
    expect(view().style.transform).not.toBe(first)
    fireEvent.pointerUp(stage(), { clientX: 200, clientY: 120, pointerType: "touch" })
    expect(root()).toHaveAttribute("data-shown", "false")
  })

  it("press captures a mouse only after it has really moved, so a click on a link keeps its target", () => {
    const capture = vi.fn()
    HTMLElement.prototype.setPointerCapture = capture
    HTMLElement.prototype.hasPointerCapture = () => false
    render(<Sample effect="press" />)
    fireEvent.pointerDown(stage(), { clientX: 150, clientY: 100, pointerType: "mouse" })
    fireEvent.pointerMove(stage(), { clientX: 151, clientY: 100, pointerType: "mouse" })
    expect(capture).not.toHaveBeenCalled()
    fireEvent.pointerMove(stage(), { clientX: 170, clientY: 100, pointerType: "mouse" })
    expect(capture).toHaveBeenCalled()
  })

  it("rests visibly at a default point and returns there on leave, until Escape", async () => {
    const user = userEvent.setup()
    render(<Sample defaultPoint={{ x: 0.5, y: 0.5 }} />)
    expect(root()).toHaveAttribute("data-shown", "true")
    expect(copy()).toBeInTheDocument()
    const resting = view().style.transform
    fireEvent.pointerMove(stage(), { clientX: 10, clientY: 10, pointerType: "mouse" })
    expect(view().style.transform).not.toBe(resting)
    fireEvent.pointerLeave(stage(), { pointerType: "mouse" })
    expect(root()).toHaveAttribute("data-shown", "true")
    expect(view().style.transform).toBe(resting)
    root().focus()
    await user.keyboard("{Escape}")
    expect(root()).toHaveAttribute("data-shown", "false")
  })

  it("differs in structure between variants", () => {
    const { rerender } = render(<Sample variant="panel" />)
    expect(document.querySelector("[data-slot='lens-panel']")).toBeInTheDocument()
    expect(document.querySelector("[data-slot='lens-region']")).toBeInTheDocument()
    expect(view()).toBeNull()
    expect(copy()).toBeInTheDocument()
    rerender(<Sample variant="square" />)
    fireEvent.pointerMove(stage(), { clientX: 150, clientY: 150, pointerType: "mouse" })
    expect(document.querySelector("[data-slot='lens-crosshair']")).toBeInTheDocument()
    expect(document.querySelector("[data-slot='lens-zoom']")).toHaveTextContent("2x")
    rerender(<Sample variant="circle" />)
    expect(document.querySelector("[data-slot='lens-crosshair']")).toBeNull()
    expect(view().firstElementChild).toHaveClass("rounded-full")
    rerender(<Sample variant="strip" />)
    expect(view().style.width).toBe("300px")
  })

  it("stops the panel region at the edge and shows it only while in use", () => {
    render(<Sample variant="panel" />)
    const region = document.querySelector("[data-slot='lens-region']") as HTMLElement
    expect(region).toHaveClass("opacity-0")
    fireEvent.pointerMove(stage(), { clientX: 0, clientY: 0, pointerType: "mouse" })
    expect(region).toHaveClass("opacity-100")
    expect(region.style.transform).toBe("translate(0px, 0px)")
  })
})
