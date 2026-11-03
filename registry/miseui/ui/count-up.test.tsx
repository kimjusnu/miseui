import { render, screen, waitFor } from "@testing-library/react"
import { CountUp } from "./count-up"
import { createCountFormat, decimalsOf, digitGlyphs, isDigit, meterFraction, resolveFormatOptions, widerTokens } from "./count-up-math"
import { digitPosition, reelProgress, reelTransform, rollDistance, targetDigit } from "./count-up-roll"

const state = vi.hoisted(() => ({ reduced: false, inView: true }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

beforeEach(() => {
  state.reduced = false
  state.inView = true
})

const FAST = 0.05
const shown = () => document.querySelector("[data-slot='count-up-value']")?.textContent
const strips = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='count-up-strip']"))
const stripAt = (place: number) => strips().find((strip) => strip.dataset.place === `${place}`) as HTMLElement

describe("CountUp", () => {
  it("reads the final value once and keeps the moving digits away from assistive tech", () => {
    render(<CountUp value={1248} locale="en-US" prefix="$" trigger="mount" />)
    expect(screen.getByText("$1,248", { selector: ".sr-only" })).toBeInTheDocument()
    expect(document.querySelector("[data-slot='count-up-visual']")).toHaveAttribute("aria-hidden", "true")
    expect(document.querySelector("[aria-live]")).toBeNull()
  })

  it("reserves the final text before the count has started, and starts from `from`", () => {
    state.inView = false
    render(<CountUp value={1248} from={7} locale="en-US" />)
    expect(document.querySelector("[data-slot='count-up-reserve']")).toHaveTextContent("1,248")
    expect(shown()).toBe("7")
  })

  it("counts to the value when seen, not before", async () => {
    state.inView = false
    const { rerender } = render(<CountUp value={80} duration={FAST} locale="en-US" />)
    expect(shown()).toBe("0")
    state.inView = true
    rerender(<CountUp value={80} duration={FAST} locale="en-US" />)
    await waitFor(() => expect(shown()).toBe("80"))
  })

  it("shows a changed value at once without the retarget effect", async () => {
    const { rerender } = render(<CountUp value={10} duration={FAST} locale="en-US" />)
    await waitFor(() => expect(shown()).toBe("10"))
    rerender(<CountUp value={500} duration={30} locale="en-US" />)
    await waitFor(() => expect(shown()).toBe("500"))
  })

  it("moves from what is showing with retarget, with no jump to either end", async () => {
    const { rerender } = render(<CountUp value={100} effect="retarget" duration={FAST} locale="en-US" />)
    await waitFor(() => expect(shown()).toBe("100"))
    rerender(<CountUp value={200} effect="retarget" duration={30} locale="en-US" />)
    expect(shown()).toBe("100")
    await waitFor(() => expect(Number(shown())).toBeGreaterThan(100))
    expect(Number(shown())).toBeLessThan(200)
    // Interrupted halfway: the next run starts from there and not from 200 or 100.
    const halfway = Number(shown())
    rerender(<CountUp value={50} effect="retarget" duration={30} locale="en-US" />)
    expect(Number(shown())).toBeGreaterThanOrEqual(halfway)
    expect(Number(shown())).toBeLessThan(200)
  })

  it("renders the finished number with nothing moving under reduced motion", () => {
    state.reduced = true
    state.inView = false
    render(<CountUp value={42} duration={30} locale="en-US" />)
    expect(shown()).toBe("42")
  })

  it("rests on the first deterministic text for a server render", () => {
    state.inView = false
    render(<CountUp value={1500} locale="ko-KR" formatOptions={{ notation: "compact" }} />)
    expect(shown()).toBe("0")
    expect(document.querySelector("[data-slot='count-up-reserve']")).toHaveTextContent("1.5천")
  })

  it("shows a dash for a value that is not a number, in every variant", () => {
    const { rerender } = render(<CountUp value={Number.NaN} />)
    expect(document.querySelector("[data-slot='count-up-visual']")).toHaveTextContent("–")
    expect(screen.getByText("Not available")).toHaveClass("sr-only")
    rerender(<CountUp value={Number.POSITIVE_INFINITY} variant="odometer" unavailableLabel="No data" />)
    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(strips()).toHaveLength(0)
  })

  it("builds a different structure for each variant", () => {
    const counts = (variant: "plain" | "odometer" | "board" | "meter") => {
      const { unmount } = render(<CountUp value={1248} variant={variant} locale="en-US" />)
      const result = {
        variant: document.querySelector("[data-slot='count-up']")?.getAttribute("data-variant"),
        reels: strips().length,
        tiles: document.querySelectorAll("[data-slot='count-up-reel'].bg-muted").length,
        track: document.querySelectorAll("[data-slot='count-up-track']").length,
      }
      unmount()
      return result
    }
    expect(counts("plain")).toEqual({ variant: "plain", reels: 0, tiles: 0, track: 0 })
    expect(counts("odometer")).toEqual({ variant: "odometer", reels: 4, tiles: 0, track: 0 })
    expect(counts("board")).toEqual({ variant: "board", reels: 4, tiles: 4, track: 0 })
    expect(counts("meter")).toEqual({ variant: "meter", reels: 0, tiles: 0, track: 1 })
  })

  it("keeps group marks and compact units outside the reels", () => {
    render(<CountUp value={1500} variant="odometer" locale="ko-KR" formatOptions={{ notation: "compact" }} />)
    const marks = Array.from(document.querySelectorAll("[data-slot='count-up-mark']")).map((mark) => mark.textContent)
    expect(marks).toEqual([".", "천"])
    expect(strips().map((strip) => strip.dataset.place)).toEqual(["0", "-1"])
  })

  it("rolls each reel to its digit and writes a valid transform", async () => {
    render(<CountUp value={1248} variant="odometer" duration={FAST} locale="en-US" />)
    await waitFor(() => expect(stripAt(0).style.transform).toBe(reelTransform(8)))
    expect(stripAt(3).style.transform).toBe(reelTransform(1))
    expect(stripAt(2).style.transform).toBe(reelTransform(2))
    expect(stripAt(1).style.transform).toMatch(/^translateY\(-?\d+\.\d+%\)$/)
  })

  it("keeps the leading reel while shrinking, then drops it", async () => {
    const { rerender } = render(<CountUp value={100} variant="odometer" effect="retarget" duration={FAST} locale="en-US" />)
    await waitFor(() => expect(stripAt(2).style.transform).toBe(reelTransform(1)))
    rerender(<CountUp value={99} variant="odometer" effect="retarget" duration={FAST} locale="en-US" />)
    expect(strips()).toHaveLength(3)
    await waitFor(() => expect(strips()).toHaveLength(2))
    expect(stripAt(0).style.transform).toBe(reelTransform(9))
  })

  it("adds a reel at once when the number grows a digit", async () => {
    const { rerender } = render(<CountUp value={99} variant="odometer" effect="retarget" duration={FAST} locale="en-US" />)
    await waitFor(() => expect(stripAt(0).style.transform).toBe(reelTransform(9)))
    rerender(<CountUp value={100} variant="odometer" effect="retarget" duration={FAST} locale="en-US" />)
    expect(strips()).toHaveLength(3)
    await waitFor(() => expect(stripAt(2).style.transform).toBe(reelTransform(1)))
  })

  it("fills the meter line against max", async () => {
    render(<CountUp value={25} max={100} variant="meter" duration={FAST} locale="en-US" />)
    const fill = document.querySelector("[data-slot='count-up-fill']") as HTMLElement
    await waitFor(() => expect(fill.style.transform).toBe("scaleX(0.25)"))
  })

  it("passes attributes through to the root", () => {
    render(<CountUp value={1} data-testid="figure" className="text-3xl" effect="retarget" />)
    const root = screen.getByTestId("figure")
    expect(root).toHaveClass("text-3xl", "tabular-nums")
    expect(root).toHaveAttribute("data-effect", "retarget")
  })
})

describe("count-up-math", () => {
  it("counts decimals as written, including exponent form", () => {
    expect(decimalsOf(12)).toBe(0)
    expect(decimalsOf(12.5)).toBe(1)
    expect(decimalsOf(-0.125)).toBe(3)
    expect(decimalsOf(1.5e-7)).toBe(8)
    expect(decimalsOf(1e21)).toBe(0)
    expect(decimalsOf(Number.NaN)).toBe(0)
  })

  it("fixes decimals to the final value, and leaves Intl its own rules where it has them", () => {
    expect(resolveFormatOptions(12.5)).toMatchObject({ minimumFractionDigits: 1, maximumFractionDigits: 1 })
    expect(resolveFormatOptions(0.725, { style: "percent" })).toMatchObject({ minimumFractionDigits: 1 })
    expect(resolveFormatOptions(1500, { notation: "compact" }).minimumFractionDigits).toBeUndefined()
    expect(resolveFormatOptions(10, { style: "currency", currency: "USD" }).minimumFractionDigits).toBeUndefined()
    expect(resolveFormatOptions(10, { maximumFractionDigits: 3 }).minimumFractionDigits).toBeUndefined()
  })

  it("holds the decimals steady all the way up", () => {
    const format = createCountFormat(12.5, { locale: "en-US" })
    expect(format.text(0)).toBe("0.0")
    expect(format.text(3)).toBe("3.0")
    expect(format.text(12.5)).toBe("12.5")
  })

  it("never prints a negative zero", () => {
    const format = createCountFormat(5, { locale: "en-US" })
    expect(format.text(-0.2)).toBe("0")
    expect(format.text(-1)).toBe("-1")
  })

  it("places digits from the decimal point and keeps marks in the locale's positions", () => {
    const tokens = createCountFormat(-1234.5, { locale: "en-US" }).tokens(-1234.5)
    expect(tokens.filter(isDigit).map((token) => [token.place, token.digit])).toEqual([
      [3, 1],
      [2, 2],
      [1, 3],
      [0, 4],
      [-1, 5],
    ])
    expect(tokens.filter((token) => token.kind === "mark").map((token) => (token.kind === "mark" ? token.text : ""))).toEqual(["-", ",", "."])
  })

  it("keeps lakh grouping and places prefix and suffix at the ends", () => {
    const format = createCountFormat(1234567, { locale: "en-IN", prefix: "~", suffix: " km" })
    expect(format.text(1234567)).toBe("~12,34,567 km")
    const tokens = format.tokens(1234567)
    expect(tokens[0]).toMatchObject({ kind: "mark", text: "~" })
    expect(tokens[tokens.length - 1]).toMatchObject({ kind: "mark", text: " km" })
    expect(new Set(tokens.map((token) => token.key)).size).toBe(tokens.length)
  })

  it("reads digit values through the locale's own numbering system", () => {
    expect(digitGlyphs("ar-EG")[1]).toBe("١")
    const tokens = createCountFormat(27, { locale: "ar-EG" }).tokens(27)
    expect(tokens.filter(isDigit).map((token) => token.digit)).toEqual([2, 7])
  })

  it("works out what one spelled unit is worth", () => {
    expect(createCountFormat(1500, { locale: "en-US", formatOptions: { notation: "compact" } }).scale).toBeCloseTo(1000)
    expect(createCountFormat(0.72, { locale: "en-US", formatOptions: { style: "percent" } }).scale).toBeCloseTo(0.01)
    expect(createCountFormat(0, { locale: "en-US" }).scale).toBe(1)
  })

  it("picks the wider shape while a number shrinks", () => {
    const format = createCountFormat(99, { locale: "en-US" })
    const big = format.tokens(100)
    const small = format.tokens(99)
    expect(widerTokens(big, small)).toBe(big)
    expect(widerTokens(small, big)).toBe(big)
    expect(widerTokens(small, small)).toBe(small)
    expect(targetDigit(small, 2)).toBe(0)
  })

  it("rolls forward to the digit, and caps fast columns at one extra turn", () => {
    const roll = { from: 0, to: 1248, scale: 1 }
    expect(rollDistance({ ...roll, start: 0, target: 1, place: 3 })).toBe(1)
    expect(rollDistance({ ...roll, start: 0, target: 2, place: 2 })).toBe(12)
    expect(rollDistance({ ...roll, start: 0, target: 8, place: 0 })).toBe(18)
    expect(rollDistance({ start: 9, target: 0, from: 99, to: 100, place: 0, scale: 1 })).toBe(1)
  })

  it("rolls backward when the number falls and picks up from a position between digits", () => {
    expect(rollDistance({ start: 0, target: 9, from: 100, to: 99, place: 0, scale: 1 })).toBe(-1)
    expect(rollDistance({ start: 3.5, target: 5, from: 30, to: 50, place: 0, scale: 1 })).toBeCloseTo(11.5)
    expect(rollDistance({ start: 3.5, target: 3.5, from: 30, to: 30, place: 0, scale: 1 })).toBe(0)
  })

  it("positions, progress and transform agree at the ends", () => {
    expect(digitPosition(1248, 1, 1)).toBe(4)
    expect(digitPosition(-1248, 0, 1)).toBe(8)
    expect(digitPosition(1500, 0, 1000)).toBe(1)
    expect(reelProgress(0, 100, 50)).toBe(0.5)
    expect(reelProgress(100, 0, 25)).toBe(0.75)
    expect(reelProgress(5, 5, 5)).toBe(1)
    expect(reelProgress(0, 10, 12)).toBe(1)
    expect(reelTransform(0)).toBe("translateY(0.0000%)")
    expect(reelTransform(10)).toBe(reelTransform(0))
    expect(reelTransform(-1)).toBe(reelTransform(9))
  })

  it("measures the meter against its top and clamps", () => {
    expect(meterFraction(50, 0, 100)).toBe(0.5)
    expect(meterFraction(120, 0, 100)).toBe(1)
    expect(meterFraction(-5, 0, 100)).toBe(0)
    expect(meterFraction(7, 7, 7)).toBe(1)
  })
})
