import type * as React from "react"
import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { Button } from "@/registry/miseui/ui/button"
import { Card, CardContent } from "@/registry/miseui/ui/card"
import { GooeyMorph } from "@/registry/miseui/ui/gooey-morph"
import { Input } from "@/registry/miseui/ui/input"
import { Materialize } from "@/registry/miseui/ui/materialize"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import { ThinkingOrb } from "@/registry/miseui/ui/thinking-orb"

/**
 * The accent lives in one place on this grid, the beam. Every other visual reads it from a variable, so
 * pointing the variable at the ink makes them neutral in all palettes and in both themes.
 */
const NEUTRAL_ACCENT = { "--mise": "var(--foreground)" } as React.CSSProperties

/** Where WebGL2 is missing the button paints --mise, which here would add a second accent. Silver keeps it neutral. */
const SILVER_METAL = { "--mise": "oklch(0.86 0.005 270)" } as React.CSSProperties

/** A small real control lying over a card. Tinted from the ink, and off in dark mode, where it would read as a glow. */
const CHIP_CLASS =
  "gap-2 bg-popover px-3 py-1 text-[13px] font-normal shadow-[0_8px_16px_-8px_color-mix(in_oklab,var(--foreground)_24%,transparent)] dark:shadow-none"

const SPEAKERS = [
  { id: "priya", label: "Priya" },
  { id: "tomas", label: "Tomas" },
  { id: "wen", label: "Wen" },
  { id: "ada", label: "Ada" },
  { id: "noor", label: "Noor" },
]

const DOT_PX = 24
const DOT_GAP_PX = 16
const ORB_PX = 56

/** A decisions card peeks from behind the working card, and a status chip lies over its corner. */
function BeamVisual() {
  return (
    <div className="relative isolate w-full pt-8 pb-4">
      <Card
        aria-hidden="true"
        data-testid="bento-back-card"
        className="absolute top-0 right-8 -z-10 h-20 w-1/2 flex-row justify-between gap-3 rounded-2xl bg-muted p-3 text-[13px] text-muted-foreground shadow-none"
      >
        <span>Decisions</span>
        <span>3</span>
      </Card>
      <Card effect="beam" className="w-full gap-3 rounded-2xl bg-card py-4 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 px-4 text-[13px]">
          <ShimmerText>Writing the summary</ShimmerText>
          <span className="shrink-0 text-muted-foreground">Pricing review</span>
        </CardContent>
        <CardContent className="flex items-center gap-2 px-4 pb-4 text-[13px] text-muted-foreground">
          <Check aria-hidden="true" className="size-4 shrink-0" /> Transcribed 38 minutes
        </CardContent>
      </Card>
      <Badge variant="outline" className={cn(CHIP_CLASS, "absolute bottom-0 left-4")}>
        <Check />4 owners found
      </Badge>
    </div>
  )
}

/** Read-only on purpose: this is the shape of the feature, and the block does not ship a search backend. */
function OrbVisual() {
  return (
    <div className="flex w-full flex-col items-center pb-4" style={NEUTRAL_ACCENT}>
      <ThinkingOrb state="thinking" size={ORB_PX} label="Looking through the call" />
      <div className="relative -mt-2 w-full">
        <Input readOnly tabIndex={-1} aria-label="Question asked of the call" value="Who said January?" className="bg-background" />
        <Badge variant="outline" className={cn(CHIP_CLASS, "absolute top-full right-2 -translate-y-1/2")}>
          Priya, 14:02
        </Badge>
      </div>
    </div>
  )
}

/** Moves only when pressed, so it does not count against the cap on effects running at once. */
function MergeVisual() {
  const [merged, setMerged] = useState(false)
  return (
    <div className="relative w-full pt-3" style={NEUTRAL_ACCENT}>
      <Card className="w-full flex-row flex-wrap items-center justify-between gap-4 rounded-2xl p-4 shadow-none">
        <GooeyMorph items={SPEAKERS} merged={merged} size={DOT_PX} gap={DOT_GAP_PX} />
        <Button variant="outline" size="sm" aria-pressed={merged} onClick={() => setMerged((current) => !current)}>
          {merged ? "Split by speaker" : "Merge the threads"}
        </Button>
      </Card>
      <Badge variant="outline" className={cn(CHIP_CLASS, "absolute top-0 right-4")}>
        {merged ? "1 record" : "5 speakers"}
      </Badge>
    </div>
  )
}

function SendVisual() {
  const [sent, setSent] = useState(false)
  return (
    <div className="relative w-full pb-4">
      <Card className="flex-row flex-wrap items-center justify-between gap-4 rounded-2xl bg-background p-3 pl-4 shadow-none">
        <span className="text-[13px] text-muted-foreground">Pricing review summary</span>
        <div style={SILVER_METAL}>
          <Button effect="liquid" onClick={() => setSent(true)}>
            {sent ? "Sent to #pricing" : "Send to #pricing"}
          </Button>
        </div>
      </Card>
      <Materialize show={sent} origin="0% 100%" className="absolute bottom-0 left-4">
        <Badge variant="outline" className={CHIP_CLASS}>
          <Check />
          Delivered to 5 people
        </Badge>
      </Materialize>
    </div>
  )
}

export { BeamVisual, MergeVisual, OrbVisual, SendVisual }
