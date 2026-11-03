import type * as React from "react"
import { motion, useTransform, type MotionValue } from "motion/react"
import { ringDim, ringFacing, ringLabelOpacity, ringStep } from "@/registry/miseui/ui/ring-gallery-state"
import { cn } from "@/registry/miseui/lib/utils"

export type RingGalleryVariant = "ring" | "medallion" | "cylinder"

export interface RingGalleryEntry {
  id: string
  label: string
  /** Shown under the ring while this item is at the front. */
  detail?: React.ReactNode
  /** An image or icon. Fill the box; the shape comes from the variant. */
  media?: React.ReactNode
}

export const RING_SHAPE: Record<RingGalleryVariant, { ratio: number; tilt: number; direction: 1 | -1; maxItem: number; fill: number }> = {
  ring: { ratio: 1.25, tilt: -8, direction: 1, maxItem: 168, fill: 1 },
  medallion: { ratio: 1, tilt: -14, direction: 1, maxItem: 136, fill: 1 },
  // The viewer stands inside, so the far wall is what they see and the order has to run the other way to read left to right.
  cylinder: { ratio: 1.4, tilt: 0, direction: -1, maxItem: 208, fill: 1.35 },
}

interface RingItemProps {
  entry: RingGalleryEntry
  optionId: string
  index: number
  count: number
  turn: MotionValue<number>
  variant: RingGalleryVariant
  selected: boolean
  onPick: (index: number) => void
}

function ItemText({ label, className, opacity }: { label: string; className?: string; opacity?: MotionValue<number> }) {
  return <motion.span className={cn("line-clamp-2 text-[13px] leading-tight font-medium", className)} style={{ opacity }}>{label}</motion.span>
}

function RingFace({ entry, labelOpacity }: { entry: RingGalleryEntry; labelOpacity: MotionValue<number> }) {
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border bg-card p-2 text-center text-card-foreground backface-hidden">
      {entry.media ? <span className="flex min-h-0 items-center justify-center">{entry.media}</span> : null}
      <ItemText label={entry.label} opacity={labelOpacity} />
    </span>
  )
}

function MedallionFace({ entry, selected }: { entry: RingGalleryEntry; selected: boolean }) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border bg-card text-card-foreground",
        selected && "border-foreground/40",
      )}
    >
      {entry.media ?? <ItemText label={entry.label} className="px-2 text-center" />}
    </span>
  )
}

function CylinderFace({ entry, labelOpacity }: { entry: RingGalleryEntry; labelOpacity: MotionValue<number> }) {
  return (
    <span className="absolute inset-0 flex flex-col justify-between gap-2 overflow-hidden rounded-lg border bg-muted p-3 text-foreground backface-hidden">
      <span className="flex min-h-0 flex-1 items-center justify-center">{entry.media}</span>
      <ItemText label={entry.label} opacity={labelOpacity} />
    </span>
  )
}

export function RingItem({ entry, optionId, index, count, turn, variant, selected, onPick }: RingItemProps) {
  const { direction } = RING_SHAPE[variant]
  const angle = direction * index * ringStep(count)
  const dim = useTransform(turn, (value) => ringDim(ringFacing(value, index, count)))
  const labelOpacity = useTransform(turn, (value) => ringLabelOpacity(ringFacing(value, index, count)))
  // A medallion cancels the ring's rotation so its face keeps looking at the viewer, wherever it is on the ring.
  const counter = useTransform(turn, (value) => `rotateY(${-direction * (index - value) * ringStep(count)}deg)`)
  const place = variant === "cylinder"
    ? `rotateY(${angle}deg) translateZ(calc(var(--ring-radius) * -1))`
    : `rotateY(${angle}deg) translateZ(var(--ring-radius))`
  return (
    <div
      id={optionId}
      role="option"
      aria-selected={selected}
      aria-label={entry.label}
      data-slot="ring-gallery-item"
      onClick={() => onPick(index)}
      className="absolute cursor-pointer transform-3d"
      style={{
        width: "var(--ring-item)",
        height: "var(--ring-item-height)",
        left: "calc(var(--ring-item) / -2)",
        top: "calc(var(--ring-item-height) / -2)",
        transform: place,
      }}
    >
      <motion.span className="absolute inset-0 block transform-3d" style={variant === "medallion" ? { transform: counter } : undefined}>
        {variant === "ring" ? <RingFace entry={entry} labelOpacity={labelOpacity} /> : null}
        {variant === "medallion" ? <MedallionFace entry={entry} selected={selected} /> : null}
        {variant === "cylinder" ? <CylinderFace entry={entry} labelOpacity={labelOpacity} /> : null}
        {/* A lid rather than opacity on the item: opacity below 1 would flatten this 3D subtree. */}
        <motion.span
          aria-hidden="true"
          data-slot="ring-gallery-dim"
          className={cn(
            "pointer-events-none absolute inset-0 bg-background backface-hidden",
            variant === "medallion" && "rounded-full",
            variant === "ring" && "rounded-xl",
            variant === "cylinder" && "rounded-lg",
          )}
          style={{ opacity: dim }}
        />
        {variant === "ring" ? (
          <span data-slot="ring-gallery-back" aria-hidden="true" className="absolute inset-0 rounded-xl border bg-muted backface-hidden [transform:rotateY(180deg)]" />
        ) : null}
      </motion.span>
    </div>
  )
}
