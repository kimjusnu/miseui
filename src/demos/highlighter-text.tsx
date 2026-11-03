import type * as React from "react"
import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { HighlighterGroup, HighlighterText } from "@/registry/miseui/ui/highlighter-text"

const BODY_CLASS = "text-[15px] leading-7"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
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
        <Cell label="marker">
          <p className={BODY_CLASS}>
            Your refund goes back to the original card, and <HighlighterText>it lands within five working days of the return</HighlighterText>, wherever you bought it.
          </p>
        </Cell>
        <Cell label="underline">
          <p className={BODY_CLASS}>
            Every plan includes <HighlighterText variant="underline">unlimited projects and shared workspaces for the whole team</HighlighterText>, with no charge per seat.
          </p>
        </Cell>
        <Cell label="sketch">
          <p className={BODY_CLASS}>
            People read the first screen and decide. So <HighlighterText variant="sketch">say what it does before saying how it works</HighlighterText>, and stop there.
          </p>
        </Cell>
        <Cell label="box">
          <p className={BODY_CLASS}>
            Starting costs <HighlighterText variant="box">nothing</HighlighterText> and you can leave <HighlighterText variant="box">at any point in the first thirty days</HighlighterText> with your data.
          </p>
        </Cell>
        <Cell label="sequence effect, one after another">
          <HighlighterGroup className={BODY_CLASS}>
            Keep the <HighlighterText>first screen short</HighlighterText>, ask for <HighlighterText variant="underline">one decision</HighlighterText>, and show <HighlighterText variant="sketch">what happens next</HighlighterText> before anyone has to ask.
          </HighlighterGroup>
        </Cell>
      </div>
    </div>
  )
}
