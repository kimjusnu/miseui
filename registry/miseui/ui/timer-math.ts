type TimerMode = "down" | "up"

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86400

/**
 * A timer is a pair of clock readings, never a running sum. Timers in a background tab fire late or not at all;
 * adding up ticks would lose that time, while subtracting two readings cannot.
 */
interface TimerClock {
  running: boolean
  /** Wall clock reading when it last started running. */
  anchor: number
  /** Milliseconds already gone before that reading. */
  banked: number
  /** Where it ends, in milliseconds of elapsed time. Null counts up for ever. */
  total: number | null
}

interface ClockSpec {
  mode: TimerMode
  /** Counting down: the moment to reach. Counting up: the moment it started. */
  target?: number
  /** A length in milliseconds. Counting down starts from it; counting up stops at it. */
  duration?: number
  now: number
  running: boolean
}

function createClock({ mode, target, duration, now, running }: ClockSpec): TimerClock {
  if (mode === "down") {
    const total = target !== undefined ? target - now : (duration ?? 0)
    return { running, anchor: now, banked: 0, total: Math.max(0, total) }
  }
  const banked = target !== undefined ? Math.max(0, now - target) : 0
  return { running, anchor: now, banked, total: duration ?? null }
}

function elapsedAt(clock: TimerClock, now: number) {
  // The system clock can be moved backwards; that must not give time back.
  const running = clock.running ? Math.max(0, now - clock.anchor) : 0
  const elapsed = clock.banked + running
  return clock.total === null ? elapsed : Math.min(clock.total, elapsed)
}

function pauseClock(clock: TimerClock, now: number): TimerClock {
  if (!clock.running) return clock
  return { ...clock, running: false, banked: elapsedAt(clock, now), anchor: now }
}

function resumeClock(clock: TimerClock, now: number): TimerClock {
  if (clock.running) return clock
  return { ...clock, running: true, anchor: now }
}

function isFinished(clock: TimerClock, now: number) {
  return clock.total !== null && elapsedAt(clock, now) >= clock.total
}

/** Rounded so a ten second countdown shows 10 for its whole first second and reaches 0 exactly when time is up. */
function displaySeconds(clock: TimerClock, now: number, mode: TimerMode) {
  const elapsed = elapsedAt(clock, now)
  if (mode === "up") return Math.floor(elapsed / MS_PER_SECOND)
  return Math.ceil(((clock.total ?? 0) - elapsed) / MS_PER_SECOND)
}

/** Waits for the moment the shown digit changes, not a fixed second, so the wait cannot slip against the clock. */
function nextTickDelay(clock: TimerClock, now: number, mode: TimerMode) {
  if (!clock.running || isFinished(clock, now)) return null
  const elapsed = elapsedAt(clock, now)
  if (mode === "down") {
    const left = (clock.total ?? 0) - elapsed
    return left % MS_PER_SECOND || MS_PER_SECOND
  }
  const toDigit = MS_PER_SECOND - (elapsed % MS_PER_SECOND)
  return clock.total === null ? toDigit : Math.min(toDigit, clock.total - elapsed)
}

function timeParts(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  return {
    days: Math.floor(seconds / SECONDS_PER_DAY),
    hours: Math.floor((seconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
    minutes: Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: seconds % SECONDS_PER_MINUTE,
  }
}

const pad = (value: number) => String(value).padStart(2, "0")

/**
 * `span` is the largest value this timer will show, so the shape is fixed from the start:
 * one hour counting down stays 0:59:59 instead of jumping narrower to 59:59.
 */
function formatClock(totalSeconds: number, span = totalSeconds) {
  const { days, hours, minutes, seconds } = timeParts(totalSeconds)
  if (span >= SECONDS_PER_DAY) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  if (span >= SECONDS_PER_HOUR) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
}

type TimerUnit = "days" | "hours" | "minutes" | "seconds"

function visibleUnits(span: number): readonly TimerUnit[] {
  if (span >= SECONDS_PER_DAY) return ["days", "hours", "minutes", "seconds"]
  if (span >= SECONDS_PER_HOUR) return ["hours", "minutes", "seconds"]
  return ["minutes", "seconds"]
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`

/** Has one value for a whole minute by construction, so a live region reading it speaks once a minute and no more. */
function spokenTime(totalSeconds: number, mode: TimerMode) {
  const suffix = mode === "down" ? "left" : "elapsed"
  if (totalSeconds < SECONDS_PER_MINUTE) {
    if (mode === "down" && totalSeconds <= 0) return "Time is up"
    return `Less than a minute ${suffix}`
  }
  const round = mode === "down" ? Math.ceil : Math.floor
  const minutes = round(totalSeconds / SECONDS_PER_MINUTE)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const parts = [hours > 0 ? plural(hours, "hour") : "", rest > 0 ? plural(rest, "minute") : ""].filter(Boolean)
  return `${parts.join(" ")} ${suffix}`
}

/** How full the ring is. A count up with no end has nothing to fill towards, so it sweeps once a minute like a second hand. */
function ringFraction(clock: TimerClock, now: number, mode: TimerMode) {
  const elapsed = elapsedAt(clock, now)
  if (clock.total === null) return (elapsed % (SECONDS_PER_MINUTE * MS_PER_SECOND)) / (SECONDS_PER_MINUTE * MS_PER_SECOND)
  if (clock.total === 0) return mode === "down" ? 0 : 1
  return mode === "down" ? (clock.total - elapsed) / clock.total : elapsed / clock.total
}

export {
  createClock,
  displaySeconds,
  elapsedAt,
  formatClock,
  isFinished,
  nextTickDelay,
  pauseClock,
  resumeClock,
  ringFraction,
  spokenTime,
  timeParts,
  visibleUnits,
  MS_PER_SECOND,
  type TimerClock,
  type TimerMode,
  type TimerUnit,
}
