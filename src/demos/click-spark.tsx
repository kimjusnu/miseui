import type * as React from "react"
import { useState } from "react"
import { Bookmark, Check, Heart } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { ClickSpark } from "@/registry/miseui/ui/click-spark"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {/* Room for the burst, so the first press does not reach the label above. */}
      <div className="grid min-h-32 min-w-0 place-items-center rounded-lg border bg-card p-4">{children}</div>
    </div>
  )
}

function LikeButton() {
  const [likes, setLikes] = useState(41)
  return (
    <ClickSpark variant="spark" className="w-fit">
      <Button variant="outline" onClick={() => setLikes(likes + 1)}>
        <Heart aria-hidden="true" />
        <span className="tabular-nums">{likes}</span>
      </Button>
    </ClickSpark>
  )
}

function SaveButton() {
  const [saved, setSaved] = useState(false)
  return (
    <ClickSpark variant="dots" className="w-fit">
      <Button variant="outline" aria-pressed={saved} onClick={() => setSaved(!saved)}>
        <Bookmark aria-hidden="true" className={saved ? "fill-current" : undefined} />
        {saved ? "Saved" : "Save for later"}
      </Button>
    </ClickSpark>
  )
}

function DoneRow() {
  const [done, setDone] = useState(false)
  return (
    <ClickSpark variant="ring" className="w-full">
      <button
        type="button"
        aria-pressed={done}
        onClick={() => setDone(!done)}
        className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-start text-[13px] text-foreground outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className={`grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-border ${done ? "bg-mise text-mise-foreground ring-transparent" : ""}`}>
          {done ? <Check aria-hidden="true" className="size-3.5" /> : null}
        </span>
        Send the invoice to the client
      </button>
    </ClickSpark>
  )
}

function FinishButton({ count }: { count?: number }) {
  const [finished, setFinished] = useState(false)
  return (
    <ClickSpark variant="confetti" count={count} className="w-fit">
      <Button onClick={() => setFinished(true)}>{finished ? "Course finished" : "Finish the course"}</Button>
    </ClickSpark>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="spark: press it, or Tab and press Enter">
        <LikeButton />
      </Cell>
      <Cell label="dots">
        <SaveButton />
      </Cell>
      <Cell label="ring: bursts from where you press the row">
        <DoneRow />
      </Cell>
      <Cell label="confetti">
        <FinishButton />
      </Cell>
      <Cell label="count: fewer pieces for a small moment">
        <ClickSpark variant="spark" count={5} className="w-fit">
          <Button variant="outline">Thanks</Button>
        </ClickSpark>
      </Cell>
      <Cell label="count: more for a big one">
        <FinishButton count={18} />
      </Cell>
    </div>
  )
}
