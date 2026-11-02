import type { ReactNode } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Separator } from "@/registry/miseui/ui/separator"

function Design({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Row({ name, value, strong = false }: { name: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between text-sm font-medium" : "flex justify-between text-[13px] text-muted-foreground"}>
      <span>{name}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function Receipt() {
  return (
    <div className="grid gap-2">
      <Row name="Design seat" value="$24.00" />
      <Row name="Storage, 40 GB" value="$6.00" />
      <Separator variant="dashed" className="my-1" />
      <Row name="Total" value="$30.00" strong />
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Design label="line">
        <div className="grid gap-3 text-sm">
          <p>Email notifications</p>
          <Separator />
          <p>Billing history</p>
          <Separator />
          <p>Connected devices</p>
        </div>
      </Design>
      <Design label="dashed">
        <Receipt />
      </Design>
      <Design label="label">
        <div className="grid gap-4">
          <Button variant="outline" className="w-full">
            Continue with SSO
          </Button>
          <Separator variant="label">Or continue with email</Separator>
          <Separator variant="label" align="start">
            Yesterday
          </Separator>
        </div>
      </Design>
      <Design label="gradient">
        <div className="grid gap-4 text-sm">
          <p className="text-muted-foreground">Built for teams who ship every week.</p>
          <Separator variant="gradient" />
          <p className="text-muted-foreground">Trusted with 40 million requests a day.</p>
        </div>
      </Design>
      <Design label="vertical, inline">
        <div className="flex h-8 flex-wrap items-center gap-3 text-sm">
          <span>Docs</span>
          <Separator orientation="vertical" />
          <span>Pricing</span>
          <Separator orientation="vertical" variant="dashed" />
          <span>Changelog</span>
        </div>
      </Design>
    </div>
  )
}
