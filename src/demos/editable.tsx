import type * as React from "react"
import { Editable } from "@/registry/miseui/ui/editable"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function requireName(value: string) {
  return value.trim() ? undefined : "A project needs a name."
}

export function Demo() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
      <Cell label="text, in a sentence of its own">
        <Editable label="Project name" defaultValue="Spring launch" validate={requireName} />
      </Cell>
      <Cell label="heading">
        <Editable label="Page title" variant="heading" defaultValue="Quarterly planning notes" />
      </Cell>
      <Cell label="area, Mod+Enter or the button saves">
        <Editable
          label="Description"
          variant="area"
          defaultValue={"Ships with the April release.\nNeeds sign-off from finance."}
          selectOnEdit={false}
        />
      </Cell>
      <Cell label="field, boxed on hover">
        <Editable label="Billing email" variant="field" defaultValue="billing@northwind.studio" />
      </Cell>
      <Cell label="materialize effect, leaving reverts">
        <Editable label="Billing address" variant="field" effect="materialize" blurAction="revert" defaultValue="12 Harbour Road, Busan" />
      </Cell>
      <Cell label="empty and disabled">
        <div className="grid gap-2">
          <Editable label="Nickname" placeholder="Add a nickname" />
          <Editable label="Plan" defaultValue="Team, renews in May" disabled />
        </div>
      </Cell>
    </div>
  )
}
