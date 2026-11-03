import { strokesToPath, typedFontSize, type SignatureBox, type SignatureStroke } from "@/registry/miseui/ui/signature-pad-math"

const SCRIPT_FONT = '"Snell Roundhand", "Segoe Script", "Brush Script MT", cursive'
const DEFAULT_STROKE_WIDTH = 2.5
/** A signature leaves the app for a document, so it exports in dark ink even when the pad is in dark mode. */
const DEFAULT_INK = "#111111"

interface SignatureContent {
  strokes: readonly SignatureStroke[]
  /** A typed name. It wins over strokes when it has text. */
  typed?: string
}

interface SignatureExportOptions {
  box: SignatureBox
  color?: string
  strokeWidth?: number
  background?: string
}

const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

function signatureToSvg({ strokes, typed }: SignatureContent, { box, color = DEFAULT_INK, strokeWidth = DEFAULT_STROKE_WIDTH, background }: SignatureExportOptions) {
  const fill = background ? `<rect width="${box.width}" height="${box.height}" fill="${escapeXml(background)}"/>` : ""
  const ink = typed?.trim()
    ? `<text x="${box.width / 2}" y="${box.height / 2}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(SCRIPT_FONT)}" font-size="${typedFontSize(typed, box)}" fill="${escapeXml(color)}">${escapeXml(typed.trim())}</text>`
    : `<path d="${strokesToPath(strokes)}" fill="none" stroke="${escapeXml(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box.width} ${box.height}" width="${box.width}" height="${box.height}">${fill}${ink}</svg>`
}

/** Scale 2 by default: a document prints this far sharper than it shows on screen. */
function signatureToPng({ strokes, typed }: SignatureContent, { box, color = DEFAULT_INK, strokeWidth = DEFAULT_STROKE_WIDTH, background, scale = 2 }: SignatureExportOptions & { scale?: number }) {
  const canvas = document.createElement("canvas")
  canvas.width = box.width * scale
  canvas.height = box.height * scale
  const context = canvas.getContext("2d")
  if (!context) throw new Error("This browser cannot draw to a canvas.")
  context.scale(scale, scale)
  if (background) {
    context.fillStyle = background
    context.fillRect(0, 0, box.width, box.height)
  }
  if (typed?.trim()) {
    context.fillStyle = color
    context.font = `${typedFontSize(typed, box)}px ${SCRIPT_FONT}`
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(typed.trim(), box.width / 2, box.height / 2)
  } else {
    context.strokeStyle = color
    context.lineWidth = strokeWidth
    context.lineCap = "round"
    context.lineJoin = "round"
    context.stroke(new Path2D(strokesToPath(strokes)))
  }
  return canvas.toDataURL("image/png")
}

export { DEFAULT_STROKE_WIDTH, SCRIPT_FONT, signatureToPng, signatureToSvg, type SignatureContent, type SignatureExportOptions }
