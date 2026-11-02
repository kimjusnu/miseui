/** Every date here is local midnight. `toISOString` is avoided throughout because it shifts the day in any zone east of UTC. */
export interface DateRange {
  start: Date
  /** Null while the second click is still to come. */
  end: Date | null
}

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type RangeRole = "single" | "start" | "end" | "middle"

const WEEK_ROWS = 6
const DAYS_IN_WEEK = 7
const SUNDAY_FIRST_REGIONS = new Set(["US", "CA", "MX", "JP", "KR", "TW", "IL", "BR", "ZA", "PH", "IN", "AU", "HK", "SG", "TH"])

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Built from parts and not by adding 24 hours, which breaks on the two days a year with daylight saving changes. */
function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

/** Jan 31 plus a month is Feb 28, not Mar 3. */
function addMonths(date: Date, amount: number) {
  const first = new Date(date.getFullYear(), date.getMonth() + amount, 1)
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), lastDay))
}

function isSameDay(a: Date | null | undefined, b: Date | null | undefined) {
  return Boolean(a && b) && a?.getTime() === b?.getTime()
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function dateKey(date: Date) {
  return `${monthKey(date)}-${pad(date.getDate())}`
}

function clampDay(date: Date, min?: Date, max?: Date) {
  if (min && date < min) return min
  if (max && date > max) return max
  return date
}

/** Always six weeks, so the calendar keeps one height and the page does not jump between months. */
function buildMonthGrid(month: Date, weekStartsOn: WeekStart) {
  const first = startOfMonth(month)
  const lead = (first.getDay() - weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK
  const start = addDays(first, -lead)
  return Array.from({ length: WEEK_ROWS }, (_, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, day) => addDays(start, week * DAYS_IN_WEEK + day)),
  )
}

/** weekInfo where the browser has it, a short list of regions where it does not (Firefox). */
function firstDayOfWeek(locale?: string): WeekStart {
  try {
    const tag = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale
    const info = new Intl.Locale(tag) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay
    if (firstDay) return (firstDay % DAYS_IN_WEEK) as WeekStart
    return SUNDAY_FIRST_REGIONS.has(info.maximize().region ?? "") ? 0 : 1
  } catch {
    return 0
  }
}

function weekdayLabels(locale: string | undefined, weekStartsOn: WeekStart) {
  const short = new Intl.DateTimeFormat(locale, { weekday: "short" })
  const long = new Intl.DateTimeFormat(locale, { weekday: "long" })
  // 2023-01-01 was a Sunday, which makes the offset from weekStartsOn direct.
  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
    const day = new Date(2023, 0, 1 + weekStartsOn + index)
    return { short: short.format(day), long: long.format(day) }
  })
}

/** Where each grid key takes the focus. Null when the key is not a grid key. */
function nextFocusDate(key: string, day: Date, shiftKey: boolean, weekStartsOn: WeekStart) {
  const intoWeek = (day.getDay() - weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK
  const moves: Record<string, () => Date> = {
    ArrowLeft: () => addDays(day, -1),
    ArrowRight: () => addDays(day, 1),
    ArrowUp: () => addDays(day, -DAYS_IN_WEEK),
    ArrowDown: () => addDays(day, DAYS_IN_WEEK),
    Home: () => addDays(day, -intoWeek),
    End: () => addDays(day, DAYS_IN_WEEK - 1 - intoWeek),
    PageUp: () => addMonths(day, shiftKey ? -12 : -1),
    PageDown: () => addMonths(day, shiftKey ? 12 : 1),
  }
  return moves[key]?.() ?? null
}

/** First click starts, second click finishes in whichever order, third click starts over. */
function nextRange(current: DateRange | null, day: Date): DateRange {
  if (!current || current.end) return { start: day, end: null }
  return day < current.start ? { start: day, end: current.start } : { start: current.start, end: day }
}

/** `preview` stands in for the missing end while someone is still choosing it. */
function rangeRole(day: Date, range: DateRange | null, preview: Date | null): RangeRole | null {
  if (!range) return null
  const other = range.end ?? preview ?? range.start
  const [low, high] = other < range.start ? [other, range.start] : [range.start, other]
  if (day < low || day > high) return null
  if (isSameDay(low, high)) return "single"
  if (isSameDay(day, low)) return "start"
  return isSameDay(day, high) ? "end" : "middle"
}

function numericFormat(locale?: string) {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" })
}

/** The placeholder, in the order this locale writes dates: MM/DD/YYYY, DD/MM/YYYY, YYYY. MM. DD. */
function datePattern(locale?: string) {
  const names: Record<string, string> = { year: "YYYY", month: "MM", day: "DD" }
  return numericFormat(locale)
    .formatToParts(new Date(2000, 0, 31))
    .map((part) => names[part.type] ?? part.value)
    .join("")
}

/** Accepts any separators and 2-digit years. A leading 4-digit number always means year first, as in ISO. */
function parseDateText(text: string, locale?: string) {
  const numbers = text.match(/\d+/g)
  if (numbers?.length !== 3) return null
  const localeOrder = numericFormat(locale)
    .formatToParts(new Date(2000, 0, 31))
    .map((part) => part.type)
    .filter((type) => type === "year" || type === "month" || type === "day")
  const order = numbers[0].length === 4 ? ["year", "month", "day"] : localeOrder
  const parts = Object.fromEntries(order.map((type, index) => [type, Number(numbers[index])]))
  const year = parts.year < 100 ? parts.year + 2000 : parts.year
  const date = new Date(year, parts.month - 1, parts.day)
  // new Date quietly turns Feb 30 into Mar 2, so a date that changed on the way through was never real.
  return date.getMonth() === parts.month - 1 && date.getDate() === parts.day ? date : null
}

export {
  addDays,
  addMonths,
  buildMonthGrid,
  clampDay,
  dateKey,
  datePattern,
  firstDayOfWeek,
  isSameDay,
  isSameMonth,
  monthKey,
  nextFocusDate,
  nextRange,
  numericFormat,
  parseDateText,
  rangeRole,
  startOfDay,
  startOfMonth,
  weekdayLabels,
}
