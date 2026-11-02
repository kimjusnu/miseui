import type * as React from "react"
import { Heart, Star } from "lucide-react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type RatingVariant = "stars" | "hearts" | "numeric" | "bar"
type RatingStep = 1 | 0.5
type GlyphFill = 0 | 0.5 | 1

const POP_FROM_SCALE = 0.7

/** Every value someone can pick, lowest first. */
function ratingSteps(max: number, step: RatingStep) {
  const count = Math.round(max / step)
  return Array.from({ length: count }, (_, index) => (index + 1) * step)
}

/** How much of the glyph at this 1-based position a value covers. */
function glyphFill(position: number, value: number): GlyphFill {
  if (value >= position) return 1
  return value >= position - 0.5 ? 0.5 : 0
}

const defaultItemLabel = (value: number, max: number) => `${value} out of ${max}`

const GLYPH: Record<"stars" | "hearts", typeof Star> = { stars: Star, hearts: Heart }
const GLYPH_CELL_CLASS: Record<"stars" | "hearts", string> = {
  stars: "size-7 pointer-coarse:size-10",
  hearts: "size-9 pointer-coarse:size-10",
}
const GLYPH_ICON_CLASS: Record<"stars" | "hearts", string> = {
  stars: "size-5",
  hearts: "size-6",
}

/** Logical clip, so half a star fills from the reading side in a right-to-left page too. */
const HALF_CLIP = "[clip-path:inset(0_50%_0_0)] rtl:[clip-path:inset(0_0_0_50%)]"

interface GlyphProps {
  variant: "stars" | "hearts"
  fill: GlyphFill
}

function Glyph({ variant, fill }: GlyphProps) {
  const Icon = GLYPH[variant]
  return (
    <span aria-hidden="true" data-slot="rating-glyph" data-fill={fill} className="relative block">
      <Icon className={cn("block text-muted-foreground/40", GLYPH_ICON_CLASS[variant])} strokeWidth={1.5} />
      {fill > 0 ? (
        <span className={cn("absolute inset-0 text-mise", fill === 0.5 && HALF_CLIP)}>
          <Icon className={cn("block fill-current", GLYPH_ICON_CLASS[variant])} strokeWidth={1.5} />
        </span>
      ) : null}
    </span>
  )
}

/** Remounted by a new key on each pick, which replays the pop. Nothing renders it until the first pick. */
function Pop({ pulse, children }: { pulse: number; children: React.ReactNode }) {
  return (
    <motion.span
      key={pulse}
      data-slot="rating-pop"
      className="block"
      initial={{ scale: POP_FROM_SCALE }}
      animate={{ scale: 1 }}
      transition={SPRING_DEFAULT}
    >
      {children}
    </motion.span>
  )
}

const ROOT_CLASS: Record<RatingVariant, string> = {
  stars: "inline-flex items-center",
  hearts: "inline-flex items-center gap-1",
  numeric: "grid w-full min-w-0 auto-cols-fr grid-flow-col divide-x rounded-md border",
  bar: "flex w-full min-w-0 items-center gap-3",
}

const FOCUS_CLASS = "outline-none focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/50"

export {
  FOCUS_CLASS,
  GLYPH_CELL_CLASS,
  Glyph,
  Pop,
  ROOT_CLASS,
  defaultItemLabel,
  glyphFill,
  ratingSteps,
  type GlyphFill,
  type RatingStep,
  type RatingVariant,
}
