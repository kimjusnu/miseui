import type * as React from "react"
import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Field, type FieldEffect } from "@/registry/miseui/ui/field"
import { Input } from "@/registry/miseui/ui/input"
import { Switch } from "@/registry/miseui/ui/switch"

const EFFECTS: readonly FieldEffect[] = ["shake-error", "materialize"]

function Labelled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function EffectDemo({ effect }: { effect: FieldEffect }) {
  const [email, setEmail] = useState("hana@")
  const [submitted, setSubmitted] = useState(false)
  const error = submitted && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a full address, like hana@studio.com." : undefined
  return (
    <form
      noValidate
      className="grid min-w-0 gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
    >
      <Field label="Work email" effect={effect} error={error} required>
        <Input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setSubmitted(false)
          }}
        />
      </Field>
      <Button type="submit" size="sm" variant="outline" className="justify-self-start">
        Check address
      </Button>
    </form>
  )
}

export function Demo() {
  return (
    <div className="grid w-full max-w-lg min-w-0 gap-6">
      <Labelled title="stacked">
        <Field label="Display name" description="Shown on your invoices." required>
          <Input defaultValue="Hana Lim" />
        </Field>
      </Labelled>
      <Labelled title="inline, stacks by itself in a narrow column">
        <Field variant="inline" label="Company" description="Leave empty if you work alone.">
          <Input placeholder="Northwind Studio" />
        </Field>
      </Labelled>
      <Labelled title="floating">
        <Field variant="floating" label="Email address" description="The label moves up as you type.">
          <Input type="email" />
        </Field>
      </Labelled>
      <Labelled title="card">
        <Field variant="card" label="Weekly digest" description="A short summary every Monday morning.">
          <Switch defaultChecked />
        </Field>
      </Labelled>
      <Labelled title="error state">
        <Field label="Card number" error="This card has expired.">
          <Input defaultValue="4242 4242 4242 4242" />
        </Field>
      </Labelled>
      {EFFECTS.map((effect) => (
        <Labelled key={effect} title={`${effect} effect`}>
          <EffectDemo effect={effect} />
        </Labelled>
      ))}
    </div>
  )
}
