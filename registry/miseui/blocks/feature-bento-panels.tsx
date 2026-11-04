import type * as React from "react"
import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { Button } from "@/registry/miseui/ui/button"
import { Card } from "@/registry/miseui/ui/card"
import { GooeyMorph } from "@/registry/miseui/ui/gooey-morph"
import { Input } from "@/registry/miseui/ui/input"
import type { BentoFeature } from "./feature-bento-grid"

/** Everything but the beam reads the accent from this, so the panels stay neutral and the beam stays the one accent. */
const NEUTRAL_ACCENT = { "--mise": "var(--foreground)" } as React.CSSProperties
const SURFACE_CLASS = "w-full max-w-md gap-4 rounded-2xl bg-background p-4 shadow-none @2xl:p-6 dark:bg-muted"

const OWNERS = [
  { owner: "Priya", task: "Send the revised tiers to sales" },
  { owner: "Tomas", task: "Draft the customer email" },
  { owner: "Wen", task: "Brief support on the January move" },
] as const

const SPEAKERS = [
  { id: "priya", label: "Priya" },
  { id: "tomas", label: "Tomas" },
  { id: "wen", label: "Wen" },
  { id: "ada", label: "Ada" },
  { id: "noor", label: "Noor" },
]

const DESTINATIONS = [
  { id: "email", label: "Email", target: "5 people" },
  { id: "chat", label: "Chat", target: "#pricing" },
  { id: "tracker", label: "Tracker", target: "3 tasks" },
] as const

const THREADS = [
  { speaker: "Priya", point: "Drop the $9 tier." },
  { speaker: "Tomas", point: "Move people to Starter in January." },
  { speaker: "Wen", point: "Tell support first." },
] as const

const MERGED_RECORD = "Drop the $9 tier, move people to Starter in January, and tell support first."
const DOT_PX = 24
const DOT_GAP_PX = 16

function SummaryPanel() {
  return (
    <Card effect="beam" className={SURFACE_CLASS}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span>Pricing review</span>
        <span className="text-muted-foreground">Finished 2 min after the call</span>
      </div>
      <ul className="flex flex-col divide-y border-t">
        {OWNERS.map((item) => (
          <li key={item.owner} className="flex items-center gap-3 py-2 text-[13px] leading-relaxed">
            <Badge variant="secondary" className="font-normal">
              {item.owner}
            </Badge>
            <span className="min-w-0 flex-1 text-pretty">{item.task}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Read-only on purpose: this is the shape of the feature, and the block does not ship a search backend. */
function AskPanel() {
  return (
    <Card className={SURFACE_CLASS}>
      <Input readOnly tabIndex={-1} aria-label="Question asked of the call" value="Who said January?" className="bg-transparent" />
      <blockquote className="flex flex-col gap-2 border-t pt-4">
        <p className="text-[15px] leading-relaxed text-pretty">We move everyone to Starter in January, not before.</p>
        <footer className="text-[13px] text-muted-foreground">Priya, at 14:02</footer>
      </blockquote>
    </Card>
  )
}

/** Moves only when pressed: the merge is the point of the feature, so the person makes it happen. */
function ThreadsPanel() {
  const [merged, setMerged] = useState(false)
  return (
    <Card className={SURFACE_CLASS} style={NEUTRAL_ACCENT}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <GooeyMorph items={SPEAKERS} merged={merged} size={DOT_PX} gap={DOT_GAP_PX} />
        <Button variant="outline" aria-pressed={merged} onClick={() => setMerged((current) => !current)} className="pointer-coarse:h-10">
          {merged ? "Split by speaker" : "Merge the threads"}
        </Button>
      </div>
      {merged ? (
        <p data-testid="merged-record" className="border-t pt-4 text-[15px] leading-relaxed text-pretty">
          {MERGED_RECORD}
        </p>
      ) : (
        <ul className="flex flex-col gap-2 border-t pt-4 text-[13px] leading-relaxed">
          {THREADS.map((thread) => (
            <li key={thread.speaker} className="text-pretty">
              <span className="font-medium">{thread.speaker}</span> <span className="text-muted-foreground">{thread.point}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function SendPanel() {
  const [sent, setSent] = useState(false)
  return (
    <Card className={SURFACE_CLASS}>
      <ul className="flex flex-col divide-y">
        {DESTINATIONS.map((destination) => (
          <li key={destination.id} className="flex items-center justify-between gap-3 py-2 text-[13px] leading-relaxed">
            <span>{destination.label}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              {destination.target}
              {sent ? <Check aria-label="Delivered" className="size-4 text-foreground" /> : null}
            </span>
          </li>
        ))}
      </ul>
      <Button disabled={sent} onClick={() => setSent(true)} className="w-full pointer-coarse:h-10">
        {sent ? "Sent to all three" : "Send the summary"}
      </Button>
    </Card>
  )
}

const AFTER_THE_CALL: BentoFeature = {
  id: "after-the-call",
  title: "Keeps working after you hang up.",
  description: "The summary is finished by the time you are back at your desk, with no tab left open.",
  visual: <SummaryPanel />,
}
const ASK: BentoFeature = {
  id: "ask",
  title: "Ask the call anything.",
  description: "You get the quote and the minute it was said.",
  visual: <AskPanel />,
}
const THREADS_FEATURE: BentoFeature = {
  id: "threads",
  title: "Five voices, one page.",
  description: "Everyone's points merge into one record, and split back by speaker when you need to check who said it.",
  visual: <ThreadsPanel />,
}
const SEND: BentoFeature = {
  id: "send",
  title: "Goes where the team already reads.",
  description: "Email, chat or your tracker, whichever people actually open.",
  visual: <SendPanel />,
}

const ROW_FEATURES: readonly BentoFeature[] = [AFTER_THE_CALL, ASK, SEND]
const TAB_FEATURES: readonly BentoFeature[] = [AFTER_THE_CALL, ASK, THREADS_FEATURE, SEND]

/** The rounded grey ground a picture sits on, so a small product piece reads as placed and not as lost in white. */
function PanelPlate({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex min-h-72 min-w-0 items-center justify-center rounded-2xl bg-muted p-4 @md:p-8 dark:bg-card", className)}>{children}</div>
}

export { PanelPlate, ROW_FEATURES, TAB_FEATURES }
