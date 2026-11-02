/** Hue 0 to 360; saturation, value and alpha 0 to 1. HSV, because it is what the square and the hue bar draw directly. */
export interface Hsva {
  h: number
  s: number
  v: number
  a: number
}

export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

const HEX_PATTERN = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const CHANNEL_MAX = 255

function clampUnitValue(value: number) {
  return Math.min(1, Math.max(0, value))
}

function hsvToRgb({ h, s, v, a }: Hsva): Rgba {
  const hue = (((h % 360) + 360) % 360) / 60
  const channel = (offset: number) => {
    const k = (offset + hue) % 6
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * CHANNEL_MAX)
  }
  return { r: channel(5), g: channel(3), b: channel(1), a }
}

function rgbToHsv({ r, g, b, a }: Rgba): Hsva {
  const [red, green, blue] = [r / CHANNEL_MAX, g / CHANNEL_MAX, b / CHANNEL_MAX]
  const high = Math.max(red, green, blue)
  const chroma = high - Math.min(red, green, blue)
  const sextant = () => {
    if (high === red) return ((green - blue) / chroma + 6) % 6
    if (high === green) return (blue - red) / chroma + 2
    return (red - green) / chroma + 4
  }
  return { h: chroma === 0 ? 0 : sextant() * 60, s: high === 0 ? 0 : chroma / high, v: high, a }
}

function parseHex(text: string): Rgba | null {
  const match = HEX_PATTERN.exec(text.trim())
  if (!match) return null
  const body = match[1].length <= 4 ? Array.from(match[1], (digit) => digit + digit).join("") : match[1]
  const channel = (start: number) => Number.parseInt(body.slice(start, start + 2), 16)
  return { r: channel(0), g: channel(2), b: channel(4), a: body.length === 8 ? channel(6) / CHANNEL_MAX : 1 }
}

/** Opaque colours stay six digits: nobody wants #2563ebff in their stylesheet. */
function rgbaToHex({ r, g, b, a }: Rgba) {
  const pair = (channel: number) => Math.round(channel).toString(16).padStart(2, "0")
  const alpha = a >= 1 ? "" : pair(clampUnitValue(a) * CHANNEL_MAX)
  return `#${pair(r)}${pair(g)}${pair(b)}${alpha}`
}

function hexToHsva(text: string): Hsva | null {
  const rgba = parseHex(text)
  return rgba ? rgbToHsv(rgba) : null
}

function hsvaToHex(color: Hsva) {
  return rgbaToHex(hsvToRgb(color))
}

/** Lower case and full length, so two spellings of one colour compare equal. Null when it is not a colour. */
function normalizeHex(text: string) {
  const rgba = parseHex(text)
  return rgba ? rgbaToHex(rgba) : null
}

function hsvaToCss(color: Hsva) {
  const { r, g, b, a } = hsvToRgb(color)
  return `rgb(${r} ${g} ${b} / ${a})`
}

export { clampUnitValue, hexToHsva, hsvaToCss, hsvaToHex, hsvToRgb, normalizeHex, parseHex, rgbaToHex, rgbToHsv }
