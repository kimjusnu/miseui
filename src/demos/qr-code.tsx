import type * as React from "react"
import { useState } from "react"
import { Coffee, RotateCcw } from "lucide-react"
import { QrCode } from "@/registry/miseui/ui/qr-code"
import { Button } from "@/registry/miseui/ui/button"
import { Input } from "@/registry/miseui/ui/input"

const MENU_URL = "https://miseui.junsu4621.workers.dev/menu"
const SIZE_PX = 144

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start justify-items-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Playground() {
  const [value, setValue] = useState("Table 12, two flat whites")
  return (
    <Cell label="plain, type to re-encode">
      <div className="grid w-full min-w-0 gap-3">
        <Input aria-label="Text to encode" value={value} onChange={(event) => setValue(event.target.value)} />
        <QrCode value={value || " "} size={SIZE_PX} label={`QR code for ${value}`} />
      </div>
    </Cell>
  )
}

function Reveal() {
  const [run, setRun] = useState(0)
  return (
    <Cell label="reveal effect">
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        <QrCode key={run} value={MENU_URL} effect="reveal" size={SIZE_PX} label="Open the menu" />
        <Button variant="outline" size="sm" onClick={() => setRun((current) => current + 1)}>
          <RotateCcw />
          Replay
        </Button>
      </div>
    </Cell>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Playground />
      <Cell label="rounded">
        <QrCode value={MENU_URL} variant="rounded" size={SIZE_PX} label="Open the menu" />
      </Cell>
      <Cell label="framed">
        <QrCode value={MENU_URL} variant="framed" caption="Scan for today's menu" size={176} label="Open the menu" />
      </Cell>
      <Cell label="logo, level H">
        <QrCode value={MENU_URL} variant="logo" logo={<Coffee aria-hidden="true" />} size={SIZE_PX} label="Open the menu" />
      </Cell>
      <Reveal />
      <Cell label="too long for a code">
        <QrCode value={"a".repeat(3000)} level="L" size={240} />
      </Cell>
    </div>
  )
}
