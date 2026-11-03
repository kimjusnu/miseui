import type * as React from "react"
import { useState } from "react"
import { Timer } from "@/registry/miseui/ui/timer"

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS
const LAUNCH_IN_MS = 3 * DAY_MS + 4 * 60 * MINUTE_MS

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  // Fixed once per visit, so the demo counts to a real moment rather than restarting on every render.
  const [launch] = useState(() => new Date(Date.now() + LAUNCH_IN_MS))
  const [buildStart] = useState(() => new Date(Date.now() - 2 * MINUTE_MS - 14000))
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain, a focus session">
        <Timer duration={25 * MINUTE_MS} controls />
      </Cell>
      <Cell label="boxes, to a launch date">
        <Timer target={launch} variant="boxes" />
      </Cell>
      <Cell label="compact, counting up from a start">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Build #482</span>
          <Timer mode="up" target={buildStart} variant="compact" />
        </div>
      </Cell>
      <Cell label="ring, a rest between sets">
        <Timer duration={90 * 1000} variant="ring" controls />
      </Cell>
      <Cell label="roll effect, plain">
        <Timer duration={10 * MINUTE_MS} effect="roll" controls />
      </Cell>
      <Cell label="roll effect, boxes">
        <Timer target={launch} variant="boxes" effect="roll" />
      </Cell>
    </div>
  )
}
