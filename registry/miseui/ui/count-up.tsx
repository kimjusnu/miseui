import type * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { MeterFigure, PlainFigure } from "@/registry/miseui/ui/count-up-figure"
import { CountReels } from "@/registry/miseui/ui/count-up-reels"
import { UNAVAILABLE_MARK, createCountFormat, widerTokens, type CountFormatInput } from "@/registry/miseui/ui/count-up-math"
import { cn } from "@/registry/miseui/lib/utils"

type CountUpVariant = "plain" | "odometer" | "board" | "meter"
type CountUpEffect = "retarget"
type CountUpTrigger = "view" | "mount"

const DEFAULT_DURATION_SECONDS = 1.2
const VIEW_MARGIN = "0px 0px -10% 0px"

interface CountRunInput {
  ref: React.RefObject<HTMLElement | null>
  value: number
  start: number
  retarget: boolean
  trigger: CountUpTrigger
  reduceMotion: boolean
  delay: number
  duration: number
}

/** Plays once when seen. After that a new value only moves with `retarget`, and then from wherever the count has got to. */
function useCountRun({ ref, value, start, retarget, trigger, reduceMotion, delay, duration }: CountRunInput) {
  const count = useMotionValue(reduceMotion ? value : start)
  const [resting, setResting] = useState(reduceMotion ? value : start)
  const seen = useInView(ref, { once: true, margin: VIEW_MARGIN })
  const ready = trigger === "mount" || seen
  const played = useRef(false)
  useEffect(() => {
    if (!ready && !reduceMotion) return
    const firstRun = !played.current
    played.current = true
    if (reduceMotion || (!firstRun && !retarget)) {
      count.set(value)
      setResting(value)
      return
    }
    const controls = animate(count, value, {
      ...SPRING_DEFAULT,
      duration,
      delay: firstRun ? delay : 0,
      onComplete: () => setResting(value),
    })
    return () => controls.stop()
    // A new delay or duration applies to the next run; it must not restart the one in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, value, retarget, reduceMotion, count])
  return { count, resting }
}

interface CountNumberProps extends CountFormatInput {
  value: number
  variant: CountUpVariant
  retarget: boolean
  from: number
  max: number | undefined
  trigger: CountUpTrigger
  delay: number
  duration: number
  rootRef: React.RefObject<HTMLElement | null>
}

function CountNumber({ value, variant, retarget, from, max, trigger, delay, duration, rootRef, locale, formatOptions, prefix, suffix }: CountNumberProps) {
  const reduceMotion = useReducedMotion() ?? false
  const start = Number.isFinite(from) ? from : 0
  const format = useMemo(() => createCountFormat(value, { locale, formatOptions, prefix, suffix }), [value, locale, formatOptions, prefix, suffix])
  const { count, resting } = useCountRun({ ref: rootRef, value, start, retarget, trigger, reduceMotion, delay, duration })
  // Without a max the line is measured against the first value, so a retarget never rescales what is already drawn.
  const [firstValue] = useState(value)
  const final = format.text(value)
  const target = format.tokens(value)
  const rolling = variant === "odometer" || variant === "board"
  return (
    <>
      {/* Reels hold every digit from 0 to 9, so dragging across them would copy all of it. Over reels the real number is laid on top, unseen but selectable. */}
      <span data-slot="count-up-text" className={rolling ? "absolute inset-0 overflow-clip text-transparent" : "sr-only select-none"} suppressHydrationWarning>
        {final}
      </span>
      {variant === "plain" ? <PlainFigure count={count} format={format} value={value} /> : null}
      {variant === "meter" ? <MeterFigure count={count} format={format} value={value} from={start} top={max ?? firstValue} /> : null}
      {rolling ? (
        <CountReels shape={widerTokens(format.tokens(resting), target)} target={target} format={format} value={value} count={count} look={variant} />
      ) : null}
    </>
  )
}

type CountUpProps = Omit<React.ComponentProps<"span">, "children" | "prefix"> &
  CountFormatInput & {
    value: number
    /** `plain` the number updates, `odometer` each digit rolls behind a clip, `board` each digit on its own tile, `meter` a thin line fills below. */
    variant?: CountUpVariant
    /** `retarget` animates to a new `value` from whatever is showing, and can be interrupted. Without it a new value appears at once. */
    effect?: CountUpEffect
    /** Where the first count starts. */
    from?: number
    /** `meter` only: the value of a full line. Without it the line ends full at the first value. */
    max?: number
    /** `view` plays once when first seen, `mount` right away. */
    trigger?: CountUpTrigger
    /** Seconds before the first count starts. */
    delay?: number
    /** Seconds one count takes. */
    duration?: number
    /** Read out instead of the dash when the value is not a finite number. */
    unavailableLabel?: string
  }

function CountUp({
  value,
  variant = "plain",
  effect,
  from = 0,
  max,
  trigger = "view",
  delay = 0,
  duration = DEFAULT_DURATION_SECONDS,
  unavailableLabel = "Not available",
  locale,
  formatOptions,
  prefix,
  suffix,
  className,
  ...props
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const root = { ...props, ref, "data-slot": "count-up", "data-variant": variant, "data-effect": effect }
  const layout = variant === "meter" ? "grid" : "inline-grid"
  if (!Number.isFinite(value)) {
    return (
      <span {...root} data-unavailable="true" className={cn(layout, "tabular-nums", className)}>
        <span className="sr-only">{unavailableLabel}</span>
        <span aria-hidden="true" data-slot="count-up-visual">
          {UNAVAILABLE_MARK}
        </span>
      </span>
    )
  }
  return (
    <span {...root} className={cn("relative whitespace-nowrap tabular-nums", layout, className)}>
      <CountNumber
        rootRef={ref}
        value={value}
        variant={variant}
        retarget={effect === "retarget"}
        from={from}
        max={max}
        trigger={trigger}
        delay={delay}
        duration={duration}
        locale={locale}
        formatOptions={formatOptions}
        prefix={prefix}
        suffix={suffix}
      />
    </span>
  )
}

export { CountUp, type CountUpProps, type CountUpVariant, type CountUpEffect, type CountUpTrigger }
