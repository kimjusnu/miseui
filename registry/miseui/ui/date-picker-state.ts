import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import {
  addMonths,
  clampDay,
  dateKey,
  isSameDay,
  isSameMonth,
  nextFocusDate,
  nextRange,
  startOfDay,
  startOfMonth,
  type DateRange,
  type WeekStart,
} from "@/registry/miseui/ui/date-picker-math"

type CalendarValue = Date | DateRange | null

interface CalendarStateOptions {
  mode: "single" | "range"
  value?: CalendarValue
  defaultValue?: CalendarValue
  onValueChange?: (value: never) => void
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  min?: Date
  max?: Date
  isDateDisabled?: (date: Date) => boolean
  today?: Date
  monthsShown: number
  weekStartsOn: WeekStart
}

function anchorOf(value: CalendarValue) {
  if (!value) return null
  return value instanceof Date ? value : value.start
}

function useCalendarView(options: CalendarStateOptions, start: Date) {
  const { min, max, monthsShown, onMonthChange } = options
  const [uncontrolled, setUncontrolled] = useState(() => startOfMonth(clampDay(start, min, max)))
  const [direction, setDirection] = useState<1 | -1>(1)
  const view = options.month ? startOfMonth(options.month) : uncontrolled
  const setView = (next: Date) => {
    const first = startOfMonth(next)
    if (isSameMonth(first, view)) return
    setDirection(first > view ? 1 : -1)
    setUncontrolled(first)
    onMonthChange?.(first)
  }
  const canStep = (amount: number) => {
    const target = addMonths(view, amount)
    if (amount < 0) return !min || target >= startOfMonth(min)
    return !max || startOfMonth(addMonths(target, monthsShown - 1)) <= max
  }
  return { view, direction, lastVisible: addMonths(view, monthsShown - 1), setView, canStep }
}

type CalendarView = ReturnType<typeof useCalendarView>

/** The grid has one tab stop. It moves with the arrow keys, and the view follows it so it is never off screen. */
function useCalendarFocus(options: CalendarStateOptions, calendar: CalendarView, start: Date, rootRef: React.RefObject<HTMLElement | null>) {
  const { min, max, weekStartsOn, monthsShown } = options
  const { view, lastVisible, setView, canStep } = calendar
  const [focused, setFocused] = useState(() => clampDay(start, min, max))
  // The owner can move the month under us, so the tab stop falls back to a day that is really on screen.
  const tabDay = focused >= view && startOfMonth(focused) <= lastVisible ? focused : clampDay(view, min, max)
  const focusRequested = useRef(false)

  useEffect(() => {
    if (!focusRequested.current) return
    focusRequested.current = false
    const matches = rootRef.current?.querySelectorAll<HTMLElement>(`button[data-date="${dateKey(focused)}"]:not([data-outside])`)
    // A month still sliding out can hold the same date, and the arriving one is always rendered last.
    matches?.[matches.length - 1]?.focus()
  }, [focused, rootRef])

  const moveFocus = (target: Date) => {
    const next = clampDay(target, min, max)
    if (isSameDay(next, tabDay)) return
    focusRequested.current = true
    setFocused(next)
    if (next < view) setView(next)
    else if (startOfMonth(next) > lastVisible) setView(addMonths(next, 1 - monthsShown))
  }
  const stepMonths = (amount: number) => {
    if (!canStep(amount)) return
    setView(addMonths(view, amount))
    setFocused(clampDay(addMonths(tabDay, amount), min, max))
  }
  const onGridKeyDown = (event: React.KeyboardEvent) => {
    const target = nextFocusDate(event.key, tabDay, event.shiftKey, weekStartsOn)
    if (!target) return
    event.preventDefault()
    moveFocus(target)
  }
  return { tabDay, setFocused, stepMonths, onGridKeyDown }
}

function useCalendarState(options: CalendarStateOptions, rootRef: React.RefObject<HTMLElement | null>) {
  const { mode, value, min, max, isDateDisabled } = options
  const [today] = useState(() => startOfDay(options.today ?? new Date()))
  const [uncontrolled, setUncontrolled] = useState<CalendarValue>(options.defaultValue ?? null)
  const [preview, setPreview] = useState<Date | null>(null)
  const current = value !== undefined ? value : uncontrolled
  const anchor = anchorOf(current)
  const calendar = useCalendarView(options, anchor ?? options.defaultMonth ?? today)
  const focus = useCalendarFocus(options, calendar, anchor ?? (isSameMonth(today, calendar.view) ? today : calendar.view), rootRef)
  const range = mode === "range" ? (current as DateRange | null) : null
  const isDisabled = (day: Date) => Boolean((min && day < min) || (max && day > max) || isDateDisabled?.(day))
  const select = (day: Date) => {
    if (isDisabled(day)) return
    focus.setFocused(day)
    if (day < calendar.view || startOfMonth(day) > calendar.lastVisible) calendar.setView(day)
    const next = mode === "range" ? nextRange(range, day) : day
    setUncontrolled(next)
    setPreview(null)
    ;(options.onValueChange as ((value: CalendarValue) => void) | undefined)?.(next)
  }
  return {
    today,
    view: calendar.view,
    direction: calendar.direction,
    canStep: calendar.canStep,
    tabDay: focus.tabDay,
    stepMonths: focus.stepMonths,
    onGridKeyDown: focus.onGridKeyDown,
    range,
    selected: mode === "single" ? (current as Date | null) : null,
    preview: range && !range.end ? preview : null,
    /** Skips the state update once a range is done, so hovering a finished calendar re-renders nothing. */
    previewDay: (day: Date | null) => {
      if (range && !range.end) setPreview(day)
    },
    isDisabled,
    select,
  }
}

type CalendarState = ReturnType<typeof useCalendarState>

export { useCalendarState, type CalendarState, type CalendarStateOptions, type CalendarValue }
