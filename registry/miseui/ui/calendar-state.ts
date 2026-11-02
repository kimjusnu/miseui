import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addMonths, dateKey, monthKey, nextFocusDate, startOfDay, type WeekStart } from "@/registry/miseui/ui/date-picker-math"
import { periodKey, type CalendarVariant } from "@/registry/miseui/ui/calendar-math"

function yearKeyTarget(key: string, date: Date, target: HTMLElement) {
  const list = target.closest("[data-slot='calendar-year']")
  // Reads the live column count, because the grid changes from two to four columns with the container.
  const columns = list ? getComputedStyle(list).gridTemplateColumns.split(" ").length : 1
  const moves: Record<string, () => Date> = {
    ArrowLeft: () => addMonths(date, -1),
    ArrowRight: () => addMonths(date, 1),
    ArrowUp: () => addMonths(date, -columns),
    ArrowDown: () => addMonths(date, columns),
    Home: () => new Date(date.getFullYear(), 0, 1),
    End: () => new Date(date.getFullYear(), 11, 1),
  }
  return moves[key]?.() ?? null
}

interface CalendarViewStateOptions {
  variant: CalendarVariant
  weekStartsOn: WeekStart
  date?: Date
  defaultDate?: Date
  today: Date
  onDateChange?: (date: Date) => void
}

function useCalendarView(options: CalendarViewStateOptions, rootRef: React.RefObject<HTMLDivElement | null>) {
  const { variant, weekStartsOn, today, onDateChange } = options
  const [uncontrolled, setUncontrolled] = useState(() => startOfDay(options.defaultDate ?? today))
  const [direction, setDirection] = useState(1)
  const pendingFocus = useRef(false)
  const date = options.date ? startOfDay(options.date) : uncontrolled
  const time = date.getTime()
  const key = periodKey(date, variant, weekStartsOn)
  const focusKey = variant === "year" ? monthKey(date) : dateKey(date)

  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    // Scoped to the current period: during a slide the outgoing one is still mounted and may hold the same day.
    rootRef.current?.querySelector<HTMLElement>(`[data-view-key='${key}'] [data-focus-key='${focusKey}']`)?.focus()
  }, [time, key, focusKey, rootRef])

  const change = (next: Date, moveFocus = false) => {
    pendingFocus.current = moveFocus
    setDirection(next.getTime() < time ? -1 : 1)
    setUncontrolled(next)
    onDateChange?.(next)
  }
  const onGridKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement
    if (!target.dataset.focusKey) return
    const next = variant === "year"
      ? yearKeyTarget(event.key, date, target)
      : nextFocusDate(event.key, date, event.shiftKey, weekStartsOn)
    if (!next) return
    event.preventDefault()
    change(next, true)
  }
  return { date, direction, viewKey: key, change, onGridKeyDown }
}

export { useCalendarView }
