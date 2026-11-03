/** Shown instead of a number when the value is NaN or infinite. An en dash, so it reads as "none" and not as a minus. */
const UNAVAILABLE_MARK = "–"

const MAX_FRACTION_DIGITS = 20

interface CountFormatInput {
  /** Leave unset to follow the viewer. A server-rendered page should pass one, or its first paint can differ from the client. */
  locale?: Intl.LocalesArgument
  formatOptions?: Intl.NumberFormatOptions
  prefix?: string
  suffix?: string
}

interface DigitToken {
  kind: "digit"
  key: string
  /** Power of ten this digit stands for: 0 for ones, 1 for tens, -1 for tenths. */
  place: number
  digit: number
}

interface MarkToken {
  kind: "mark"
  key: string
  text: string
}

type CountToken = DigitToken | MarkToken

/** Decimal places of a number as written, including the ones hidden in exponent form like 1.5e-7. */
function decimalsOf(value: number) {
  if (!Number.isFinite(value)) return 0
  const [mantissa, exponent = "0"] = String(Math.abs(value)).split("e")
  const written = mantissa.split(".")[1]?.length ?? 0
  return Math.min(MAX_FRACTION_DIGITS, Math.max(0, written - Number(exponent)))
}

/** Intl has its own good answer for these, so a fixed fraction length would only fight it. */
function leavesDigitsToIntl(options: Intl.NumberFormatOptions) {
  return (
    options.notation === "compact" ||
    options.style === "currency" ||
    options.minimumFractionDigits !== undefined ||
    options.maximumFractionDigits !== undefined ||
    options.minimumSignificantDigits !== undefined ||
    options.maximumSignificantDigits !== undefined
  )
}

/** Holds the number of decimals of the final value through the whole count, so the text never changes length on the way. */
function resolveFormatOptions(value: number, options: Intl.NumberFormatOptions = {}): Intl.NumberFormatOptions {
  if (leavesDigitsToIntl(options)) return options
  const written = decimalsOf(value)
  const decimals = options.style === "percent" ? Math.max(0, written - 2) : written
  return { ...options, minimumFractionDigits: decimals, maximumFractionDigits: decimals }
}

/** The ten digit glyphs of this locale, in value order. Arabic-Indic and other numbering systems roll as well as Latin. */
function digitGlyphs(locale?: Intl.LocalesArgument, options: Intl.NumberFormatOptions = {}): readonly string[] {
  const format = new Intl.NumberFormat(locale, { numberingSystem: options.numberingSystem, useGrouping: false, maximumFractionDigits: 0 })
  return Array.from({ length: 10 }, (_, digit) => format.format(digit))
}

const countIntegerDigits = (parts: readonly Intl.NumberFormatPart[]) =>
  parts.filter((part) => part.type === "integer").reduce((sum, part) => sum + Array.from(part.value).length, 0)

interface TokenWalk {
  tokens: readonly CountToken[]
  /** Next place to hand out, counting down through the integer and on into the fraction. */
  place: number
}

function appendDigits(walk: TokenWalk, text: string, glyphs: readonly string[]): TokenWalk {
  const digits = Array.from(text)
  const tokens = digits.map<CountToken>((glyph, offset) => {
    const place = walk.place - offset
    return { kind: "digit", key: `digit:${place}`, place, digit: Math.max(0, glyphs.indexOf(glyph)) }
  })
  return { tokens: [...walk.tokens, ...tokens], place: walk.place - digits.length }
}

/** Splits a number on formatToParts, so group marks, minus signs and compact units like 1.5천 land where the locale puts them. */
function toTokens(parts: readonly Intl.NumberFormatPart[], glyphs: readonly string[]): readonly CountToken[] {
  const walk = parts.reduce<TokenWalk>(
    (state, part, position) => {
      if (part.type === "integer" || part.type === "fraction") return appendDigits(state, part.value, glyphs)
      // A group mark is keyed by the digit beside it, so its reel keeps its identity when the number grows on the left.
      const anchor = part.type === "group" || part.type === "decimal" ? `${state.place}` : `${position}`
      return { ...state, tokens: [...state.tokens, { kind: "mark", key: `${part.type}:${anchor}`, text: part.value }] }
    },
    { tokens: [], place: countIntegerDigits(parts) - 1 },
  )
  return walk.tokens
}

const isDigit = (token: CountToken): token is DigitToken => token.kind === "digit"

/** The number the digits spell, ignoring units: 1.5 for 1.5천, 72 for 72%. */
function spelledValue(tokens: readonly CountToken[]) {
  return tokens.filter(isDigit).reduce((sum, token) => sum + token.digit * 10 ** token.place, 0)
}

interface CountFormat {
  text: (current: number) => string
  tokens: (current: number) => readonly CountToken[]
  glyphs: readonly string[]
  /** What one unit of the spelled digits is worth in the real value. 1000 for 1.5천, 0.01 for 72%. */
  scale: number
}

function createCountFormat(value: number, { locale, formatOptions, prefix = "", suffix = "" }: CountFormatInput = {}): CountFormat {
  const format = new Intl.NumberFormat(locale, resolveFormatOptions(value, formatOptions))
  const glyphs = digitGlyphs(locale, formatOptions)
  // A count passing through -0.2 must not print "-0" for a frame.
  const signless = (current: number) => (current < 0 && spelledValue(toTokens(format.formatToParts(current), glyphs)) === 0 ? 0 : current)
  const tokens = (current: number): readonly CountToken[] => [
    ...(prefix ? [{ kind: "mark" as const, key: "prefix", text: prefix }] : []),
    ...toTokens(format.formatToParts(signless(current)), glyphs),
    ...(suffix ? [{ kind: "mark" as const, key: "suffix", text: suffix }] : []),
  ]
  const spelled = spelledValue(tokens(value))
  return {
    text: (current) => `${prefix}${format.format(signless(current))}${suffix}`,
    tokens,
    glyphs,
    scale: spelled > 0 ? Math.abs(value) / spelled : 1,
  }
}

/** While a count shrinks from 100 to 99 the third reel still has to show the 1 it is rolling away from. */
function widerTokens(resting: readonly CountToken[], target: readonly CountToken[]) {
  return resting.filter(isDigit).length > target.filter(isDigit).length ? resting : target
}

/** How full the meter line is. `top` is the full-line value: the owner's max, or the first value if there is none. */
function meterFraction(current: number, from: number, top: number) {
  if (top === from) return 1
  return Math.min(1, Math.max(0, (current - from) / (top - from)))
}

export {
  UNAVAILABLE_MARK,
  createCountFormat,
  decimalsOf,
  digitGlyphs,
  isDigit,
  meterFraction,
  resolveFormatOptions,
  toTokens,
  widerTokens,
  type CountFormat,
  type CountFormatInput,
  type CountToken,
  type DigitToken,
  type MarkToken,
}
