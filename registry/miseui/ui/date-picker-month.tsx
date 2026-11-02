import { useId, useMemo } from "react"
import {
  buildMonthGrid,
  dateKey,
  isSameDay,
  isSameMonth,
  monthKey,
  rangeRole,
  weekdayLabels,
  type RangeRole,
  type WeekStart,
} from "@/registry/miseui/ui/date-picker-math"
import type { CalendarState } from "@/registry/miseui/ui/date-picker-state"
import { cn } from "@/registry/miseui/lib/utils"

/** Columns share the width, so a parent narrower than seven full cells shrinks the days and never clips Saturday. */
const CELL_SIZE_CLASS = "aspect-square w-full"

/** The band sits on the cell and the day on top of it, so a band runs unbroken across a row and rounds at its ends. */
const BAND_CLASS: Record<RangeRole, string> = {
  single: "",
  start: "rounded-l-md bg-mise-soft last:rounded-r-md",
  end: "rounded-r-md bg-mise-soft first:rounded-l-md",
  middle: "bg-mise-soft first:rounded-l-md last:rounded-r-md",
}

interface DayCellProps {
  day: Date
  month: Date
  state: CalendarState
  showOutside: boolean
  dayFormat: Intl.DateTimeFormat
}

function DayCell({ day, month, state, showOutside, dayFormat }: DayCellProps) {
  const outside = !isSameMonth(day, month)
  if (outside && !showOutside) return (
      <td role="gridcell" aria-hidden="true" className="p-0">
        <span className={cn("block", CELL_SIZE_CLASS)} />
      </td>
    )
  const disabled = state.isDisabled(day)
  const role = rangeRole(day, state.range, state.preview)
  const endpoint = role === "start" || role === "end" || role === "single"
  const selected = isSameDay(day, state.selected) || endpoint
  const today = isSameDay(day, state.today)
  return (
    <td role="gridcell" aria-selected={selected || role === "middle"} data-range={role ?? undefined} className={cn("p-0", role && BAND_CLASS[role])}>
      <button
        type="button"
        data-date={dateKey(day)}
        data-outside={outside ? "true" : undefined}
        tabIndex={!outside && isSameDay(day, state.tabDay) ? 0 : -1}
        aria-label={dayFormat.format(day)}
        aria-current={today ? "date" : undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "flex items-center justify-center rounded-md text-sm tabular-nums outline-none",
          "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
          CELL_SIZE_CLASS,
          selected ? "bg-mise font-medium text-mise-foreground hover:bg-mise/90" : "hover:bg-accent",
          !selected && today && "font-medium ring-1 ring-input ring-inset",
          !selected && outside && "text-muted-foreground",
          disabled && "cursor-not-allowed text-muted-foreground/50 hover:bg-transparent",
        )}
        onClick={() => state.select(day)}
        onMouseEnter={() => state.previewDay(day)}
        onFocus={() => state.previewDay(day)}
      >
        {day.getDate()}
      </button>
    </td>
  )
}

interface CalendarMonthProps {
  month: Date
  state: CalendarState
  locale?: string
  weekStartsOn: WeekStart
  /** Off with two months side by side, where the same day would otherwise appear twice. */
  showOutside: boolean
}

function CalendarMonth({ month, state, locale, weekStartsOn, showOutside }: CalendarMonthProps) {
  const titleId = useId()
  const weeks = useMemo(() => buildMonthGrid(month, weekStartsOn), [month, weekStartsOn])
  const weekdays = useMemo(() => weekdayLabels(locale, weekStartsOn), [locale, weekStartsOn])
  const dayFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "full" }), [locale])
  const title = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month), [locale, month])
  return (
    <div data-slot="calendar-month" data-month={monthKey(month)} className="grid w-63 max-w-full min-w-0 gap-1 pointer-coarse:w-70">
      {/* The side padding keeps a long month name clear of the buttons laid over this row. */}
      <div id={titleId} className="truncate px-16 text-center text-sm leading-8 font-medium max-sm:pointer-coarse:px-11 sm:pointer-coarse:px-20 pointer-coarse:leading-10">
        {title}
      </div>
      <table role="grid" aria-labelledby={titleId} className="w-full table-fixed border-separate border-spacing-0" onKeyDown={state.onGridKeyDown}>
        <thead>
          <tr>
            {weekdays.map((weekday) => (
              <th key={weekday.long} scope="col" abbr={weekday.long} className="h-8 p-0 text-[13px] font-normal text-muted-foreground">
                {weekday.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody onMouseLeave={() => state.previewDay(null)}>
          {weeks.map((week) => (
            <tr key={dateKey(week[0])}>
              {week.map((day) => (
                <DayCell key={dateKey(day)} day={day} month={month} state={state} showOutside={showOutside} dayFormat={dayFormat} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { CalendarMonth }
