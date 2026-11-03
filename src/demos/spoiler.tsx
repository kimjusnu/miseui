import type * as React from "react"
import { Spoiler } from "@/registry/miseui/ui/spoiler"

const ENDING = "The letter in the first chapter was written by the narrator, and the whole trial was staged to find out who would lie for her."

const REVIEW =
  "We moved a team of forty onto it during a release week, which everyone told us not to do. Setup took an afternoon. The first thing people noticed was that search finally found old threads, and by Friday nobody asked where anything had gone. The export is the one weak spot: it works, but it drops the formatting from tables, so we keep a small script around to fix that. Support answered within the hour every time we wrote, and twice they sent a patch the same day. We renewed for three years in March."

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="blur">
        <Spoiler label="Show the ending">
          <p className="text-sm leading-6">{ENDING}</p>
        </Spoiler>
      </Cell>
      <Cell label="block">
        <Spoiler variant="block" label="Contains plot details, show anyway">
          <p className="text-sm leading-6">{ENDING}</p>
        </Spoiler>
      </Cell>
      <Cell label="inline">
        <p className="text-sm leading-6">
          The final went to extra time, and <Spoiler variant="inline" label="Show the winner">Team Harbor took it by two points</Spoiler> in front of a full house.
        </p>
      </Cell>
      <Cell label="more">
        <Spoiler variant="more" className="text-sm leading-6">
          {REVIEW}
        </Spoiler>
      </Cell>
      <Cell label="blur effect, clears in a spring">
        <Spoiler effect="blur" label="Show the ending">
          <p className="text-sm leading-6">{ENDING}</p>
        </Spoiler>
      </Cell>
      <Cell label="blur effect, more eases its height">
        <Spoiler variant="more" effect="blur" className="text-sm leading-6">
          {REVIEW}
        </Spoiler>
      </Cell>
    </div>
  )
}
