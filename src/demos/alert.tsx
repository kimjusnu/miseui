import type { ReactNode } from "react"
import { useState } from "react"
import { Alert, AlertAction } from "@/registry/miseui/ui/alert"
import { Button } from "@/registry/miseui/ui/button"

function Design({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="grid gap-2">{children}</div>
    </div>
  )
}

function SoftAlerts() {
  return (
    <Design label="soft, all four tones">
      <Alert title="Sync runs every hour" description="The next one starts at 14:00." />
      <Alert tone="success" title="Backup finished" description="1,204 files copied to the archive." />
      <Alert tone="warning" title="Your token expires tomorrow" action={<AlertAction>Create a new token</AlertAction>} />
      <Alert tone="error" title="Import failed" description="Row 18 has no email address." dismissible />
    </Design>
  )
}

function OutlineAlerts() {
  const upgrade = (
    <Button size="sm" variant="outline">
      Upgrade
    </Button>
  )
  return (
    <Design label="outline">
      <Alert variant="outline" tone="warning" title="Storage almost full" description="You have 2 GB left of 100 GB." action={upgrade} />
      <Alert variant="outline" tone="error" title="Webhook failing" description="Last 12 deliveries returned 500." dismissible />
    </Design>
  )
}

function BannerAlerts() {
  return (
    <Design label="banner">
      <Alert
        variant="banner"
        tone="error"
        title="Payment failed."
        description="Update your card by Friday."
        action={<AlertAction>Update card</AlertAction>}
        dismissible
        className="rounded-md"
      />
      <Alert variant="banner" tone="success" title="You are live." description="The new domain is serving traffic." className="rounded-md" />
      <Alert variant="banner" title="Scheduled maintenance" description="Sunday, 02:00 to 03:00 UTC." dismissible className="rounded-md" />
    </Design>
  )
}

function SideAlerts() {
  return (
    <Design label="side">
      <Alert
        variant="side"
        tone="warning"
        title="This endpoint is deprecated"
        description="It stops responding on 1 March. Move to the v2 route."
        action={<AlertAction>Read the guide</AlertAction>}
      />
      <Alert variant="side" title="Rate limits" description="Each key gets 600 requests a minute." />
    </Design>
  )
}

function MaterializeAlert() {
  const [open, setOpen] = useState(true)
  return (
    <Design label="materialize effect, height springs on dismiss">
      <Alert
        effect="materialize"
        tone="success"
        open={open}
        title="Invite sent to priya@northwind.dev"
        description="They have seven days to accept."
        dismissible
        onDismiss={() => setOpen(false)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
        Team seats: 4 of 10
        <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide alert" : "Send invite"}
        </Button>
      </div>
    </Design>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <SoftAlerts />
      <OutlineAlerts />
      <BannerAlerts />
      <SideAlerts />
      <MaterializeAlert />
    </div>
  )
}
