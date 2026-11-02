import type * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import {
  FOCUS_CLASS,
  GLYPH_CELL_CLASS,
  Glyph,
  Pop,
  glyphFill,
  ratingSteps,
  type RatingStep,
  type RatingVariant,
} from "@/registry/miseui/ui/rating-parts"
import { cn } from "@/registry/miseui/lib/utils"

interface RatingShared {
  variant: RatingVariant
  max: number
  step: RatingStep
  /** What to draw: the hovered value while previewing. */
  shown: number
  /** What is actually chosen. The pop stays on this, or moving the pointer would replay it on every mark. */
  picked: number
  pulse: number
  labelFor: (value: number, max: number) => string
  /** Null when read-only: the marks are drawn, but there is nothing to focus or press. */
  onPreview: ((value: number) => void) | null
}

type ItemProps = RatingShared & { value: number; className: string; children?: React.ReactNode }

function RatingItem({ value, max, labelFor, onPreview, className, children }: ItemProps) {
  if (!onPreview) return <span className={className}>{children}</span>
  return (
    <RadioGroupPrimitive.Item
      data-slot="rating-item"
      value={String(value)}
      aria-label={labelFor(value, max)}
      className={cn(FOCUS_CLASS, "disabled:cursor-not-allowed", className)}
      // A touch has no hover, and a preview set by one would stick until the next touch elsewhere.
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") onPreview(value)
      }}
    >
      {children}
    </RadioGroupPrimitive.Item>
  )
}

function GlyphRow(shared: RatingShared & { variant: "stars" | "hearts" }) {
  const { variant, max, step, shown, picked, pulse } = shared
  const poppedPosition = Math.ceil(picked)
  return ratingSteps(max, 1).map((position) => {
    const glyph = <Glyph variant={variant} fill={glyphFill(position, shown)} />
    const interactive = shared.onPreview !== null
    return (
      <span key={position} className={cn("relative flex items-center justify-center", GLYPH_CELL_CLASS[variant])}>
        {pulse > 0 && position === poppedPosition ? <Pop pulse={pulse}>{glyph}</Pop> : glyph}
        {interactive && step === 0.5 ? (
          <RatingItem {...shared} value={position - 0.5} className="absolute inset-y-0 start-0 w-1/2 rounded-s-sm" />
        ) : null}
        {interactive ? (
          <RatingItem
            {...shared}
            value={position}
            className={step === 0.5 ? "absolute inset-y-0 end-0 w-1/2 rounded-e-sm" : "absolute inset-0 rounded-sm"}
          />
        ) : null}
      </span>
    )
  })
}

function NumberRow(shared: RatingShared) {
  const { max, shown, picked, pulse } = shared
  return ratingSteps(max, 1).map((value) => {
    const active = shown === value
    return (
      <RatingItem
        key={value}
        {...shared}
        value={value}
        className={cn(
          "relative flex h-9 min-w-0 items-center justify-center text-sm tabular-nums pointer-coarse:h-10",
          "transition-colors duration-(--duration-fast) ease-(--ease-mise) first:rounded-l-md last:rounded-r-md",
          active ? "bg-mise text-mise-foreground" : "text-muted-foreground",
        )}
      >
        {value === picked && pulse > 0 ? <Pop pulse={pulse}>{value}</Pop> : value}
      </RatingItem>
    )
  })
}

function BarRow(shared: RatingShared) {
  const { max, step, shown } = shared
  return (
    <span className="grid min-w-0 flex-1 auto-cols-fr grid-flow-col gap-1">
      {ratingSteps(max, step).map((value) => (
        <RatingItem key={value} {...shared} value={value} className="relative block h-7 min-w-0 rounded-sm pointer-coarse:h-10">
          <span
            aria-hidden="true"
            data-slot="rating-segment"
            data-filled={shown >= value ? "true" : "false"}
            className={cn(
              "absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-colors duration-(--duration-fast) ease-(--ease-mise)",
              shown >= value ? "bg-mise" : "bg-muted",
            )}
          />
        </RatingItem>
      ))}
    </span>
  )
}

function RatingMarks(shared: RatingShared) {
  const { variant } = shared
  if (variant === "numeric") return <NumberRow {...shared} />
  if (variant === "bar") return <BarRow {...shared} />
  return <GlyphRow {...shared} variant={variant} />
}

export { RatingMarks, type RatingShared }
