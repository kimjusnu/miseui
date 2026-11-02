import {
  addDays,
  addMonths,
  dateKey,
  monthKey,
  startOfDay,
  startOfMonth,
  type WeekStart,
} from "@/registry/miseui/ui/date-picker-math"

type CalendarVariant = "month" | "week" | "agenda" | "year"

interface CalendarEvent {
  id: string
  title: string
  /** The day it happens, or its first day when `end` is set. */
  date: Date
  /** Last day of a multi-day event, inclusive. */
  end?: Date
  /** A second line in lists, such as a place or an owner. */
  detail?: string
}

type EventIndex = ReadonlyMap<string, readonly CalendarEvent[]>

const DAY_MS = 86_400_000
const DAYS_IN_WEEK = 7
const MONTHS_IN_YEAR = 12
/** A mistyped end year would otherwise expand one event into thousands of day entries. */
const MAX_EVENT_SPAN_DAYS = 92

function eventDays(event: CalendarEvent) {
  const start = startOfDay(event.date)
  const end = event.end ? startOfDay(event.end) : start
  // Rounded because a span across a daylight saving change is not a whole number of 24 hour days.
  const span = Math.round((end.getTime() - start.getTime()) / DAY_MS)
  const length = Math.min(Math.max(span, 0), MAX_EVENT_SPAN_DAYS) + 1
  return Array.from({ length }, (_, offset) => addDays(start, offset))
}

/** Keyed by day so every cell on screen can ask for its events without scanning the whole list. */
function indexEvents(events: readonly CalendarEvent[]): EventIndex {
  const index = new Map<string, readonly CalendarEvent[]>()
  events.forEach((event) => {
    eventDays(event).forEach((day) => {
      const key = dateKey(day)
      index.set(key, [...(index.get(key) ?? []), event])
    })
  })
  return index
}

function weekOf(date: Date, weekStartsOn: WeekStart) {
  const lead = (date.getDay() - weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK
  const start = addDays(date, -lead)
  return Array.from({ length: DAYS_IN_WEEK }, (_, offset) => addDays(start, offset))
}

function stepPeriod(date: Date, variant: CalendarVariant, amount: number) {
  if (variant === "week") return addDays(date, DAYS_IN_WEEK * amount)
  return addMonths(date, variant === "year" ? MONTHS_IN_YEAR * amount : amount)
}

/** What one screen of this variant shows. A change of key is what triggers the slide. */
function periodKey(date: Date, variant: CalendarVariant, weekStartsOn: WeekStart) {
  if (variant === "week") return dateKey(weekOf(date, weekStartsOn)[0])
  return variant === "year" ? String(date.getFullYear()) : monthKey(date)
}

function periodLabel(date: Date, variant: CalendarVariant, locale: string | undefined, weekStartsOn: WeekStart) {
  if (variant === "year") return new Intl.DateTimeFormat(locale, { year: "numeric" }).format(date)
  if (variant !== "week") return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date)
  const week = weekOf(date, weekStartsOn)
  const format = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" })
  return format.formatRange(week[0], week[DAYS_IN_WEEK - 1])
}

function agendaGroups(index: EventIndex, month: Date) {
  const first = startOfMonth(month)
  const length = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return Array.from({ length }, (_, offset) => addDays(first, offset)).flatMap((day) => {
    const events = index.get(dateKey(day))
    return events?.length ? [{ day, events }] : []
  })
}

function monthsOfYear(date: Date) {
  return Array.from({ length: MONTHS_IN_YEAR }, (_, month) => new Date(date.getFullYear(), month, 1))
}

function eventsInMonth(index: EventIndex, month: Date) {
  const unique = new Set(agendaGroups(index, month).flatMap((group) => group.events.map((event) => event.id)))
  return unique.size
}

export {
  agendaGroups,
  eventsInMonth,
  indexEvents,
  monthsOfYear,
  periodKey,
  periodLabel,
  stepPeriod,
  weekOf,
  type CalendarEvent,
  type CalendarVariant,
  type EventIndex,
}
