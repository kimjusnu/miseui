import type * as React from "react"
import { useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { firstDayOfWeek, startOfDay, type WeekStart } from "@/registry/miseui/ui/date-picker-math"
import { indexEvents, periodLabel, stepPeriod, type CalendarEvent, type CalendarVariant } from "@/registry/miseui/ui/calendar-math"
import { MonthView, WeekView } from "@/registry/miseui/ui/calendar-grid"
import { useCalendarView } from "@/registry/miseui/ui/calendar-state"
import { AgendaView, YearView, type CalendarLabels, type CalendarViewProps } from "@/registry/miseui/ui/calendar-views"
import { cn } from "@/registry/miseui/lib/utils"

type CalendarEffect = "slide"

const SLIDE_DISTANCE_PX = 16
const NAV_BUTTON_CLASS = cn(
  "flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none pointer-coarse:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4",
)

const DEFAULT_LABELS: CalendarLabels = {
  previous: "Previous",
  next: "Next",
  today: "Today",
  empty: "Nothing scheduled this month.",
  noEvents: "Nothing scheduled.",
  events: (count) => (count === 1 ? "1 event" : `${count} events`),
  more: (count) => `${count} more`,
}

/** Shared-axis: the outgoing period leaves the way the new one comes from, so forward always reads as forward. */
const SLIDE_VARIANTS: Variants = {
  enter: (direction: number) => ({ x: direction * SLIDE_DISTANCE_PX, opacity: 0 }),
  centre: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: -direction * SLIDE_DISTANCE_PX, opacity: 0 }),
}

const VIEWS: Record<CalendarVariant, (view: CalendarViewProps) => React.ReactNode> = {
  month: MonthView,
  week: WeekView,
  agenda: AgendaView,
  year: YearView,
}

type RootAttributes = Omit<React.ComponentProps<"div">, "children" | "defaultValue">

interface CalendarProps extends RootAttributes {
  events?: readonly CalendarEvent[]
  /** `month` grid with labels, `week` seven day strip, `agenda` grouped list, `year` twelve small months. */
  variant?: CalendarVariant
  /** `slide` moves periods along a shared axis on a spring; a quick second press interrupts it. */
  effect?: CalendarEffect
  /** The active day. Which period is on screen follows from it. */
  date?: Date
  defaultDate?: Date
  onDateChange?: (date: Date) => void
  /** A day, or the first of a month in `year`, was chosen. Arrow keys alone do not fire it. */
  onDateSelect?: (date: Date) => void
  /** Makes events interactive. Without it they are plain labels. */
  onEventSelect?: (event: CalendarEvent) => void
  /** BCP 47 tag. Names, numbers and the first day of the week all follow it. */
  locale?: string
  /** Overrides the locale's first day of the week. 0 is Sunday. */
  weekStartsOn?: WeekStart
  /** Stands in for the clock, for tests and for a server that decides what today is. */
  today?: Date
  labels?: Partial<CalendarLabels>
}

interface CalendarHeaderProps {
  title: string
  labels: CalendarLabels
  onToday: () => void
  onStep: (amount: number) => void
}

function CalendarHeader({ title, labels, onToday, onStep }: CalendarHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-2">
      <h3 aria-live="polite" className="mr-auto min-w-0 text-[15px] font-medium">{title}</h3>
      <button
        type="button"
        className={cn(NAV_BUTTON_CLASS, "w-auto px-2 text-[13px] text-foreground max-sm:pointer-coarse:hidden pointer-coarse:w-auto")}
        onClick={onToday}
      >
        {labels.today}
      </button>
      <div className="flex">
        <button type="button" aria-label={labels.previous} className={NAV_BUTTON_CLASS} onClick={() => onStep(-1)}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <button type="button" aria-label={labels.next} className={NAV_BUTTON_CLASS} onClick={() => onStep(1)}>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}

interface CalendarStageProps {
  viewKey: string
  direction: number
  slide: boolean
  children: React.ReactNode
}

function CalendarStage({ viewKey, direction, slide, children }: CalendarStageProps) {
  if (!slide) return <div data-view-key={viewKey} className="min-w-0">{children}</div>
  return (
    <div className="relative min-w-0 overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={viewKey}
          data-view-key={viewKey}
          custom={direction}
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="centre"
          exit="exit"
          transition={SPRING_DEFAULT}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Calendar({
  events, variant = "month", effect, date, defaultDate, onDateChange, onDateSelect, onEventSelect,
  locale, weekStartsOn, today, labels, className, ...props
}: CalendarProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const [now] = useState(() => startOfDay(new Date()))
  const todayDay = today ? startOfDay(today) : now
  const firstDay = useMemo(() => weekStartsOn ?? firstDayOfWeek(locale), [weekStartsOn, locale])
  const state = useCalendarView({ variant, weekStartsOn: firstDay, date, defaultDate, today: todayDay, onDateChange }, rootRef)
  const index = useMemo(() => indexEvents(events ?? []), [events])
  const dayFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "full" }), [locale])
  const weekdayFormat = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale])
  const merged = { ...DEFAULT_LABELS, ...labels }
  const title = periodLabel(state.date, variant, locale, firstDay)
  const pick = (day: Date) => {
    state.change(day)
    onDateSelect?.(day)
  }
  const View = VIEWS[variant]
  return (
    <div ref={rootRef} data-slot="calendar" data-variant={variant} data-effect={effect} className={cn("@container grid w-full min-w-0 gap-3", className)} {...props}>
      <CalendarHeader title={title} labels={merged} onToday={() => state.change(todayDay)} onStep={(amount) => state.change(stepPeriod(state.date, variant, amount))} />
      <CalendarStage viewKey={state.viewKey} direction={state.direction} slide={effect === "slide" && !reduceMotion}>
        <View
          date={state.date} today={todayDay} title={title} index={index} locale={locale} weekStartsOn={firstDay} labels={merged}
          dayFormat={dayFormat} weekdayFormat={weekdayFormat} onGridKeyDown={state.onGridKeyDown} onEventSelect={onEventSelect} onPick={pick}
        />
      </CalendarStage>
    </div>
  )
}

export { Calendar, type CalendarProps, type CalendarEvent, type CalendarVariant, type CalendarEffect, type CalendarLabels }
