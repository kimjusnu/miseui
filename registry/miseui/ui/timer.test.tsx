import { act, fireEvent, render, screen } from "@testing-library/react"
import { Timer, type TimerVariant } from "./timer"
import {
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
} from "./timer-math"

const START = new Date("2026-11-03T09:00:00Z").getTime()

describe("timer maths", () => {
  it("reads elapsed time from the clock, with pause and resume banking what has gone", () => {
    const clock = createClock({ mode: "down", duration: 60000, now: START, running: true })
    expect(elapsedAt(clock, START + 5000)).toBe(5000)
    const paused = pauseClock(clock, START + 5000)
    expect(elapsedAt(paused, START + 999999)).toBe(5000)
    const resumed = resumeClock(paused, START + 20000)
    expect(elapsedAt(resumed, START + 21000)).toBe(6000)
  })

  it("does not give time back when the system clock moves backwards, and never runs past the end", () => {
    const clock = createClock({ mode: "down", duration: 10000, now: START, running: true })
    expect(elapsedAt(clock, START - 5000)).toBe(0)
    expect(elapsedAt(clock, START + 99000)).toBe(10000)
    expect(isFinished(clock, START + 10000)).toBe(true)
  })

  it("builds a countdown from a target and a count up from its start", () => {
    expect(createClock({ mode: "down", target: START + 90000, now: START, running: true }).total).toBe(90000)
    expect(createClock({ mode: "down", target: START - 1000, now: START, running: true }).total).toBe(0)
    expect(createClock({ mode: "up", target: START - 90000, now: START, running: true }).banked).toBe(90000)
    expect(createClock({ mode: "up", now: START, running: true }).total).toBeNull()
  })

  it("shows the whole first second of a countdown and reaches zero exactly at the end", () => {
    const clock = createClock({ mode: "down", duration: 10000, now: START, running: true })
    expect(displaySeconds(clock, START, "down")).toBe(10)
    expect(displaySeconds(clock, START + 999, "down")).toBe(10)
    expect(displaySeconds(clock, START + 1000, "down")).toBe(9)
    expect(displaySeconds(clock, START + 9999, "down")).toBe(1)
    expect(displaySeconds(clock, START + 10000, "down")).toBe(0)
    const up = createClock({ mode: "up", now: START, running: true })
    expect(displaySeconds(up, START + 1999, "up")).toBe(1)
  })

  it("waits only until the shown digit next changes", () => {
    const clock = createClock({ mode: "down", duration: 10000, now: START, running: true })
    expect(nextTickDelay(clock, START, "down")).toBe(1000)
    expect(nextTickDelay(clock, START + 1400, "down")).toBe(600)
    expect(nextTickDelay(clock, START + 10000, "down")).toBeNull()
    expect(nextTickDelay(pauseClock(clock, START), START, "down")).toBeNull()
    const up = createClock({ mode: "up", duration: 1500, now: START, running: true })
    expect(nextTickDelay(up, START + 1200, "up")).toBe(300)
  })

  it("formats time with a shape fixed by the largest value", () => {
    expect(formatClock(0)).toBe("00:00")
    expect(formatClock(65)).toBe("01:05")
    expect(formatClock(3599, 3600)).toBe("0:59:59")
    expect(formatClock(3661)).toBe("1:01:01")
    expect(formatClock(90061)).toBe("1d 01:01:01")
    expect(timeParts(90061)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
    expect(timeParts(-5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    expect(visibleUnits(30)).toEqual(["minutes", "seconds"])
    expect(visibleUnits(3600)).toEqual(["hours", "minutes", "seconds"])
    expect(visibleUnits(86400)).toHaveLength(4)
  })

  it("speaks a text that stays the same for a whole minute", () => {
    expect(spokenTime(299, "down")).toBe("5 minutes left")
    expect(spokenTime(241, "down")).toBe("5 minutes left")
    expect(spokenTime(240, "down")).toBe("4 minutes left")
    expect(spokenTime(59, "down")).toBe("Less than a minute left")
    expect(spokenTime(0, "down")).toBe("Time is up")
    expect(spokenTime(61, "up")).toBe("1 minute elapsed")
    expect(spokenTime(3720, "up")).toBe("1 hour 2 minutes elapsed")
  })

  it("fills the ring from the elapsed share", () => {
    const clock = createClock({ mode: "down", duration: 10000, now: START, running: true })
    expect(ringFraction(clock, START + 2500, "down")).toBe(0.75)
    const up = createClock({ mode: "up", duration: 10000, now: START, running: true })
    expect(ringFraction(up, START + 2500, "up")).toBe(0.25)
    const endless = createClock({ mode: "up", now: START, running: true })
    expect(ringFraction(endless, START + 30000, "up")).toBe(0.5)
  })
})

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(START)
  })
  afterEach(() => vi.useRealTimers())

  /** One act per second: the next wait is only scheduled after React has committed the last tick, as in a browser. */
  const tick = (ms: number) => {
    for (let gone = 0; gone < ms; gone += 1000) act(() => vi.advanceTimersByTime(1000))
  }
  const shown = () => screen.getByRole("timer").textContent

  it("counts down from a duration and calls onComplete once at the end", () => {
    const onComplete = vi.fn()
    render(<Timer duration={3000} onComplete={onComplete} />)
    expect(shown()).toBe("00:03")
    tick(1000)
    expect(shown()).toBe("00:02")
    tick(2000)
    expect(shown()).toBe("00:00")
    expect(onComplete).toHaveBeenCalledOnce()
    tick(5000)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("counts up from a target in the past", () => {
    render(<Timer mode="up" target={new Date(START - 65000)} />)
    expect(shown()).toBe("01:05")
    tick(2000)
    expect(shown()).toBe("01:07")
  })

  it("is correct after a sleeping tab with no ticks at all, because it reads the clock", () => {
    render(<Timer duration={600000} />)
    vi.setSystemTime(START + 300000)
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(shown()).toBe("05:00")
  })

  it("pauses and resumes without losing or gaining time", () => {
    render(<Timer duration={10000} controls />)
    tick(3000)
    fireEvent.click(screen.getByRole("button", { name: "Pause" }))
    expect(shown()).toBe("00:07")
    tick(60000)
    expect(shown()).toBe("00:07")
    fireEvent.click(screen.getByRole("button", { name: "Resume" }))
    tick(2000)
    expect(shown()).toBe("00:05")
  })

  it("can be controlled from outside and reset", () => {
    const onRunningChange = vi.fn()
    const { rerender } = render(<Timer duration={10000} running controls onRunningChange={onRunningChange} />)
    tick(1000)
    fireEvent.click(screen.getByRole("button", { name: "Pause" }))
    expect(onRunningChange).toHaveBeenCalledWith(false)
    tick(1000)
    expect(shown()).toBe("00:08")
    rerender(<Timer duration={10000} running={false} controls onRunningChange={onRunningChange} />)
    tick(5000)
    expect(shown()).toBe("00:08")
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(shown()).toBe("00:10")
  })

  it("restarts when the target changes", () => {
    const { rerender } = render(<Timer duration={10000} />)
    tick(4000)
    rerender(<Timer duration={30000} />)
    expect(shown()).toBe("00:30")
  })

  it("speaks only when the minute changes", () => {
    const { container } = render(<Timer duration={125000} />)
    const announcer = container.querySelector("[aria-live='polite']") as HTMLElement
    expect(announcer).toHaveTextContent("3 minutes left")
    expect(screen.getByRole("timer")).not.toHaveAttribute("aria-live")
    const before = announcer.firstChild
    tick(4000)
    expect(shown()).toBe("02:01")
    expect(announcer).toHaveTextContent("3 minutes left")
    expect(announcer.firstChild).toBe(before)
    tick(1000)
    expect(announcer).toHaveTextContent("2 minutes left")
  })

  it("makes the variants differ in structure and keeps tabular figures", () => {
    const shape = (variant: TimerVariant) => {
      const { container, unmount } = render(<Timer duration={3700000} variant={variant} />)
      const result = {
        boxes: container.querySelectorAll("[data-slot='timer-box']").length,
        ring: container.querySelector("[data-slot='timer-ring']") !== null,
        chip: (container.firstElementChild as HTMLElement).className.includes("inline-flex"),
        tabular: container.innerHTML.includes("tabular-nums"),
      }
      unmount()
      return result
    }
    expect(shape("plain")).toEqual({ boxes: 0, ring: false, chip: false, tabular: true })
    expect(shape("boxes")).toEqual({ boxes: 3, ring: false, chip: false, tabular: true })
    expect(shape("compact")).toEqual({ boxes: 0, ring: false, chip: true, tabular: true })
    expect(shape("ring")).toEqual({ boxes: 0, ring: true, chip: false, tabular: true })
  })

  it("rolls digits with the effect and keeps the plain text for assistive tech", () => {
    const { container } = render(<Timer duration={5000} effect="roll" />)
    expect(container.querySelectorAll("[data-slot='timer-digit']").length).toBe(4)
    expect(screen.getByText("00:05")).toHaveClass("sr-only")
    expect(container.querySelector("[data-slot='timer-roll']")).toHaveAttribute("aria-hidden", "true")
  })

  it("disables resume once finished", () => {
    render(<Timer duration={1000} controls />)
    tick(1000)
    expect(screen.getByRole("button", { name: "Resume" })).toBeDisabled()
  })
})
