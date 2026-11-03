import type * as React from "react"
import { useState } from "react"
import { MaskInput } from "@/registry/miseui/ui/mask-input"

const HEX = { h: { test: (character: string) => /^[0-9a-f]$/i.test(character), transform: (character: string) => character.toUpperCase() } }

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function WithValues() {
  const [values, setValues] = useState({ raw: "5551234", masked: "(555) 123-4" })
  return (
    <div className="grid min-w-0 gap-2">
      <MaskInput mask="phone" aria-label="Phone number" defaultValue={values.raw} onValueChange={(raw, masked) => setValues({ raw, masked })} />
      <dl className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-2 text-[13px] leading-5">
        <dt className="text-muted-foreground">raw</dt>
        <dd className="truncate tabular-nums">{values.raw || " "}</dd>
        <dt className="text-muted-foreground">masked</dt>
        <dd className="truncate tabular-nums">{values.masked || " "}</dd>
      </dl>
    </div>
  )
}

function Code() {
  const [done, setDone] = useState(false)
  return (
    <div className="grid min-w-0 gap-2">
      <MaskInput
        mask="###-###"
        variant="otp-like"
        aria-label="Sign-in code"
        onValueChange={() => setDone(false)}
        onComplete={() => setDone(true)}
      />
      <p aria-live="polite" className="text-[13px] leading-5 text-muted-foreground">
        {done ? "Checking your code" : "Sent to your phone"}
      </p>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain, raw and masked values">
        <WithValues />
      </Cell>
      <Cell label="grouped, one box per group">
        <MaskInput mask="card" variant="grouped" aria-label="Card number" defaultValue="424242" />
      </Cell>
      <Cell label="compact, as wide as the mask">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Due</span>
          <MaskInput mask="date" variant="compact" aria-label="Due date" defaultValue="03112026" />
          <span className="text-muted-foreground">at</span>
          <MaskInput mask="time" variant="compact" aria-label="Due time" />
        </div>
      </Cell>
      <Cell label="otp-like, one box per character">
        <Code />
      </Cell>
      <Cell label="custom tokens, letters and hex">
        <div className="grid min-w-0 gap-2">
          <MaskInput mask="AA-####" aria-label="Plate number" />
          <MaskInput mask="hh:hh:hh" tokens={HEX} aria-label="Colour bytes" />
        </div>
      </Cell>
    </div>
  )
}
