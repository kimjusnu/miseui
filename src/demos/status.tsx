import type * as React from "react"
import { useState } from "react"
import { Status, type StatusState } from "@/registry/miseui/ui/status"

const STATES: readonly StatusState[] = ["online", "away", "busy", "offline", "error"]

const PEOPLE: ReadonlyArray<{ name: string; state: StatusState }> = [
  { name: "Mina Park", state: "online" },
  { name: "Theo Grant", state: "away" },
  { name: "Ines Costa", state: "busy" },
  { name: "Sam Okafor", state: "offline" },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Roster() {
  return (
    <ul className="grid gap-2">
      {PEOPLE.map((person) => (
        <li key={person.name} className="flex min-w-0 items-center gap-2 text-sm">
          <Status state={person.state} variant="dot" />
          <span className="truncate">{person.name}</span>
        </li>
      ))}
    </ul>
  )
}

function LiveConnection() {
  const [index, setIndex] = useState(0)
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Status state={STATES[index]} variant="badge" effect="pulse" announce />
      <button
        type="button"
        className="rounded-sm text-[13px] text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:py-2.5"
        onClick={() => setIndex((current) => (current + 1) % STATES.length)}
      >
        Change state
      </button>
    </div>
  )
}

function CustomStates() {
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <Status state="custom" tone="warning" variant="pill">
        Degraded
      </Status>
      <Status state="custom" tone="success" variant="pill">
        Deployed
      </Status>
      <Status state="custom" tone="neutral" variant="pill">
        Draft
      </Status>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="dot, a mark per state with the word kept for screen readers">
        <Roster />
      </Cell>
      <Cell label="badge">
        <div className="flex min-w-0 flex-wrap gap-2">
          {STATES.map((state) => (
            <Status key={state} state={state} variant="badge" />
          ))}
        </div>
      </Cell>
      <Cell label="pill">
        <div className="flex min-w-0 flex-wrap gap-2">
          {STATES.map((state) => (
            <Status key={state} state={state} variant="pill" />
          ))}
        </div>
      </Cell>
      <Cell label="plain, with detail">
        <div className="grid min-w-0 gap-2">
          <Status state="online" detail="since 09:12" />
          <Status state="away" detail="back at 3 pm" />
          <Status state="error" detail="payment webhook" />
        </div>
      </Cell>
      <Cell label="custom states in your own words">
        <CustomStates />
      </Cell>
      <Cell label="pulse effect, only while the state is live">
        <div className="flex min-w-0 flex-wrap gap-2">
          <Status state="custom" tone="danger" variant="pill" effect="pulse" live>
            Recording
          </Status>
          <LiveConnection />
        </div>
      </Cell>
    </div>
  )
}
