import type * as React from "react"
import { useMemo } from "react"
import { buildMonthGrid, dateKey, isSameDay, isSameMonth, monthKey, type WeekStart } from "@/registry/miseui/ui/date-picker-math"
import {
  agendaGroups,
  eventsInMonth,
  monthsOfYear,
  type CalendarEvent,
  type EventIndex,
} from "@/registry/miseui/ui/calendar-math"
import { cn } from "@/registry/miseui/lib/utils"

interface CalendarLabels {
  previous: string
  next: string
  today: string
  /** Shown by `agenda` when the month has nothing in it. */
  empty: string
  /** Shown under the grid when the active day has nothing in it. */
  noEvents: string
  events: (count: number) => string
  more: (count: number) => string
}

interface CalendarViewProps {
  date: Date
  today: Date
  title: string
  index: EventIndex
  locale?: string
  weekStartsOn: WeekStart
  labels: CalendarLabels
  dayFormat: Intl.DateTimeFormat
  weekdayFormat: Intl.DateTimeFormat
  onPick: (day: Date) => void
  onEventSelect?: (event: CalendarEvent) => void
  onGridKeyDown: (event: React.KeyboardEvent) => void
}

interface EventRowProps {
  event: CalendarEvent
  onEventSelect?: (event: CalendarEvent) => void
}

function EventRow({ event, onEventSelect }: EventRowProps) {
  const body = (
    <>
      <span className="block text-sm break-words">{event.title}</span>
      {event.detail ? <span className="block text-[13px] break-words text-muted-foreground">{event.detail}</span> : null}
    </>
  )
  if (!onEventSelect) return <div data-slot="calendar-event" className="min-w-0 py-1">{body}</div>
  return (
    <button
      type="button"
      data-slot="calendar-event"
      className={cn(
        "block min-h-10 w-full min-w-0 rounded-md px-2 py-1 text-left outline-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
      onClick={() => onEventSelect(event)}
    >
      {body}
    </button>
  )
}

function AgendaView({ date, today, index, labels, locale, onEventSelect }: CalendarViewProps) {
  const groups = useMemo(() => agendaGroups(index, date), [index, date])
  const weekday = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale])
  const fullDay = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "full" }), [locale])
  if (groups.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{labels.empty}</p>
  return (
    <ol className="grid min-w-0">
      {groups.map((group) => {
        const isToday = isSameDay(group.day, today)
        return (
          <li key={dateKey(group.day)} className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 border-t py-3">
            <div aria-label={fullDay.format(group.day)} role="group" className="grid content-start justify-items-start gap-1">
              <span aria-hidden="true" className="text-[13px] text-muted-foreground">{weekday.format(group.day)}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-base font-medium tabular-nums",
                  isToday && "bg-mise text-mise-foreground",
                )}
              >
                {group.day.getDate()}
              </span>
            </div>
            <ul className="grid min-w-0 content-start gap-1">
              {group.events.map((event) => (
                <li key={event.id} className="min-w-0"><EventRow event={event} onEventSelect={onEventSelect} /></li>
              ))}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}

interface MiniMonthProps {
  month: Date
  view: CalendarViewProps
  monthFormat: Intl.DateTimeFormat
  titleFormat: Intl.DateTimeFormat
}

function miniDayClass(day: Date, month: Date, view: CalendarViewProps) {
  if (!isSameMonth(day, month)) return "invisible"
  if (isSameDay(day, view.today)) return "rounded-sm bg-mise font-medium text-mise-foreground"
  return view.index.get(dateKey(day))?.length ? "rounded-sm bg-mise-soft font-medium text-foreground" : "text-muted-foreground"
}

function MiniMonth({ month, view, monthFormat, titleFormat }: MiniMonthProps) {
  const weeks = useMemo(() => buildMonthGrid(month, view.weekStartsOn), [month, view.weekStartsOn])
  const count = eventsInMonth(view.index, month)
  const current = isSameMonth(month, view.date)
  const name = titleFormat.format(month)
  return (
    <li className="relative min-w-0 rounded-md p-2 transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent">
      <button
        type="button"
        data-focus-key={monthKey(month)}
        tabIndex={current ? 0 : -1}
        aria-current={current ? "true" : undefined}
        aria-label={count ? `${name}, ${view.labels.events(count)}` : name}
        className="mb-1 block rounded-sm text-left text-[13px] font-medium outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
        onClick={() => view.onPick(month)}
      >
        {monthFormat.format(month)}
      </button>
      {/* A thumbnail: the button above already says what it holds, and 42 extra stops would drown a screen reader. */}
      <div aria-hidden="true" className="grid grid-cols-7 text-center text-[10px] leading-4 tabular-nums">
        {weeks.flat().map((day) => (
          <span key={dateKey(day)} className={miniDayClass(day, month, view)}>{day.getDate()}</span>
        ))}
      </div>
    </li>
  )
}

function YearView(view: CalendarViewProps) {
  const months = useMemo(() => monthsOfYear(view.date), [view.date])
  const monthFormat = useMemo(() => new Intl.DateTimeFormat(view.locale, { month: "long" }), [view.locale])
  const titleFormat = useMemo(() => new Intl.DateTimeFormat(view.locale, { month: "long", year: "numeric" }), [view.locale])
  return (
    <ul data-slot="calendar-year" className="grid min-w-0 grid-cols-2 gap-2 @lg:grid-cols-3 @3xl:grid-cols-4" onKeyDown={view.onGridKeyDown}>
      {months.map((month) => (
        <MiniMonth key={monthKey(month)} month={month} view={view} monthFormat={monthFormat} titleFormat={titleFormat} />
      ))}
    </ul>
  )
}

export { AgendaView, EventRow, YearView, type CalendarLabels, type CalendarViewProps }
