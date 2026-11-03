import type * as React from "react"
import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { TypewriterText } from "@/registry/miseui/ui/typewriter-text"

const HEADLINE_CLASS = "block text-[clamp(20px,7cqi,24px)] leading-snug font-semibold tracking-tight"

const ASK = ["Summarise last week's invoices", "Find the contract with Hana Park", "Draft a reply to the late payment"]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  const [run, setRun] = useState(0)
  return (
    <div className="grid gap-8">
      <div>
        <Button variant="outline" size="sm" onClick={() => setRun(run + 1)}>
          <RotateCcw aria-hidden="true" />
          Play again
        </Button>
      </div>
      <div key={run} className="grid gap-8 sm:grid-cols-2">
        <Cell label="line">
          <TypewriterText as="h3" text="Your notes, written while you were in the meeting." className={HEADLINE_CLASS} />
        </Cell>
        <Cell label="block">
          <TypewriterText text="pnpm add motion" variant="block" className="text-sm" />
        </Cell>
        <Cell label="underscore">
          <TypewriterText as="h3" text="Fewer tabs. Clearer days." variant="underscore" className={HEADLINE_CLASS} />
        </Cell>
        <Cell label="field">
          <TypewriterText text="Ask about your invoices" variant="field" />
        </Cell>
        <Cell label="loop effect, hover or focus to hold">
          <TypewriterText variant="field" effect="loop" phrases={ASK} />
        </Cell>
        <Cell label="loop effect, line">
          <TypewriterText as="p" effect="loop" phrases={["Plan the week", "Book the room", "Send the recap"]} className="text-sm font-medium" />
        </Cell>
      </div>
    </div>
  )
}
