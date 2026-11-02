interface Rgba {
  /** 0 to 255 */
  r: number
  g: number
  b: number
  /** 0 to 1 */
  a: number
}

const INK_DARK = "#0a0a0a"
const INK_LIGHT = "#ffffff"
/** What a transparent colour sits on: the average of the two checker squares. */
const CHECKER_LIGHT = "#ffffff"
const CHECKER_DARK = "#d4d4d8"
const CHECKER_AVERAGE: Rgba = { r: 234, g: 234, b: 236, a: 1 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function parseHex(color: string): Rgba | null {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color)
  if (!match) return null
  const raw = match[1]
  const full = raw.length <= 4 ? [...raw].map((digit) => digit + digit).join("") : raw
  const channel = (start: number) => Number.parseInt(full.slice(start, start + 2), 16)
  return { r: channel(0), g: channel(2), b: channel(4), a: full.length === 8 ? channel(6) / 255 : 1 }
}

/** Both the comma and the space syntax, with or without a slash before alpha. */
function functionArguments(color: string, names: string) {
  const match = new RegExp(`^(?:${names})\\((.+)\\)$`, "i").exec(color)
  return match ? match[1].trim().split(/[\s,/]+/) : null
}

const toNumber = (token: string, percentScale: number) =>
  token.endsWith("%") ? (Number.parseFloat(token) / 100) * percentScale : Number.parseFloat(token)

const toAlpha = (token: string | undefined) => (token === undefined ? 1 : clamp(toNumber(token, 1), 0, 1))

function parseRgb(color: string): Rgba | null {
  const parts = functionArguments(color, "rgba?")
  if (!parts || parts.length < 3) return null
  const [r, g, b] = parts.slice(0, 3).map((token) => clamp(toNumber(token, 255), 0, 255))
  return { r, g, b, a: toAlpha(parts[3]) }
}

function parseHsl(color: string): Rgba | null {
  const parts = functionArguments(color, "hsla?")
  if (!parts || parts.length < 3) return null
  const hue = ((Number.parseFloat(parts[0]) % 360) + 360) % 360
  const saturation = clamp(toNumber(parts[1], 1), 0, 1)
  const lightness = clamp(toNumber(parts[2], 1), 0, 1)
  const chroma = saturation * Math.min(lightness, 1 - lightness)
  const channel = (offset: number) => {
    const turn = (offset + hue / 30) % 12
    return 255 * (lightness - chroma * Math.max(-1, Math.min(turn - 3, 9 - turn, 1)))
  }
  return { r: channel(0), g: channel(8), b: channel(4), a: toAlpha(parts[3]) }
}

const gammaEncode = (linear: number) =>
  255 * clamp(linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055, 0, 1)

/** Björn Ottosson's matrices; the theme colours of this kit are written in oklch. */
function parseOklch(color: string): Rgba | null {
  const parts = functionArguments(color, "oklch")
  if (!parts || parts.length < 3) return null
  const lightness = toNumber(parts[0], 1)
  const chroma = toNumber(parts[1], 0.4)
  const hue = (Number.parseFloat(parts[2]) * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return {
    r: gammaEncode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: gammaEncode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: gammaEncode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: toAlpha(parts[3]),
  }
}

function parseColor(color: string): Rgba | null {
  const text = color.trim()
  if (text.toLowerCase() === "transparent") return { r: 0, g: 0, b: 0, a: 0 }
  const parsed = parseHex(text) ?? parseRgb(text) ?? parseHsl(text) ?? parseOklch(text)
  if (!parsed) return null
  return [parsed.r, parsed.g, parsed.b, parsed.a].some(Number.isNaN) ? null : parsed
}

/** WCAG relative luminance, 0 for black and 1 for white. */
function relativeLuminance({ r, g, b }: Rgba) {
  const linear = (channel: number) => {
    const unit = channel / 255
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function contrastRatio(first: Rgba, second: Rgba) {
  const a = relativeLuminance(first)
  const b = relativeLuminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function compositeOverChecker(color: Rgba): Rgba {
  const mix = (top: number, bottom: number) => top * color.a + bottom * (1 - color.a)
  return {
    r: mix(color.r, CHECKER_AVERAGE.r),
    g: mix(color.g, CHECKER_AVERAGE.g),
    b: mix(color.b, CHECKER_AVERAGE.b),
    a: 1,
  }
}

/** The ink that reads best on this colour as it actually appears, transparency included. */
function readableInk(color: Rgba) {
  const surface = compositeOverChecker(color)
  const onDark = contrastRatio(surface, parseHex(INK_LIGHT) as Rgba)
  const onLight = contrastRatio(surface, parseHex(INK_DARK) as Rgba)
  return onDark > onLight ? INK_LIGHT : INK_DARK
}

/** Conic stops rather than a tiled image: no asset to ship, and it stays sharp at any pixel density. */
const CHECKER_BACKGROUND = `repeating-conic-gradient(${CHECKER_DARK} 0% 25%, ${CHECKER_LIGHT} 0% 50%) 50% / 12px 12px`

export {
  CHECKER_BACKGROUND,
  INK_DARK,
  INK_LIGHT,
  compositeOverChecker,
  contrastRatio,
  parseColor,
  readableInk,
  relativeLuminance,
  type Rgba,
}
