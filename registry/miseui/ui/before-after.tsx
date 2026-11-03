import type * as React from "react"
import { useRef } from "react"
import { motion, useMotionTemplate } from "motion/react"
import { ChevronsLeftRight, ChevronsUpDown } from "lucide-react"
import { MAX_SHARE, MIN_SHARE, shareForKey, type BeforeAfterVariant } from "@/registry/miseui/ui/before-after-geometry"
import { useComparison, useFrameDrag, useSweepOnce, type Comparison } from "@/registry/miseui/ui/before-after-state"
import { cn } from "@/registry/miseui/lib/utils"

type BeforeAfterEffect = "sweep"

const CURSOR: Record<BeforeAfterVariant, string> = { split: "cursor-ew-resize", curtain: "cursor-ns-resize", lens: "cursor-crosshair" }
// The first axis is the one the divider travels on, so the page can still scroll along the other one.
const TOUCH: Record<BeforeAfterVariant, string> = { split: "touch-pan-y", curtain: "touch-pan-x", lens: "touch-pan-y" }

const RAIL: Record<BeforeAfterVariant, string> = {
  split: "inset-y-0 w-px bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.25)]",
  curtain: "inset-x-0 h-px bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.25)]",
  lens: "size-0",
}

type RootAttributes = Omit<React.ComponentProps<"figure">, "children" | "onChange">

interface BeforeAfterProps extends RootAttributes {
  /** The first version: an image with `size-full object-cover`, or any markup. It cannot be interacted with here. */
  before: React.ReactNode
  after: React.ReactNode
  beforeLabel?: string
  afterLabel?: string
  /** Name of the slider for assistive tech. */
  label?: string
  /** `split` a vertical divider, `curtain` a horizontal one, `lens` a round window that follows the pointer. */
  variant?: BeforeAfterVariant
  /** `sweep` moves the divider once when it first comes into view, to show it can be moved. */
  effect?: BeforeAfterEffect
  value?: number
  defaultValue?: number
  onValueChange?: (share: number) => void
  step?: number
  disabled?: boolean
  caption?: React.ReactNode
}

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn("absolute rounded-md bg-background/85 px-2 py-1 text-[13px] leading-none", className)}>{children}</span>
}

interface HandleProps {
  variant: BeforeAfterVariant
  comparison: Comparison
  label: string
  initial: number
  step: number
  disabled: boolean
}

function DividerHandle({ variant, comparison, label, initial, step, disabled }: HandleProps) {
  const { handleRef, share, cross, report, glideTo } = comparison
  const percent = useMotionTemplate`${share}%`
  const crossPercent = useMotionTemplate`${cross}%`
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const next = shareForKey(event.key, share.get(), step)
    if (next === null) return
    event.preventDefault()
    glideTo(next)
    report(next)
  }
  const Icon = variant === "curtain" ? ChevronsUpDown : ChevronsLeftRight
  const place = {
    split: { left: percent },
    curtain: { top: percent },
    lens: { left: percent, top: crossPercent },
  }[variant]
  return (
    <motion.div data-slot="before-after-rail" className={cn("absolute", RAIL[variant])} style={place}>
      <div
        ref={handleRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={MIN_SHARE}
        aria-valuemax={MAX_SHARE}
        aria-valuenow={Math.round(initial)}
        aria-orientation={variant === "curtain" ? "vertical" : "horizontal"}
        aria-disabled={disabled || undefined}
        data-slot="before-after-handle"
        onKeyDown={disabled ? undefined : onKeyDown}
        className={cn(
          "absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          variant === "lens"
            ? "size-[min(144px,56cqw)] shadow-[0_0_0_2px_var(--background),0_0_0_3px_rgb(0_0_0/0.25),0_8px_24px_-8px_rgb(0_0_0/0.5)]"
            : "size-10 border bg-background text-foreground shadow-[0_4px_12px_-4px_rgb(0_0_0/0.5)]",
        )}
      >
        {variant === "lens" ? null : <Icon aria-hidden="true" className="size-4" />}
      </div>
    </motion.div>
  )
}

function BeforeAfter({
  before, after, beforeLabel = "Before", afterLabel = "After", label = "Compare before and after",
  variant = "split", effect, value, defaultValue = 50, onValueChange, step = 5, disabled = false, caption, className, ...props
}: BeforeAfterProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const comparison = useComparison(variant, value, defaultValue, onValueChange)
  const handlers = useFrameDrag(variant, comparison)
  useSweepOnce(frameRef, comparison, effect === "sweep" && !comparison.reduceMotion && !disabled)
  const lens = variant === "lens"
  return (
    <figure
      data-slot="before-after"
      data-variant={variant}
      data-effect={effect}
      className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-2", className)}
      {...props}
    >
      <div
        ref={frameRef}
        data-slot="before-after-frame"
        className={cn("@container relative aspect-[16/10] overflow-hidden rounded-xl border bg-muted select-none", !disabled && [CURSOR[variant], TOUCH[variant]], disabled && "opacity-50")}
        {...(disabled ? undefined : handlers)}
      >
        <div className="pointer-events-none absolute inset-0">
          {lens ? before : after}
          <Chip className={lens ? "top-3 left-3" : "top-3 right-3"}>{lens ? beforeLabel : afterLabel}</Chip>
        </div>
        <motion.div data-slot="before-after-clip" className="pointer-events-none absolute inset-0" style={{ clipPath: comparison.clip }}>
          {lens ? after : before}
          {/* The lens would cut a chip in half with its round edge, and what it shows is obvious once it moves. */}
          {lens ? null : <Chip className="top-3 left-3">{beforeLabel}</Chip>}
        </motion.div>
        <DividerHandle variant={variant} comparison={comparison} label={label} initial={value ?? defaultValue} step={step} disabled={disabled} />
      </div>
      {caption ? <figcaption className="text-[13px] text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  )
}

export { BeforeAfter, type BeforeAfterProps, type BeforeAfterVariant, type BeforeAfterEffect }
