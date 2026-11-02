export interface NumberBounds {
  min?: number
  max?: number
}

/** Decimal places in a number, including the ones written as 1e-7. */
function decimalsOf(value: number) {
  const [mantissa, exponent] = String(value).split("e")
  const fraction = mantissa.split(".")[1]?.length ?? 0
  return Math.max(0, fraction - Number(exponent ?? 0))
}

function clampNumber(value: number, { min, max }: NumberBounds) {
  const raised = min === undefined ? value : Math.max(min, value)
  return max === undefined ? raised : Math.min(max, raised)
}

/** Rounds to the step's own precision, because 0.1 + 0.2 must show 0.3 and not 0.30000000000000004. */
function stepValue(current: number | null, delta: number, bounds: NumberBounds) {
  if (current === null) return clampNumber(0, bounds)
  const precision = Math.max(decimalsOf(current), decimalsOf(delta))
  return clampNumber(Number((current + delta).toFixed(precision)), bounds)
}

function decimalSeparator(locale?: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1.5)
  return parts.find((part) => part.type === "decimal")?.value ?? "."
}

/**
 * Reads what people type, formatted or not: "1,234.5", "1.234,5" in German, "$12", "12%".
 * Everything except digits, the sign and the locale's decimal mark is noise. Null means it was not a number.
 */
function parseNumber(text: string, locale?: string, percent = false) {
  const decimal = decimalSeparator(locale)
  const kept = Array.from(text)
    .filter((char) => /[0-9-]/.test(char) || char === decimal)
    .join("")
    .replace(decimal, ".")
  if (kept === "" || kept === "-" || kept === ".") return null
  const parsed = Number(kept)
  if (Number.isNaN(parsed)) return null
  // Intl multiplies percent by 100 when formatting, so typing 12 has to mean 0.12.
  return percent ? Number((parsed / 100).toFixed(decimalsOf(parsed) + 2)) : parsed
}

/** The way round the odometer is shorter: 9 to 0 is one step forward, not nine back. */
function shortestDigitDelta(from: number, to: number) {
  const forward = ((to - from) % 10 + 10) % 10
  return forward > 5 ? forward - 10 : forward
}

/** Where digit `face` sits on a wheel turned to `position`, in cell heights from the window. Wraps so the wheel has no seam. */
function wheelOffset(face: number, position: number) {
  return (((face - position) % 10) + 15) % 10 - 5
}

/** The widest a character in this type gets, as a share of its size. Tabular digits sit just under it. */
const CHARACTER_WIDTH_EM = 0.62

/** Three rem at most, less when the text would not fit: needs a container around the field for `cqi` to measure. */
function fittedFontSize(length: number) {
  const share = (Math.max(length, 1) * CHARACTER_WIDTH_EM).toFixed(2).replace(/0$/, "")
  return `min(3rem, calc(100cqi / ${share}))`
}

export { clampNumber, fittedFontSize, parseNumber, shortestDigitDelta, stepValue, wheelOffset }
