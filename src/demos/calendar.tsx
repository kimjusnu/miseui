import { useState } from "react"
import { Calendar, type CalendarEvent, type CalendarVariant } from "@/registry/miseui/ui/calendar"

const TODAY = new Date(2026, 10, 11)

const EVENTS: readonly CalendarEvent[] = [
  { id: "standup", title: "Team check-in", date: new Date(2026, 10, 2), detail: "Weekly, video call" },
  { id: "review", title: "Design review", date: new Date(2026, 10, 11), detail: "Room 4, bring the checkout flow" },
  { id: "invoice", title: "Send invoices", date: new Date(2026, 10, 11) },
  { id: "dentist", title: "Dentist", date: new Date(2026, 10, 11), detail: "Leave by four" },
  { id: "release", title: "Version 2.4 release", date: new Date(2026, 10, 13) },
  { id: "offsite", title: "Team offsite", date: new Date(2026, 10, 18), end: new Date(2026, 10, 20), detail: "Busan, three days" },
  { id: "payroll", title: "Payroll closes", date: new Date(2026, 10, 25) },
  { id: "audit", title: "Security audit", date: new Date(2026, 8, 8) },
  { id: "budget", title: "Budget draft due", date: new Date(2026, 11, 4) },
]

const SMALL: readonly CalendarVariant[] = ["week", "agenda"]

export function Demo() {
  const [picked, setPicked] = useState<CalendarEvent | null>(null)
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">month, slide effect, events open on press</p>
        <Calendar events={EVENTS} today={TODAY} defaultDate={TODAY} effect="slide" onEventSelect={setPicked} locale="en-GB" />
        <p aria-live="polite" className="text-[13px] text-muted-foreground">
          {picked ? `Opened: ${picked.title}` : "Press an event to open it."}
        </p>
      </div>
      {SMALL.map((variant) => (
        <div key={variant} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{variant}</p>
          <Calendar variant={variant} events={EVENTS} today={TODAY} defaultDate={TODAY} locale="en-GB" />
        </div>
      ))}
      <div className="grid min-w-0 content-start gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">year</p>
        <Calendar variant="year" events={EVENTS} today={TODAY} defaultDate={TODAY} effect="slide" locale="en-GB" />
      </div>
    </div>
  )
}
