import type { ReactNode } from "react"
import { ScrollArea, type ScrollAreaProps } from "@/registry/miseui/ui/scroll-area"

const RELEASES = [
  { version: "2.14", note: "Search now finds text inside attachments." },
  { version: "2.13", note: "Invoices can be sent in the customer's own currency." },
  { version: "2.12", note: "Comments keep their place when a document is moved." },
  { version: "2.11", note: "New permission for read-only billing access." },
  { version: "2.10", note: "Exports run in the background and email you a link." },
  { version: "2.9", note: "The mobile app opens files from the share sheet." },
  { version: "2.8", note: "Audit log can be filtered by person and by date." },
  { version: "2.7", note: "Webhooks retry for up to 24 hours after a failure." },
] as const

const PLANS = [
  { name: "Starter", price: "$12", detail: "For one person" },
  { name: "Team", price: "$24", detail: "Up to 20 seats" },
  { name: "Business", price: "$48", detail: "SSO and audit log" },
  { name: "Enterprise", price: "Custom", detail: "Your own region" },
] as const

function Design({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Releases(props: ScrollAreaProps) {
  return (
    <ScrollArea aria-label="Release notes" className="h-48 rounded-lg border" {...props}>
      <ul className="grid gap-3 p-4">
        {RELEASES.map((release) => (
          <li key={release.version} className="grid gap-1">
            <span className="text-sm font-medium tabular-nums">Version {release.version}</span>
            <span className="text-[13px] leading-5 text-muted-foreground">{release.note}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Design label="plain, hover to see the bar">
        <Releases />
      </Design>
      <Design label="overlay, the bar shows while scrolling">
        <Releases variant="overlay" />
      </Design>
      <Design label="shadow, edges fade as you reach them">
        <Releases variant="shadow" />
      </Design>
      <Design label="edge-fade effect">
        <Releases effect="edge-fade" className="h-48 rounded-lg bg-card" />
      </Design>
      <Design label="snap, each flick lands on a card">
        <ScrollArea variant="snap" aria-label="Plans">
          {PLANS.map((plan) => (
            <article key={plan.name} className="grid w-48 gap-1 rounded-lg border bg-card p-4">
              <h3 className="text-sm font-medium">{plan.name}</h3>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{plan.price}</p>
              <p className="text-[13px] text-muted-foreground">{plan.detail}</p>
            </article>
          ))}
        </ScrollArea>
      </Design>
    </div>
  )
}
