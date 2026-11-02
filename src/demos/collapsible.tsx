import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/miseui/ui/collapsible"

const RELEASE_NOTE =
  "This release moves invoices to a new page with search and filters. Exports now include the tax number on every line. Team owners can set a default billing contact, and that person receives every receipt. We also fixed the rounding error on yearly plans, and refunded the affected accounts automatically. Nothing changes for your existing integrations, and the old invoice links keep working until the end of next year."

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function PlainExample() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
      <CollapsibleContent>Rate limits and retry behaviour for this webhook. The defaults suit most teams.</CollapsibleContent>
    </Collapsible>
  )
}

function CardExample() {
  return (
    <Collapsible variant="card" defaultOpen>
      <CollapsibleTrigger>Billing details</CollapsibleTrigger>
      <CollapsibleContent>Paid by card ending 4242. The next invoice goes out on the first of the month.</CollapsibleContent>
    </Collapsible>
  )
}

function FadeExample({ effect }: { effect?: "spring" }) {
  return (
    <Collapsible variant="fade" effect={effect}>
      <CollapsibleContent>{RELEASE_NOTE}</CollapsibleContent>
      <CollapsibleTrigger />
    </Collapsible>
  )
}

function InlineExample() {
  return (
    <div>
      <p className="text-sm font-medium">Total due: 48.00</p>
      <Collapsible variant="inline">
        <CollapsibleTrigger>Why this amount?</CollapsibleTrigger>
        <CollapsibleContent>Four seats at 12.00 each. Tax is added at checkout.</CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function SpringExample() {
  return (
    <Collapsible variant="card" effect="spring">
      <CollapsibleTrigger>Delivery estimate</CollapsibleTrigger>
      <CollapsibleContent>Two to three working days. Click again before it settles and it turns around from where it is.</CollapsibleContent>
    </Collapsible>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <PlainExample />
      </Cell>
      <Cell label="card">
        <CardExample />
      </Cell>
      <Cell label="fade">
        <FadeExample />
      </Cell>
      <Cell label="inline">
        <InlineExample />
      </Cell>
      <Cell label="spring effect">
        <SpringExample />
      </Cell>
      <Cell label="spring effect on fade">
        <FadeExample effect="spring" />
      </Cell>
    </div>
  )
}
