import type * as React from "react"
import { useMemo, useRef, useSyncExternalStore } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { addMonths, firstDayOfWeek, monthKey, type DateRange, type WeekStart } from "@/registry/miseui/ui/date-picker-math"
import { CalendarMonth } from "@/registry/miseui/ui/date-picker-month"
import { useCalendarState, type CalendarState } from "@/registry/miseui/ui/date-picker-state"
import { cn } from "@/registry/miseui/lib/utils"

type CalendarEffect = "slide"

const TWO_MONTH_QUERY = "(min-width: 640px)"
const SLIDE_DISTANCE_PX = 16
const MONTHS_IN_YEAR = 12
/** A phone has no room for four 40 px buttons and a month name, and a year is rarely one press away there anyway. */
const YEAR_BUTTON_CLASS = "max-sm:pointer-coarse:hidden"
const NAV_BUTTON_CLASS = cn(
  "flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none pointer-coarse:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:size-4",
)

/** Shared-axis: the outgoing month leaves the way the new one comes from, so forward always reads as forward. */
const SLIDE_VARIANTS: Variants = {
  enter: (direction: number) => ({ x: direction * SLIDE_DISTANCE_PX, opacity: 0 }),
  centre: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: -direction * SLIDE_DISTANCE_PX, opacity: 0 }),
}

interface CalendarLabels {
  previousMonth: string
  nextMonth: string
  previousYear: string
  nextYear: string
}

const DEFAULT_LABELS: CalendarLabels = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previousYear: "Previous year",
  nextYear: "Next year",
}

interface CalendarBaseProps {
  min?: Date
  max?: Date
  /** Greys out days the calendar cannot offer, such as weekends. */
  isDateDisabled?: (date: Date) => boolean
  /** BCP 47 tag. Names, numbers and the first day of the week all follow it. */
  locale?: string
  /** Overrides the locale's first day of the week. 0 is Sunday. */
  weekStartsOn?: WeekStart
  /** Two months side by side, from 640 px wide. A phone keeps one, so nothing has to scroll sideways. */
  months?: 1 | 2
  /** `slide` moves months along a shared axis on a spring, and a quick second press interrupts it. */
  effect?: CalendarEffect
  /** The month shown first when nothing is selected. */
  defaultMonth?: Date
  month?: Date
  onMonthChange?: (month: Date) => void
  /** Stands in for the clock, for tests and for a server that decides what today is. */
  today?: Date
  labels?: Partial<CalendarLabels>
  className?: string
}

type CalendarProps = CalendarBaseProps &
  (
    | { mode?: "single"; value?: Date | null; defaultValue?: Date | null; onValueChange?: (value: Date) => void }
    | { mode: "range"; value?: DateRange | null; defaultValue?: DateRange | null; onValueChange?: (value: DateRange) => void }
  )

function subscribeToWidth(notify: () => void) {
  const query = window.matchMedia(TWO_MONTH_QUERY)
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}

/** Worked out in JS and not hidden with CSS, because arrow keys must never walk into a month that is not on screen. */
function useMonthsShown(months: number) {
  return useSyncExternalStore(
    subscribeToWidth,
    () => (months > 1 && window.matchMedia(TWO_MONTH_QUERY).matches ? months : 1),
    () => 1,
  )
}

interface NavButtonProps {
  label: string
  amount: number
  state: CalendarState
  className?: string
  children: React.ReactNode
}

/** aria-disabled, not disabled: a focused button that went dead would drop the keyboard user back at the top of the page. */
function NavButton({ label, amount, state, className, children }: NavButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={!state.canStep(amount) || undefined}
      className={cn(NAV_BUTTON_CLASS, className)}
      onClick={() => state.stepMonths(amount)}
    >
      {children}
    </button>
  )
}

function CalendarNav({ state, labels }: { state: CalendarState; labels: CalendarLabels }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between">
      <div className="pointer-events-auto flex">
        <NavButton label={labels.previousYear} amount={-MONTHS_IN_YEAR} state={state} className={YEAR_BUTTON_CLASS}>
          <ChevronsLeft aria-hidden="true" />
        </NavButton>
        <NavButton label={labels.previousMonth} amount={-1} state={state}>
          <ChevronLeft aria-hidden="true" />
        </NavButton>
      </div>
      <div className="pointer-events-auto flex">
        <NavButton label={labels.nextMonth} amount={1} state={state}>
          <ChevronRight aria-hidden="true" />
        </NavButton>
        <NavButton label={labels.nextYear} amount={MONTHS_IN_YEAR} state={state} className={YEAR_BUTTON_CLASS}>
          <ChevronsRight aria-hidden="true" />
        </NavButton>
      </div>
    </div>
  )
}

interface CalendarPanelProps {
  state: CalendarState
  monthsShown: number
  locale?: string
  weekStartsOn: WeekStart
  slide: boolean
}

function CalendarPanel({ state, monthsShown, locale, weekStartsOn, slide }: CalendarPanelProps) {
  const months = (
    <div className="flex items-start gap-6">
      {Array.from({ length: monthsShown }, (_, index) => {
        const month = addMonths(state.view, index)
        return (
          <CalendarMonth key={monthKey(month)} month={month} state={state} locale={locale} weekStartsOn={weekStartsOn} showOutside={monthsShown === 1} />
        )
      })}
    </div>
  )
  if (!slide) return months
  return (
    <div className="relative overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout" custom={state.direction}>
        <motion.div
          key={monthKey(state.view)}
          custom={state.direction}
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="centre"
          exit="exit"
          transition={SPRING_DEFAULT}
        >
          {months}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Calendar(props: CalendarProps) {
  const { effect, locale, labels, months = 1, className } = props
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const monthsShown = useMonthsShown(months)
  const weekStartsOn = useMemo(() => props.weekStartsOn ?? firstDayOfWeek(locale), [props.weekStartsOn, locale])
  const state = useCalendarState({ ...props, mode: props.mode ?? "single", monthsShown, weekStartsOn }, rootRef)
  const announce = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(state.view), [locale, state.view])
  return (
    <div ref={rootRef} data-slot="calendar" data-effect={effect} data-months={monthsShown} className={cn("relative w-fit max-w-full", className)}>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      <CalendarNav state={state} labels={{ ...DEFAULT_LABELS, ...labels }} />
      <CalendarPanel state={state} monthsShown={monthsShown} locale={locale} weekStartsOn={weekStartsOn} slide={effect === "slide" && !reduceMotion} />
    </div>
  )
}

export { Calendar, type CalendarProps, type CalendarEffect, type CalendarLabels }
