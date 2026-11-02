import { useMemo } from "react"
import {
  buildMonthGrid,
  dateKey,
  isSameDay,
  isSameMonth,
  weekdayLabels,
} from "@/registry/miseui/ui/date-picker-math"
import { weekOf, type CalendarEvent } from "@/registry/miseui/ui/calendar-math"
import { EventRow, type CalendarViewProps } from "@/registry/miseui/ui/calendar-views"
import { cn } from "@/registry/miseui/lib/utils"

const MONTH_CHIPS = 2
const WEEK_CHIPS = 4
const MAX_MARKS = 3

/** Today is the one filled circle on the screen; the active day only gets a quiet fill so the two never compete. */
function dayNumberClass(today: boolean, active: boolean) {
  if (today) return "bg-mise font-medium text-mise-foreground"
  return active ? "bg-accent font-medium" : ""
}

interface EventChipProps {
  event: CalendarEvent
  focusable: boolean
  wrap: boolean
  onEventSelect?: (event: CalendarEvent) => void
}

/** Without a handler it stays text and lets the click fall through to the day under it. */
function EventChip({ event, focusable, wrap, onEventSelect }: EventChipProps) {
  const className = cn(
    "block w-full rounded-sm bg-mise-soft px-1 text-left text-[13px] leading-5 text-foreground",
    wrap ? "line-clamp-2 break-words" : "truncate",
  )
  if (!onEventSelect) {
    return <span data-slot="calendar-event" className={cn(className, "pointer-events-none")}>{event.title}</span>
  }
  return (
    <button
      type="button"
      data-slot="calendar-event"
      tabIndex={focusable ? 0 : -1}
      title={event.title}
      className={cn(className, "relative z-10 outline-none hover:bg-mise-soft/70 focus-visible:ring-[3px] focus-visible:ring-ring/50")}
      onClick={() => onEventSelect(event)}
    >
      {event.title}
    </button>
  )
}

interface DayCellProps {
  day: Date
  outside: boolean
  layout: "month" | "week"
  view: CalendarViewProps
}

function DayButton({ day, outside, layout, view, eventCount }: DayCellProps & { eventCount: number }) {
  const today = isSameDay(day, view.today)
  const label = view.dayFormat.format(day)
  return (
    <button
      type="button"
      data-date={dateKey(day)}
      data-focus-key={dateKey(day)}
      data-outside={outside ? "true" : undefined}
      tabIndex={isSameDay(day, view.date) ? 0 : -1}
      aria-label={eventCount ? `${label}, ${view.labels.events(eventCount)}` : label}
      aria-current={today ? "date" : undefined}
      className={cn(
        "group/day block w-full rounded-md text-[13px] outline-none after:absolute after:inset-0",
        layout === "week" && "flex flex-col items-center gap-1 py-1",
      )}
      onClick={() => view.onPick(day)}
    >
      {layout === "week" ? <span aria-hidden="true" className="text-muted-foreground">{view.weekdayFormat.format(day)}</span> : null}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 items-center justify-center rounded-full tabular-nums",
          "group-hover/day:bg-accent group-focus-visible/day:ring-[3px] group-focus-visible/day:ring-ring/50",
          outside && !today && "text-muted-foreground",
          dayNumberClass(today, isSameDay(day, view.date)),
          today && "group-hover/day:bg-mise",
        )}
      >
        {day.getDate()}
      </span>
    </button>
  )
}

function DayCell({ day, outside, layout, view }: DayCellProps) {
  const events = view.index.get(dateKey(day)) ?? []
  const active = isSameDay(day, view.date)
  const limit = layout === "month" ? MONTH_CHIPS : WEEK_CHIPS
  const hidden = events.length - limit
  return (
    <td
      role="gridcell"
      aria-selected={active}
      className={cn(
        "relative p-1 align-top",
        layout === "month" ? "h-12 border-t border-l first:border-l-0 @xl:h-24" : "@xl:h-40",
        outside && "bg-muted/50",
      )}
    >
      <DayButton day={day} outside={outside} layout={layout} view={view} eventCount={events.length} />
      {events.length ? (
        <span aria-hidden="true" className="mt-1 flex justify-center gap-1 @xl:hidden">
          {events.slice(0, MAX_MARKS).map((event) => (
            <span key={event.id} className="h-0.5 w-1 rounded-full bg-mise" />
          ))}
        </span>
      ) : null}
      <div className="mt-1 hidden gap-1 @xl:grid">
        {events.slice(0, limit).map((event) => (
          <EventChip key={event.id} event={event} focusable={active} wrap={layout === "week"} onEventSelect={view.onEventSelect} />
        ))}
        {hidden > 0 ? <span className="pointer-events-none px-1 text-[13px] leading-5 text-muted-foreground">{view.labels.more(hidden)}</span> : null}
      </div>
    </td>
  )
}

/** Phones have no room for labels in a cell, so the active day's events are listed under the grid instead. */
function DayList({ view, limit }: { view: CalendarViewProps; limit: number }) {
  const events = view.index.get(dateKey(view.date)) ?? []
  return (
    <section
      data-slot="calendar-day-list"
      aria-label={view.dayFormat.format(view.date)}
      className={cn("grid min-h-16 content-start gap-2 border-t pt-3", events.length <= limit && "@xl:hidden")}
    >
      <p className="text-[13px] text-muted-foreground">{view.dayFormat.format(view.date)}</p>
      {events.length ? (
        <ul className="grid gap-1">
          {events.map((event) => (
            <li key={event.id}><EventRow event={event} onEventSelect={view.onEventSelect} /></li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{view.labels.noEvents}</p>
      )}
    </section>
  )
}

function MonthView(view: CalendarViewProps) {
  const weeks = useMemo(() => buildMonthGrid(view.date, view.weekStartsOn), [view.date, view.weekStartsOn])
  const weekdays = useMemo(() => weekdayLabels(view.locale, view.weekStartsOn), [view.locale, view.weekStartsOn])
  return (
    <div className="grid min-w-0 gap-3">
      <table role="grid" aria-label={view.title} className="w-full table-fixed border-separate border-spacing-0 border-b" onKeyDown={view.onGridKeyDown}>
        <thead>
          <tr>
            {weekdays.map((weekday) => (
              <th key={weekday.long} scope="col" abbr={weekday.long} className="h-8 p-0 text-[13px] font-normal text-muted-foreground">
                {weekday.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={dateKey(week[0])}>
              {week.map((day) => (
                <DayCell key={dateKey(day)} day={day} outside={!isSameMonth(day, view.date)} layout="month" view={view} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <DayList view={view} limit={MONTH_CHIPS} />
    </div>
  )
}

function WeekView(view: CalendarViewProps) {
  const days = useMemo(() => weekOf(view.date, view.weekStartsOn), [view.date, view.weekStartsOn])
  return (
    <div className="grid min-w-0 gap-3">
      <table role="grid" aria-label={view.title} className="w-full table-fixed border-separate border-spacing-0" onKeyDown={view.onGridKeyDown}>
        <tbody>
          <tr>
            {days.map((day) => (
              <DayCell key={dateKey(day)} day={day} outside={false} layout="week" view={view} />
            ))}
          </tr>
        </tbody>
      </table>
      <DayList view={view} limit={WEEK_CHIPS} />
    </div>
  )
}

export { MonthView, WeekView }
