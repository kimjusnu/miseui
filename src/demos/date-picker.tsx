import { useState } from "react"
import { Calendar, DatePicker } from "@/registry/miseui/ui/date-picker"

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6

function DemoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function LimitedCalendar() {
  const [today] = useState(() => new Date())
  const [limit] = useState(() => new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()))
  return <DatePicker variant="inline" effect="slide" min={today} max={limit} isDateDisabled={isWeekend} />
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <DemoCell label="plain">
        <DatePicker placeholder="Pick a delivery day" />
      </DemoCell>
      <DemoCell label="compact, type a date or open the calendar">
        <DatePicker variant="compact" aria-label="Contract start" />
      </DemoCell>
      <DemoCell label="range, two months and a band">
        <DatePicker variant="range" placeholder="Check-in and check-out" effect="slide" />
      </DemoCell>
      <DemoCell label="locale: German week and names">
        <DatePicker locale="de-DE" placeholder="Datum wählen" />
      </DemoCell>
      <DemoCell label="inline">
        <DatePicker variant="inline" />
      </DemoCell>
      <DemoCell label="slide effect, weekdays in the next two months">
        <LimitedCalendar />
      </DemoCell>
      <DemoCell label="Calendar alone, range">
        <div className="min-w-0">
          <div className="w-fit max-w-full rounded-lg border bg-card p-3">
            <Calendar mode="range" />
          </div>
        </div>
      </DemoCell>
    </div>
  )
}
