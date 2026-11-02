import type * as React from "react"
import { useRef, useState } from "react"
import { CalendarDays } from "lucide-react"
import { Calendar, type CalendarProps } from "@/registry/miseui/ui/date-picker-calendar"
import { datePattern, numericFormat, parseDateText } from "@/registry/miseui/ui/date-picker-math"
import { Input } from "@/registry/miseui/ui/input"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/registry/miseui/ui/popover"

type CalendarOptions = Omit<CalendarProps, "mode" | "value" | "defaultValue" | "onValueChange">

type TypedDateFieldProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "min" | "max" | "defaultValue"> & {
  value: Date | null
  onCommit: (value: Date | null) => void
  calendarProps: CalendarOptions
  openLabel?: string
}

/** Keeps wrong text on screen and flagged, because replacing it would throw away what someone is halfway through fixing. */
function useTypedDate(value: Date | null, onCommit: (value: Date | null) => void, { locale, min, max, isDateDisabled }: CalendarOptions) {
  const [draft, setDraft] = useState<string | null>(null)
  const parse = (text: string) => {
    const parsed = parseDateText(text, locale)
    if (!parsed || (min && parsed < min) || (max && parsed > max) || isDateDisabled?.(parsed)) return null
    return parsed
  }
  const invalid = draft !== null && draft.trim() !== "" && parse(draft) === null
  const commit = () => {
    if (draft === null || invalid) return
    onCommit(draft.trim() === "" ? null : parse(draft))
    setDraft(null)
  }
  return { text: draft ?? (value ? numericFormat(locale).format(value) : ""), draft, setDraft, invalid, commit }
}

/** Radix would land on the first button, a year back. The day is where the keyboard wants to be. */
function CalendarPopoverContent(props: React.ComponentProps<typeof PopoverContent>) {
  const contentRef = useRef<HTMLDivElement>(null)
  return (
    <PopoverContent
      ref={contentRef}
      className="w-auto max-w-(--radix-popover-content-available-width) p-3"
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        contentRef.current?.querySelector<HTMLElement>("button[data-date][tabindex='0']")?.focus()
      }}
      {...props}
    />
  )
}

function OpenCalendarButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <PopoverTrigger
      aria-label={label}
      disabled={disabled}
      className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none pointer-coarse:w-10"
    >
      <CalendarDays aria-hidden="true" className="size-4" />
    </PopoverTrigger>
  )
}

function TypedDateField({ value, onCommit, calendarProps, openLabel = "Open calendar", disabled, placeholder, onBlur, onKeyDown, ...inputProps }: TypedDateFieldProps) {
  const typed = useTypedDate(value, onCommit, calendarProps)
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full min-w-0">
          <Input
            {...inputProps}
            aria-invalid={typed.invalid || inputProps["aria-invalid"] || undefined}
            autoComplete="off"
            inputMode="numeric"
            data-slot="date-picker-input"
            disabled={disabled}
            placeholder={placeholder ?? datePattern(calendarProps.locale)}
            value={typed.text}
            className="pr-10 tabular-nums pointer-coarse:h-10 pointer-coarse:pr-12"
            onChange={(event) => typed.setDraft(event.target.value)}
            onBlur={(event) => {
              typed.commit()
              onBlur?.(event)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") typed.commit()
              if (event.key === "Escape" && typed.draft !== null) typed.setDraft(null)
              onKeyDown?.(event)
            }}
          />
          <OpenCalendarButton label={openLabel} disabled={disabled} />
        </div>
      </PopoverAnchor>
      <CalendarPopoverContent align="end">
        <Calendar
          {...calendarProps}
          value={value}
          onValueChange={(next) => {
            typed.setDraft(null)
            onCommit(next)
            setOpen(false)
          }}
        />
      </CalendarPopoverContent>
    </Popover>
  )
}

export { CalendarPopoverContent, TypedDateField }
