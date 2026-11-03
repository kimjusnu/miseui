import { createRef } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SignaturePad, signatureToPng, signatureToSvg, type SignaturePadHandle, type SignaturePadProps, type SignaturePadVariant, type SignatureValue } from "./signature-pad"
import { addPoint, signatureReducer, smoothPath, strokesToPath, toBoxPoint, typedFontSize } from "./signature-pad-math"

beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 500, height: 200, right: 500, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }))
})

const P = (x: number, y: number) => ({ x, y })

describe("signature maths", () => {
  it("smoothPath: nothing, a dot for a tap, a line for two points", () => {
    expect(smoothPath([])).toBe("")
    expect(smoothPath([P(1, 2)])).toBe("M1 2h0")
    expect(smoothPath([P(0, 0), P(10, 0)])).toBe("M0 0L10 0")
  })

  it("smoothPath curves through midpoints, starting and ending on the real points", () => {
    expect(smoothPath([P(0, 0), P(10, 0), P(10, 10), P(20, 10)])).toBe("M0 0L5 0Q10 0 10 5Q10 10 15 10L20 10")
  })

  it("strokesToPath joins strokes with their own moves, so lifting the pen stays lifted", () => {
    const path = strokesToPath([[P(0, 0), P(1, 1)], [P(5, 5), P(6, 6)]])
    expect(path).toBe("M0 0L1 1M5 5L6 6")
  })

  it("addPoint drops points too close to count and returns a new stroke otherwise", () => {
    const stroke = [P(0, 0)]
    expect(addPoint(stroke, P(0.5, 0.5))).toBe(stroke)
    const next = addPoint(stroke, P(5, 0))
    expect(next).toEqual([P(0, 0), P(5, 0)])
    expect(stroke).toHaveLength(1)
  })

  it("toBoxPoint maps through the pad's scale, letterboxing and edges", () => {
    const box = { width: 500, height: 200 }
    expect(toBoxPoint(250, 50, { left: 0, top: 0, width: 250, height: 100 }, box)).toEqual(P(500, 100))
    expect(toBoxPoint(60, 50, { left: 10, top: 0, width: 250, height: 100 }, box)).toEqual(P(100, 100))
    expect(toBoxPoint(9999, -9, { left: 0, top: 0, width: 250, height: 100 }, box)).toEqual(P(500, 0))
    expect(toBoxPoint(125, 100, { left: 0, top: 0, width: 250, height: 200 }, box)).toEqual(P(250, 100))
    expect(toBoxPoint(5, 5, { left: 0, top: 0, width: 0, height: 0 }, box)).toEqual(P(0, 0))
  })

  it("the reducer undoes strokes, and undo brings back a clear", () => {
    const one = signatureReducer({ strokes: [], past: [] }, { type: "add", stroke: [P(0, 0)] })
    const two = signatureReducer(one, { type: "add", stroke: [P(1, 1)] })
    expect(two.strokes).toHaveLength(2)
    expect(signatureReducer(two, { type: "undo" }).strokes).toHaveLength(1)
    const cleared = signatureReducer(two, { type: "clear" })
    expect(cleared.strokes).toHaveLength(0)
    expect(signatureReducer(cleared, { type: "undo" }).strokes).toHaveLength(2)
    expect(signatureReducer({ strokes: [], past: [] }, { type: "undo" })).toEqual({ strokes: [], past: [] })
    expect(signatureReducer(cleared, { type: "clear" })).toBe(cleared)
  })

  it("typedFontSize shrinks for long names and caps for short ones", () => {
    const box = { width: 500, height: 200 }
    expect(typedFontSize("Mina", box)).toBe(64)
    expect(typedFontSize("Mina Park-Lindqvist Hernandez Oyelaran", box)).toBeLessThan(30)
  })
})

describe("exports", () => {
  const box = { width: 100, height: 50 }

  it("signatureToSvg draws the path in dark ink, on any theme", () => {
    const svg = signatureToSvg({ strokes: [[P(0, 0), P(1, 1)]] }, { box })
    expect(svg).toContain('d="M0 0L1 1"')
    expect(svg).toContain('stroke="#111111"')
    expect(svg).toContain('viewBox="0 0 100 50"')
    expect(svg).not.toContain("<rect")
  })

  it("signatureToSvg writes a typed name as escaped text, with a background on request", () => {
    const svg = signatureToSvg({ strokes: [], typed: '<Mina & "Co">' }, { box, background: "#fff" })
    expect(svg).toContain("&lt;Mina &amp; &quot;Co&quot;&gt;")
    expect(svg).toContain('<rect width="100" height="50" fill="#fff"/>')
  })

  it("signatureToPng scales up, strokes the path and returns a data URL", () => {
    const stroke = vi.fn()
    const scale = vi.fn()
    vi.stubGlobal("Path2D", class {})
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ stroke, scale, fillRect: vi.fn() } as unknown as CanvasRenderingContext2D)
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,x")
    expect(signatureToPng({ strokes: [[P(0, 0), P(1, 1)]] }, { box, scale: 3 })).toBe("data:image/png;base64,x")
    expect(scale).toHaveBeenCalledWith(3, 3)
    expect(stroke).toHaveBeenCalled()
    getContext.mockRestore()
    toDataURL.mockRestore()
    vi.unstubAllGlobals()
  })

  it("signatureToPng fails loudly without a canvas", () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    expect(() => signatureToPng({ strokes: [] }, { box })).toThrow("cannot draw")
    getContext.mockRestore()
  })
})

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const surface = () => document.querySelector("[data-slot='signature-pad-surface']") as HTMLElement
const strokes = () => document.querySelectorAll("[data-slot='signature-pad-stroke']")
const renderPad = (props: Partial<SignaturePadProps> = {}) => render(<SignaturePad {...props} />)

function draw(points: readonly [number, number][], pointerId = 1) {
  const [first, ...rest] = points
  fireEvent.pointerDown(surface(), { pointerId, button: 0, isPrimary: true, clientX: first[0], clientY: first[1] })
  rest.forEach(([clientX, clientY]) => fireEvent.pointerMove(surface(), { pointerId, clientX, clientY }))
  fireEvent.pointerUp(surface(), { pointerId })
}

describe("SignaturePad", () => {
  it("drawing makes one stroke per pen-down and reports the smoothed path", () => {
    const onChange = vi.fn<(value: SignatureValue) => void>()
    renderPad({ onChange })
    draw([[10, 10], [50, 20], [90, 10]])
    expect(strokes()).toHaveLength(1)
    const value = onChange.mock.lastCall?.[0]
    expect(value?.empty).toBe(false)
    expect(value?.path.startsWith("M10 10")).toBe(true)
    draw([[100, 100], [140, 100]])
    expect(strokes()).toHaveLength(2)
    expect(screen.getByRole("img", { name: "Signature, 2 strokes" })).toBeInTheDocument()
  })

  it("captures the pointer and keeps the stroke in view while it is drawn", () => {
    renderPad()
    const capture = vi.mocked(Element.prototype.setPointerCapture)
    capture.mockClear()
    fireEvent.pointerDown(surface(), { pointerId: 7, button: 0, isPrimary: true, clientX: 5, clientY: 5 })
    expect(capture).toHaveBeenCalledWith(7)
    fireEvent.pointerMove(surface(), { pointerId: 7, clientX: 40, clientY: 40 })
    expect(strokes()).toHaveLength(1)
    fireEvent.pointerCancel(surface(), { pointerId: 7 })
    expect(strokes()).toHaveLength(0)
  })

  it("ignores a second finger and the right button", () => {
    renderPad()
    fireEvent.pointerDown(surface(), { pointerId: 2, button: 0, isPrimary: false, clientX: 5, clientY: 5 })
    fireEvent.pointerUp(surface(), { pointerId: 2 })
    fireEvent.pointerDown(surface(), { pointerId: 3, button: 2, isPrimary: true, clientX: 5, clientY: 5 })
    fireEvent.pointerUp(surface(), { pointerId: 3 })
    expect(strokes()).toHaveLength(0)
  })

  it("undo removes the last stroke, clear wipes the page, and undo brings it back", async () => {
    const user = setup()
    renderPad()
    const undo = screen.getByRole("button", { name: "Undo" })
    const clear = screen.getByRole("button", { name: "Clear" })
    expect(undo).toBeDisabled()
    expect(clear).toBeDisabled()
    draw([[10, 10], [50, 20]])
    draw([[60, 10], [80, 20]])
    await user.click(undo)
    expect(strokes()).toHaveLength(1)
    await user.click(clear)
    expect(strokes()).toHaveLength(0)
    expect(screen.getByText("Sign here")).toBeInTheDocument()
    await user.click(undo)
    expect(strokes()).toHaveLength(1)
  })

  it("keyboard users can type a name: focus lands in the field, and it reports and exports", async () => {
    const user = setup()
    const onChange = vi.fn<(value: SignatureValue) => void>()
    const ref = createRef<SignaturePadHandle>()
    renderPad({ onChange, ref })
    await user.tab()
    expect(screen.getByRole("button", { name: "Type instead" })).toHaveFocus()
    await user.keyboard("{Enter}")
    const field = screen.getByRole("textbox", { name: "Your full name" })
    expect(field).toHaveFocus()
    await user.keyboard("Mina Park")
    expect(onChange.mock.lastCall?.[0]).toMatchObject({ typed: "Mina Park", path: "", empty: false })
    expect(document.querySelector("svg text")).toHaveTextContent("Mina Park")
    expect(ref.current?.toSvg()).toContain(">Mina Park</text>")
    expect(ref.current?.isEmpty()).toBe(false)
    expect(screen.getByRole("img", { name: "Signature, Mina Park" })).toBeInTheDocument()
  })

  it("while typing the pad does not draw, and going back returns the strokes", async () => {
    const user = setup()
    renderPad()
    draw([[10, 10], [50, 20]])
    await user.click(screen.getByRole("button", { name: "Type instead" }))
    draw([[100, 100], [150, 100]])
    await user.click(screen.getByRole("button", { name: "Draw instead" }))
    expect(strokes()).toHaveLength(1)
  })

  it("the handle exports the path, an SVG and clears", () => {
    const ref = createRef<SignaturePadHandle>()
    renderPad({ ref })
    expect(ref.current?.isEmpty()).toBe(true)
    draw([[10, 10], [50, 10]])
    expect(ref.current?.toSvgPath()).toBe("M10 10L50 10")
    expect(ref.current?.toSvg({ color: "#000" })).toContain('stroke="#000"')
  })

  it("draws from defaultStrokes, so a saved signature can come back", () => {
    renderPad({ defaultStrokes: [[P(1, 1), P(9, 9)]] })
    expect(strokes()).toHaveLength(1)
  })

  it("posts the path with a form", () => {
    render(
      <form data-testid="form">
        <SignaturePad name="signature" defaultStrokes={[[P(1, 1), P(9, 9)]]} />
      </form>,
    )
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("signature")).toBe("M1 1L9 9")
  })

  it("disabled neither draws nor offers actions", () => {
    renderPad({ disabled: true })
    draw([[10, 10], [50, 20]])
    expect(strokes()).toHaveLength(0)
    expect(screen.getByRole("button", { name: "Type instead" })).toBeDisabled()
  })

  it("variants differ in structure", () => {
    const shapes = (["plain", "line", "card", "compact"] as readonly SignaturePadVariant[]).map((variant) => {
      const { unmount } = renderPad({ variant, title: "Sign the lease", description: "This is binding." })
      const root = document.querySelector("[data-slot='signature-pad']") as HTMLElement
      const result = {
        variant: root.getAttribute("data-variant"),
        rule: Boolean(root.querySelector("[data-slot='signature-pad-rule']")),
        heading: within(root).queryByText("Sign the lease") !== null,
        actionsInPad: surface().parentElement?.querySelector("[data-slot='signature-pad-actions']")?.parentElement === surface().parentElement && surface().parentElement !== root,
      }
      unmount()
      return result
    })
    expect(shapes).toEqual([
      { variant: "plain", rule: false, heading: false, actionsInPad: false },
      { variant: "line", rule: true, heading: false, actionsInPad: false },
      { variant: "card", rule: false, heading: true, actionsInPad: false },
      { variant: "compact", rule: false, heading: false, actionsInPad: true },
    ])
  })

  it("compact shows only the controls that can act right now", () => {
    renderPad({ variant: "compact" })
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull()
    expect(screen.getByRole("button", { name: "Type instead" })).toBeInTheDocument()
    draw([[10, 10], [50, 20]])
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument()
  })

  it("line says where to sign until someone has", () => {
    renderPad({ variant: "line" })
    expect(screen.getByText("Sign above the line")).not.toHaveClass("invisible")
    draw([[10, 10], [50, 20]])
    expect(screen.getByText("Sign above the line")).toHaveClass("invisible")
  })
})
