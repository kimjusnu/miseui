import type * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { motion } from "motion/react"
import { thumbCentreOffset, type useRubberStretch } from "@/registry/miseui/ui/slider-parts"
import { cn } from "@/registry/miseui/lib/utils"

type SliderVariant = "plain" | "filled" | "stepped" | "label"

/** Half the rendered thumb width. Radix measures the thumb, so these must match THUMB_CLASS or the fill drifts. */
const HALF_THUMB_PX: Record<SliderVariant, number> = { plain: 10, filled: 12, stepped: 10, label: 10 }

const ROUND_THUMB_CLASS = "block size-5 rounded-full border border-input bg-background shadow-sm dark:bg-foreground"

const THUMB_CLASS: Record<SliderVariant, string> = {
  plain: ROUND_THUMB_CLASS,
  filled: "flex h-8 w-6 items-center justify-center rounded-lg",
  stepped: ROUND_THUMB_CLASS,
  label: ROUND_THUMB_CLASS,
}

const TRACK_CLASS: Record<SliderVariant, string> = {
  plain: "h-1 rounded-full bg-input",
  filled: "h-8 overflow-hidden rounded-lg bg-input/70",
  stepped: "h-1 rounded-full bg-input",
  label: "h-1 rounded-full bg-input",
}

function thumbName(label: string | undefined, index: number, total: number) {
  if (!label || total < 2) return label
  if (index === 0) return `${label}, minimum`
  return index === total - 1 ? `${label}, maximum` : `${label}, ${index + 1} of ${total}`
}

function fillStyle(percents: readonly number[], variant: SliderVariant): React.CSSProperties {
  const halfThumb = HALF_THUMB_PX[variant]
  // A filled track wraps the whole thumb, so its grip always sits on the fill and a stub shows even at zero.
  const pad = variant === "filled" ? halfThumb : 0
  const first = percents[0]
  const last = percents[percents.length - 1]
  const end = thumbCentreOffset(last, halfThumb) + pad
  if (percents.length < 2) return { insetInlineStart: 0, width: `calc(${last}% + ${end}px)` }
  const start = thumbCentreOffset(first, halfThumb) - pad
  return {
    insetInlineStart: `calc(${first}% + ${start}px)`,
    width: `calc(${last - first}% + ${end - start}px)`,
  }
}

type SliderThumbProps = React.ComponentProps<typeof SliderPrimitive.Thumb> & {
  variant: SliderVariant
  percent: number
  text: string
}

function SliderThumb({ variant, percent, text, ...props }: SliderThumbProps) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      aria-valuetext={text}
      className={cn(
        THUMB_CLASS[variant],
        "relative outline-none transition-[scale,box-shadow] duration-(--duration-fast) ease-(--ease-mise) active:duration-100",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:cursor-not-allowed",
        // The target grows without the thumb growing, so Radix's measurement and the fill stay in step.
        "before:absolute before:-inset-2.5 before:content-['']",
        variant !== "filled" && "active:scale-110",
      )}
      {...props}
    >
      {variant === "filled" ? (
        <span data-slot="slider-grip" className="h-4 w-1 rounded-full bg-mise-foreground/70" />
      ) : null}
      {variant === "label" ? (
        // Anchored by percent, so the bubble ends flush with the track at both ends instead of overflowing it.
        <span
          data-slot="slider-bubble"
          className="absolute bottom-full mb-2 flex h-6 items-center rounded-md bg-foreground px-2 text-[13px] whitespace-nowrap text-background tabular-nums shadow-sm"
          style={{ left: `${percent}%`, transform: `translateX(-${percent}%)` }}
        >
          {text}
        </span>
      ) : null}
    </SliderPrimitive.Thumb>
  )
}

/** Focus lands on a thumb, not on the root, so name and description have to reach it to be heard. */
interface ThumbAria {
  label: string | undefined
  labelledBy: string | undefined
  describedBy: string | undefined
}

interface SliderStageProps {
  variant: SliderVariant
  values: readonly number[]
  percents: readonly number[]
  formatValue: (value: number) => string
  rubber: ReturnType<typeof useRubberStretch>
  thumbAria: ThumbAria
}

/** Transforms live here, not on the root, whose rect Radix reads to turn a pointer into a value. */
function SliderStage({ variant, values, percents, formatValue, rubber, thumbAria }: SliderStageProps) {
  return (
    <motion.span
      data-slot="slider-stage"
      data-stretch={rubber.side ?? undefined}
      className={cn(
        "relative flex w-full items-center",
        variant === "filled" ? "h-8 pointer-coarse:h-10" : "h-5 pointer-coarse:h-10",
      )}
      style={rubber.active ? rubber.style : undefined}
    >
      <SliderPrimitive.Track data-slot="slider-track" className={cn("relative w-full grow", TRACK_CLASS[variant])}>
        <span
          data-slot="slider-fill"
          className="absolute inset-y-0 rounded-[inherit] bg-mise"
          style={fillStyle(percents, variant)}
        />
      </SliderPrimitive.Track>
      {values.map((entry, index) => (
        <SliderThumb
          key={index}
          variant={variant}
          percent={percents[index]}
          text={formatValue(entry)}
          aria-label={thumbName(thumbAria.label, index, values.length)}
          aria-labelledby={thumbAria.labelledBy}
          aria-describedby={thumbAria.describedBy}
        />
      ))}
    </motion.span>
  )
}

export { HALF_THUMB_PX, SliderStage, type SliderVariant }
