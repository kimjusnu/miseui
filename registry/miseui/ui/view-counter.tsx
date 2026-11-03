import type * as React from "react"
import { useEffect } from "react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { Eye } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { defaultViewLabel, formatCount, useViewCount, type ViewCountFetcher } from "@/registry/miseui/ui/view-counter-state"
import { cn } from "@/registry/miseui/lib/utils"

type ViewCounterVariant = "inline" | "badge" | "stat"
type ViewCounterEffect = "count" | "odometer"

const COUNT_SECONDS = 1.2
const COUNT_EASE = [0.16, 1, 0.3, 1] as const
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
const WHEEL_STAGGER_S = 0.04

const ROOT_CLASS: Record<ViewCounterVariant, string> = {
  inline: "inline-flex items-baseline gap-1 text-[13px] text-muted-foreground",
  badge: "inline-flex min-h-7 items-center gap-1.5 rounded-full border bg-background px-3 text-[13px] text-foreground",
  stat: "inline-grid gap-1 text-[13px] text-muted-foreground",
}

const NUMBER_CLASS: Record<ViewCounterVariant, string> = {
  inline: "tabular-nums",
  badge: "font-medium tabular-nums",
  stat: "text-3xl leading-tight font-semibold tracking-tight text-foreground tabular-nums",
}

type RootAttributes = Omit<React.ComponentProps<"span">, "children">

interface ViewCounterProps extends RootAttributes {
  /** Yours: this component does no networking. Pass the signal on so an answer nobody is waiting for is cancelled. */
  fetcher: ViewCountFetcher
  /** Runs the fetcher again when it changes. A new fetcher function alone does not, so an inline arrow is safe. */
  resourceKey?: string
  /** `inline` for a metadata line, `badge` a pill with an eye, `stat` one large number. */
  variant?: ViewCounterVariant
  /** `count` rises from zero, `odometer` rolls each digit into place. */
  effect?: ViewCounterEffect
  /** Words after the number. The badge keeps them for screen readers, since the eye says the same. */
  label?: string | ((count: number) => string)
  /** Replaces the number formatting entirely. */
  format?: (count: number) => string
  /** For the number only. Defaults to the reader's language. */
  locale?: string
  /** 1.5K rather than 1,500. */
  compact?: boolean
  /** Text when the fetcher fails. Pass null with retryLabel null to show nothing at all. */
  failureText?: React.ReactNode
  retryLabel?: string | null
  loadingLabel?: string
  onError?: (error: unknown) => void
}

function CountUp({ value, text }: { value: number; text: (count: number) => string }) {
  const progress = useMotionValue(0)
  const shown = useTransform(progress, (current) => text(Math.round(current)))
  useEffect(() => {
    const controls = animate(progress, value, { duration: COUNT_SECONDS, ease: COUNT_EASE })
    return () => controls.stop()
  }, [progress, value])
  return <motion.span>{shown}</motion.span>
}

/** Only digits roll: a separator or a compact suffix such as K or 천 just stands in its place. */
function Odometer({ text }: { text: string }) {
  const characters = [...text]
  return (
    <span data-slot="view-counter-odometer" className="inline-flex">
      {characters.map((character, position) => {
        const digit = Number(character)
        if (character === " " || Number.isNaN(digit)) return <span key={position}>{character}</span>
        return (
          <span key={position} data-slot="view-counter-wheel" className="inline-block h-[1lh] w-[1ch] overflow-hidden">
            <motion.span
              className="block"
              initial={{ y: "0%" }}
              animate={{ y: `${-digit * 10}%` }}
              transition={{ ...SPRING_DEFAULT, delay: (characters.length - position) * WHEEL_STAGGER_S }}
            >
              {DIGITS.map((entry) => <span key={entry} className="block h-[1lh] text-center">{entry}</span>)}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}

function CounterNumber({ value, effect, format }: { value: number; effect?: ViewCounterEffect; format: (count: number) => string }) {
  const reduceMotion = useReducedMotion() ?? false
  const text = format(value)
  if (!effect || reduceMotion) return <span>{text}</span>
  return (
    <>
      {/* The moving digits would be read out one frame at a time, so assistive tech gets the plain figure. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{effect === "odometer" ? <Odometer text={text} /> : <CountUp value={value} text={format} />}</span>
    </>
  )
}

const RETRY_CLASS =
  "inline-flex items-center rounded-sm font-medium text-foreground underline underline-offset-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-10"

function CounterSkeleton({ label }: { label: string }) {
  return (
    <>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" data-slot="view-counter-skeleton" className="inline-block h-[1lh] w-[4ch] animate-pulse rounded-sm bg-muted align-bottom motion-reduce:animate-none" />
    </>
  )
}

function ViewCounter({
  fetcher, resourceKey = "", variant = "inline", effect, label = defaultViewLabel, format, locale, compact = false,
  failureText = "Views unavailable", retryLabel = "Retry", loadingLabel = "Loading views", onError, className, ...props
}: ViewCounterProps) {
  const { state, retry } = useViewCount(fetcher, resourceKey, onError)
  const shared = { "data-slot": "view-counter", "data-variant": variant, "data-effect": effect, "data-state": state.status, ...props }
  if (state.status === "failed") {
    if (failureText === null && retryLabel === null) return null
    return (
      <span {...shared} className={cn("inline-flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground", className)}>
        {failureText}
        {retryLabel === null ? null : <button type="button" onClick={retry} className={RETRY_CLASS}>{retryLabel}</button>}
      </span>
    )
  }
  const loading = state.status === "loading"
  const formatter = format ?? ((count: number) => formatCount(count, locale, compact))
  return (
    <span {...shared} aria-busy={loading || undefined} className={cn(ROOT_CLASS[variant], className)}>
      {variant === "badge" ? <Eye aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
      <span className={NUMBER_CLASS[variant]}>
        {loading ? <CounterSkeleton label={loadingLabel} /> : <CounterNumber value={state.value} effect={effect} format={formatter} />}
      </span>
      {loading ? null : (
        <span className={cn(variant === "badge" && "sr-only")}>{typeof label === "string" ? label : label(state.value)}</span>
      )}
    </span>
  )
}

export { ViewCounter, type ViewCounterProps, type ViewCounterVariant, type ViewCounterEffect, type ViewCountFetcher }
