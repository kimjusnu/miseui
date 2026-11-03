import { useCallback, useEffect, useRef, useState } from "react"
import {
  createClock,
  displaySeconds,
  isFinished,
  nextTickDelay,
  pauseClock,
  resumeClock,
  ringFraction,
  MS_PER_SECOND,
  type TimerClock,
  type TimerMode,
} from "@/registry/miseui/ui/timer-math"

interface UseTimerOptions {
  mode?: TimerMode
  /** Counting down: the moment to reach. Counting up: the moment it started. */
  target?: Date | number
  /** A length in milliseconds. Counting down starts from it; counting up stops at it. */
  duration?: number
  /** Controls pause and resume from outside. */
  running?: boolean
  defaultRunning?: boolean
  onRunningChange?: (running: boolean) => void
  onComplete?: () => void
  /** A replaceable clock, for tests and for syncing to server time. */
  now?: () => number
}

const toMs = (target: Date | number | undefined) => (target instanceof Date ? target.getTime() : target)

function useTimerClock(options: UseTimerOptions, now: () => number) {
  const { mode = "down", target, duration, running, defaultRunning = true } = options
  const targetMs = toMs(target)
  const spec = `${mode}|${targetMs}|${duration}`
  const build = (time: number, on: boolean) => createClock({ mode, target: targetMs, duration, now: time, running: on })
  const [state, setState] = useState(() => {
    const time = now()
    return { spec, clock: build(time, running ?? defaultRunning), tickAt: time }
  })
  // Adjusted while rendering rather than in an effect, so a new target never paints one frame of the old time.
  if (state.spec !== spec) {
    const time = now()
    const next = { spec, clock: build(time, running ?? state.clock.running), tickAt: time }
    setState(next)
    return { state: next, setState, build }
  }
  if (running !== undefined && running !== state.clock.running) {
    const time = now()
    const next = { ...state, clock: running ? resumeClock(state.clock, time) : pauseClock(state.clock, time), tickAt: time }
    setState(next)
    return { state: next, setState, build }
  }
  return { state, setState, build }
}

function useTimerTicks(clock: TimerClock, tickAt: number, mode: TimerMode, now: () => number, setTick: (time: number) => void) {
  useEffect(() => {
    const delay = nextTickDelay(clock, now(), mode)
    if (delay === null) return
    const id = setTimeout(() => setTick(now()), delay)
    return () => clearTimeout(id)
  }, [clock, tickAt, mode, now, setTick])
  // A background tab may have slept through its timers; catch up the moment it is visible again.
  useEffect(() => {
    const wake = () => setTick(now())
    document.addEventListener("visibilitychange", wake)
    return () => document.removeEventListener("visibilitychange", wake)
  }, [now, setTick])
}

function useTimer(options: UseTimerOptions) {
  const { mode = "down", running, onRunningChange, onComplete, now = Date.now } = options
  const { state, setState, build } = useTimerClock(options, now)
  const { clock, tickAt } = state
  const setTick = useCallback((time: number) => setState((previous) => ({ ...previous, tickAt: time })), [setState])
  useTimerTicks(clock, tickAt, mode, now, setTick)

  const finished = isFinished(clock, tickAt)
  const completed = useRef(onComplete)
  useEffect(() => {
    completed.current = onComplete
  }, [onComplete])
  useEffect(() => {
    if (finished) completed.current?.()
  }, [finished])

  const setRunning = (next: boolean) => {
    const time = now()
    onRunningChange?.(next)
    if (running !== undefined) return
    setState((previous) => ({ ...previous, clock: next ? resumeClock(previous.clock, time) : pauseClock(previous.clock, time), tickAt: time }))
  }
  const reset = () => {
    const time = now()
    setState((previous) => ({ ...previous, clock: build(time, running ?? true), tickAt: time }))
  }
  const seconds = displaySeconds(clock, tickAt, mode)
  return {
    seconds,
    /** The largest value this timer shows: fixes the layout so the digits do not change shape on the way. */
    span: clock.total === null ? seconds : Math.max(seconds, Math.ceil(clock.total / MS_PER_SECOND)),
    fraction: ringFraction(clock, tickAt, mode),
    running: clock.running && !finished,
    finished,
    setRunning,
    reset,
  }
}

export { useTimer, type UseTimerOptions }
