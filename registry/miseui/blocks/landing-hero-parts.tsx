import type * as React from "react"
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Check, RotateCcw } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { Button } from "@/registry/miseui/ui/button"
import { Card } from "@/registry/miseui/ui/card"
import { Materialize } from "@/registry/miseui/ui/materialize"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import { StreamingText } from "@/registry/miseui/ui/streaming-text"
import { ThinkingOrb, type OrbState } from "@/registry/miseui/ui/thinking-orb"

type PreviewPhase = "thinking" | "writing" | "done"

/** Long enough to notice the orb working, short enough that nobody waits on a marketing page. */
const THINKING_MS = 1400
const STREAM_CHARS_PER_SECOND = 70
const ROW_STAGGER_SECONDS = 0.08
const ROW_RISE_PX = 8

/** The theme's own hairline, so the grid stays this faint in every palette, and it fades before it reaches an edge. */
const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
  maskImage: "radial-gradient(closest-side, black, transparent)",
}
/** Tinted from the ink, and off in dark mode, where a light-tinted shadow would read as a glow. */
const SOFT_SHADOW_CLASS =
  "shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:shadow-none"

const SUMMARY =
  "The team agreed to drop the $9 tier and move existing customers to Starter in January. Support gets a heads-up before the email goes out."

const ACTION_ITEMS = [
  { owner: "Priya", task: "Send the revised tiers to sales", due: "Thu" },
  { owner: "Tomas", task: "Draft the customer email", due: "Mon" },
  { owner: "Wen", task: "Brief support on the January move", due: "Dec 18" },
] as const

const ORB_BY_PHASE: Record<PreviewPhase, OrbState> = { thinking: "thinking", writing: "speaking", done: "idle" }
const STATUS_BY_PHASE: Record<PreviewPhase, string> = {
  thinking: "Reading the transcript",
  writing: "Writing the summary",
  done: "38 min call, 5 people",
}

function SummaryText({ phase, onDone }: { phase: PreviewPhase; onDone: () => void }) {
  return (
    <p className="grid text-[15px] leading-relaxed text-pretty">
      {/* The full text holds the height from the start, so the card does not grow as words arrive. */}
      <span className={cn("col-start-1 row-start-1", phase !== "done" && "invisible")}>{SUMMARY}</span>
      {phase === "writing" ? (
        // Off: a live region on a marketing page would read the sample aloud, unasked, letter by letter.
        <StreamingText aria-live="off" className="col-start-1 row-start-1" text={SUMMARY} speed={STREAM_CHARS_PER_SECOND} onDone={onDone} />
      ) : null}
    </p>
  )
}

function ActionRows({ done, reduceMotion }: { done: boolean; reduceMotion: boolean }) {
  return (
    <ul className="flex flex-col divide-y border-t">
      {ACTION_ITEMS.map((item, index) => (
        <motion.li
          key={item.owner}
          data-testid="preview-action-item"
          aria-hidden={!done}
          initial={false}
          animate={{ opacity: done ? 1 : 0, y: done || reduceMotion ? 0 : ROW_RISE_PX }}
          transition={reduceMotion ? { duration: 0 } : { ...SPRING_DEFAULT, delay: done ? index * ROW_STAGGER_SECONDS : 0 }}
          className="flex items-center gap-3 py-3 text-[13px] leading-relaxed"
        >
          <Badge variant="secondary" className="font-normal">
            {item.owner}
          </Badge>
          <span className="min-w-0 flex-1 text-pretty">{item.task}</span>
          <span className="shrink-0 text-muted-foreground">{item.due}</span>
        </motion.li>
      ))}
    </ul>
  )
}

/** Plays once, or again on request. It marks a real sequence, so it does not loop for decoration. */
function LandingHeroPreview({ className }: { className?: string }) {
  const reduceMotion = Boolean(useReducedMotion())
  const [played, setPlayed] = useState<PreviewPhase>("thinking")
  const phase = reduceMotion ? "done" : played
  const done = phase === "done"

  useEffect(() => {
    if (phase !== "thinking") return
    const id = window.setTimeout(() => setPlayed("writing"), THINKING_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  return (
    <div data-slot="landing-hero-preview" className={cn("relative isolate pt-12 pb-4", className)}>
      <div aria-hidden="true" data-testid="preview-grid" className="absolute inset-0 -z-10" style={GRID_STYLE} />
      <Card
        aria-hidden="true"
        data-testid="preview-back-card"
        className={cn("absolute top-0 right-4 -z-10 h-24 w-2/3 flex-row justify-between gap-3 rounded-2xl bg-background p-3 text-[13px] text-muted-foreground", SOFT_SHADOW_CLASS)}
      >
        <span>Transcript</span>
        <span>38:12</span>
      </Card>
      <Card className={cn("relative gap-4 rounded-2xl bg-background p-6", SOFT_SHADOW_CLASS)}>
        <div className="flex items-center gap-3">
          <ThinkingOrb state={ORB_BY_PHASE[phase]} size={40} label={STATUS_BY_PHASE[phase]} />
          <div className="min-w-0 flex-1 leading-relaxed">
            <p className="text-[15px]">Weekly pricing review</p>
            <p className="text-[13px] text-muted-foreground">
              {phase === "thinking" ? <ShimmerText>{STATUS_BY_PHASE.thinking}</ShimmerText> : STATUS_BY_PHASE[phase]}
            </p>
          </div>
          {done && !reduceMotion ? (
            <Button variant="ghost" size="icon" aria-label="Replay the summary" onClick={() => setPlayed("thinking")}>
              <RotateCcw />
            </Button>
          ) : null}
        </div>
        <SummaryText phase={phase} onDone={() => setPlayed("done")} />
        <ActionRows done={done} reduceMotion={reduceMotion} />
      </Card>
      <Materialize show={done} origin="0% 100%" className="absolute bottom-0 left-4">
        <Badge variant="outline" className={cn("gap-2 bg-popover px-3 py-1 text-[13px] font-normal", SOFT_SHADOW_CLASS)}>
          <Check />
          Sent to 5 people
        </Badge>
      </Materialize>
    </div>
  )
}

export { LandingHeroPreview }
