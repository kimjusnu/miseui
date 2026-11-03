interface SignaturePoint {
  x: number
  y: number
}

type SignatureStroke = readonly SignaturePoint[]

interface SignatureBox {
  width: number
  height: number
}

interface SignatureHistory {
  strokes: readonly SignatureStroke[]
  /** Every earlier state, so undo can also bring back a page someone cleared by accident. */
  past: readonly (readonly SignatureStroke[])[]
}

type SignatureAction = { type: "add"; stroke: SignatureStroke } | { type: "clear" } | { type: "undo" }

const MIN_POINT_DISTANCE = 1.5
const round = (value: number) => Math.round(value * 10) / 10
const at = (point: SignaturePoint) => `${round(point.x)} ${round(point.y)}`
const middle = (a: SignaturePoint, b: SignaturePoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Pointers report faster than a hand moves; points this close only add jitter to the curve. */
function addPoint(stroke: SignatureStroke, next: SignaturePoint, minDistance = MIN_POINT_DISTANCE): SignatureStroke {
  const last = stroke[stroke.length - 1]
  if (last && Math.hypot(next.x - last.x, next.y - last.y) < minDistance) return stroke
  return [...stroke, next]
}

/**
 * Each sampled point becomes a control point and the curve passes through the midpoints between them.
 * Neighbouring curves then share a tangent, so a hand's corners come out as ink, not as a polygon.
 */
function smoothPath(stroke: SignatureStroke) {
  if (stroke.length === 0) return ""
  const [first, ...rest] = stroke
  // A tap is still a mark: a zero-length line with a round cap paints a dot.
  if (rest.length === 0) return `M${at(first)}h0`
  if (rest.length === 1) return `M${at(first)}L${at(rest[0])}`
  const curves = rest
    .slice(0, -1)
    .map((point, index) => `Q${at(point)} ${at(middle(point, rest[index + 1]))}`)
    .join("")
  return `M${at(first)}L${at(middle(first, rest[0]))}${curves}L${at(rest[rest.length - 1])}`
}

const strokesToPath = (strokes: readonly SignatureStroke[]) => strokes.map(smoothPath).join("")

/** Matches the SVG's own "meet" fit, so the ink lands under the pen even if a page stretches the pad to another shape. */
function toBoxPoint(clientX: number, clientY: number, rect: Pick<DOMRect, "left" | "top" | "width" | "height">, box: SignatureBox): SignaturePoint {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 }
  const scale = Math.min(rect.width / box.width, rect.height / box.height)
  const offsetX = (rect.width - box.width * scale) / 2
  const offsetY = (rect.height - box.height * scale) / 2
  return {
    x: Math.min(box.width, Math.max(0, (clientX - rect.left - offsetX) / scale)),
    y: Math.min(box.height, Math.max(0, (clientY - rect.top - offsetY) / scale)),
  }
}

function signatureReducer(state: SignatureHistory, action: SignatureAction): SignatureHistory {
  if (action.type === "add") {
    if (action.stroke.length === 0) return state
    return { strokes: [...state.strokes, action.stroke], past: [...state.past, state.strokes] }
  }
  if (action.type === "clear") {
    if (state.strokes.length === 0) return state
    return { strokes: [], past: [...state.past, state.strokes] }
  }
  if (state.past.length === 0) return state
  return { strokes: state.past[state.past.length - 1], past: state.past.slice(0, -1) }
}

/** Long names shrink to stay inside the pad. The factor is an average glyph width for script faces. */
function typedFontSize(name: string, box: SignatureBox) {
  const glyphs = Math.max(1, name.trim().length)
  return Math.min(box.height * 0.32, (box.width * 0.88) / (glyphs * 0.48))
}

export { addPoint, signatureReducer, smoothPath, strokesToPath, toBoxPoint, typedFontSize, type SignatureAction, type SignatureBox, type SignatureHistory, type SignaturePoint, type SignatureStroke }
