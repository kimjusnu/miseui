export type Rgb = readonly [number, number, number]

function channelLuminance(channel: number) {
  const unit = channel / 255
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
}

function luminance([r, g, b]: Rgb) {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

export function contrast(a: Rgb, b: Rgb) {
  const one = luminance(a) + 0.05
  const two = luminance(b) + 0.05
  return one > two ? one / two : two / one
}

export const mixRgb = (from: Rgb, to: Rgb, amount: number): Rgb => [
  from[0] + (to[0] - from[0]) * amount,
  from[1] + (to[1] - from[1]) * amount,
  from[2] + (to[2] - from[2]) * amount,
]

/** A near-black accent on a dark page would vanish, and a pale one on a light page. Walks it toward the foreground only as far as it takes. */
export function legibleAccent(accent: Rgb, surface: Rgb, foreground: Rgb, minimum = 2.2): Rgb {
  for (let amount = 0; amount <= 1; amount += 0.1) {
    const candidate = mixRgb(accent, foreground, amount)
    if (contrast(candidate, surface) >= minimum) return candidate
  }
  return foreground
}

/** Land covers a third of the disc, and a full accent over that much area shouts. Dark takes less, because a warm hue mixed into a dark ocean turns brown. */
export function softLand(accent: Rgb, ocean: Rgb, foreground: Rgb): Rgb {
  const share = luminance(ocean) > 0.5 ? 0.35 : 0.15
  return legibleAccent(mixRgb(accent, ocean, share), ocean, foreground, 1.5)
}

export interface Ink {
  foreground: Rgb
  surface: Rgb
  ocean: Rgb
  accent: Rgb
  land: Rgb
}

/** Canvas parses any CSS colour the theme uses, oklch included, so asking it is shorter than writing a parser. */
export function readInk(canvas: HTMLCanvasElement): Ink {
  const styles = getComputedStyle(canvas)
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  const resolve = (name: string, fallback: Rgb): Rgb => {
    const value = styles.getPropertyValue(name).trim()
    if (!probe || !value) return fallback
    probe.clearRect(0, 0, 1, 1)
    probe.fillStyle = value
    probe.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data
    return [r, g, b]
  }
  const foreground = resolve("--foreground", [32, 32, 36])
  const surface = resolve("--background", [255, 255, 255])
  const ocean = resolve("--secondary", [238, 238, 241])
  const mise = resolve("--mise", [136, 136, 136])
  return { foreground, surface, ocean, accent: legibleAccent(mise, surface, foreground), land: softLand(mise, ocean, foreground) }
}

export function watchTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  media.addEventListener?.("change", onChange)
  return () => {
    observer.disconnect()
    media.removeEventListener?.("change", onChange)
  }
}
