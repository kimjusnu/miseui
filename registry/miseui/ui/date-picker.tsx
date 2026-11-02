import type * as React from "react"
import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { Calendar, type CalendarEffect, type CalendarLabels, type CalendarProps } from "@/registry/miseui/ui/date-picker-calendar"
import { dateKey, type DateRange, type WeekStart } from "@/registry/miseui/ui/date-picker-math"
import { CalendarPopoverContent, TypedDateField } from "@/registry/miseui/ui/date-picker-typed"
import { Popover, PopoverTrigger } from "@/registry/miseui/ui/popover"
import { cn } from "@/registry/miseui/lib/utils"

type DatePickerVariant = "plain" | "inline" | "compact" | "range"

type TriggerAttributes = Omit<React.ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "children">

interface DatePickerBaseProps extends TriggerAttributes {
  /** `slide` moves months along a shared axis on a spring, and a quick second press interrupts it. */
  effect?: CalendarEffect
  min?: Date
  max?: Date
  isDateDisabled?: (date: Date) => boolean
  locale?: string
  weekStartsOn?: WeekStart
  defaultMonth?: Date
  today?: Date
  labels?: Partial<CalendarLabels>
  placeholder?: string
  /** Posts YYYY-MM-DD with the surrounding form. `range` posts `name-start` and `name-end`. */
  name?: string
}

type DatePickerSingleProps = DatePickerBaseProps & {
  /** `plain` button and popover, `inline` always open, `compact` typed date with a popover, `range` two months and a band. */
  variant?: "plain" | "inline" | "compact"
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (value: Date | null) => void
}

type DatePickerRangeProps = DatePickerBaseProps & {
  variant: "range"
  value?: DateRange | null
  defaultValue?: DateRange | null
  onValueChange?: (value: DateRange | null) => void
}

type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps

const TRIGGER_CLASS = cn(
  "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs outline-none pointer-coarse:h-10",
  "transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-ring",
  "aria-invalid:border-destructive disabled:pointer-events-none disabled:opacity-50",
)

/** Everything else on the props is a button attribute and goes to the trigger, which is what a Field needs. */
const OWN_PROPS: ReadonlySet<string> = new Set([
  "effect", "min", "max", "isDateDisabled", "locale", "weekStartsOn", "defaultMonth", "today", "labels", "placeholder",
  "name", "variant", "value", "defaultValue", "onValueChange", "className",
])

function triggerAttributes(props: DatePickerProps) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !OWN_PROPS.has(key))) as TriggerAttributes
}

function formatTrigger(value: Date | DateRange | null, locale?: string) {
  if (!value) return null
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
  if (value instanceof Date) return format.format(value)
  return value.end ? format.formatRange(value.start, value.end) : `${format.format(value.start)} …`
}

function HiddenInputs({ name, value }: { name?: string; value: Date | DateRange | null }) {
  if (!name) return null
  if (value instanceof Date) return <input type="hidden" name={name} value={dateKey(value)} />
  return (
    <>
      <input type="hidden" name={`${name}-start`} value={value ? dateKey(value.start) : ""} />
      <input type="hidden" name={`${name}-end`} value={value?.end ? dateKey(value.end) : ""} />
    </>
  )
}

function useDatePickerValue(props: DatePickerProps) {
  const [uncontrolled, setUncontrolled] = useState<Date | DateRange | null>(props.defaultValue ?? null)
  const current = props.value !== undefined ? props.value : uncontrolled
  const change = (next: Date | DateRange | null) => {
    setUncontrolled(next)
    ;(props.onValueChange as ((value: Date | DateRange | null) => void) | undefined)?.(next)
  }
  return [current, change] as const
}

interface PopoverPickerProps {
  props: DatePickerProps
  isRange: boolean
  current: Date | DateRange | null
  change: (next: Date | DateRange | null) => void
  calendarProps: Omit<CalendarProps, "mode" | "value" | "defaultValue" | "onValueChange">
}

function PopoverPicker({ props, isRange, current, change, calendarProps }: PopoverPickerProps) {
  const [open, setOpen] = useState(false)
  const text = formatTrigger(current, props.locale)
  const placeholder = props.placeholder ?? (isRange ? "Pick dates" : "Pick a date")
  const onPick = (next: Date | DateRange) => {
    change(next)
    // A range is not finished until its second click.
    if (next instanceof Date || next.end) setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={TRIGGER_CLASS} {...triggerAttributes(props)}>
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("min-w-0 truncate tabular-nums", !text && "text-muted-foreground")}>{text ?? placeholder}</span>
      </PopoverTrigger>
      <CalendarPopoverContent align="start">
        {isRange ? (
          <Calendar {...calendarProps} mode="range" months={2} value={current as DateRange | null} onValueChange={onPick} />
        ) : (
          <Calendar {...calendarProps} value={current as Date | null} onValueChange={onPick} />
        )}
      </CalendarPopoverContent>
    </Popover>
  )
}

function DatePicker(props: DatePickerProps) {
  const { variant = "plain", effect, min, max, isDateDisabled, locale, weekStartsOn, defaultMonth, today, labels, name, className } = props
  const [current, change] = useDatePickerValue(props)
  const calendarProps = { effect, min, max, isDateDisabled, locale, weekStartsOn, defaultMonth, today, labels }
  return (
    <div data-slot="date-picker" data-variant={variant} data-effect={effect} className={cn("w-full min-w-0", className)}>
      <HiddenInputs name={name} value={current} />
      {variant === "inline" ? (
        <div className="w-fit max-w-full rounded-lg border bg-card p-3">
          <Calendar {...calendarProps} value={current as Date | null} onValueChange={change} />
        </div>
      ) : null}
      {variant === "compact" ? (
        <TypedDateField
          {...(triggerAttributes(props) as React.ComponentProps<"input">)}
          placeholder={props.placeholder}
          value={current as Date | null}
          onCommit={change}
          calendarProps={calendarProps}
        />
      ) : null}
      {variant === "plain" || variant === "range" ? (
        <PopoverPicker props={props} isRange={variant === "range"} current={current} change={change} calendarProps={calendarProps} />
      ) : null}
    </div>
  )
}

export {
  Calendar,
  DatePicker,
  type CalendarProps,
  type CalendarEffect,
  type DateRange,
  type DatePickerProps,
  type DatePickerVariant,
  type WeekStart,
}
