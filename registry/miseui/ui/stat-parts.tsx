import type * as React from "react"
import { useEffect, useRef } from "react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import {
  changeDirection,
  changeTone,
  decimalsOf,
  formatChange,
  roundTo,
  sparklineArea,
  sparklinePath,
  type StatPolarity,
  type StatTone,
} from "@/registry/miseui/ui/stat-math"
import { cn } from "@/registry/miseui/lib/utils"

/** Longer than a press spring: a count has to be seen moving, then settle without overshooting the real number. */
const COUNT_SPRING = { type: "spring", bounce: 0, duration: 1 } as const
const SPARK_WIDTH = 100
const SPARK_HEIGHT = 32

/** Fixed hues, never the accent: with a red or amber accent the theme colour would say the opposite. */
const TONE_TEXT_CLASS: Record<StatTone, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
}

const DIRECTION_WORD = { up: "Up", down: "Down", flat: "No change" } as const

interface StatChangeProps {
  change: number
  suffix: string
  polarity: StatPolarity
  locale?: string
  note?: React.ReactNode
  className?: string
}

function StatChange({ change, suffix, polarity, locale, note, className }: StatChangeProps) {
  const direction = changeDirection(change)
  const tone = changeTone(direction, polarity)
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus
  const text = formatChange(change, suffix, locale)
  return (
    <span data-slot="stat-change" data-direction={direction} data-tone={tone} className={cn("inline-flex min-w-0 flex-wrap items-center gap-x-1 text-[13px] leading-5", className)}>
      {/* The arrow and sign carry the direction, so red and green are never the only signal. */}
      <span className={cn("inline-flex items-center gap-1 font-medium tabular-nums", TONE_TEXT_CLASS[tone])}>
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <span aria-hidden="true">{text}</span>
        <span className="sr-only">{direction === "flat" ? DIRECTION_WORD.flat : `${DIRECTION_WORD[direction]} ${text.slice(1)}`}</span>
      </span>
      {note ? <span className="text-muted-foreground">{note}</span> : null}
    </span>
  )
}

interface StatSparklineProps {
  values: readonly number[]
  polarity: StatPolarity
  change?: number
  filled?: boolean
  className?: string
}

function StatSparkline({ values, polarity, change, filled = false, className }: StatSparklineProps) {
  const tone = changeTone(changeDirection(change ?? 0), polarity)
  const line = sparklinePath(values, SPARK_WIDTH, SPARK_HEIGHT)
  if (!line) return null
  return (
    <svg
      aria-hidden="true"
      data-slot="stat-sparkline"
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      // Stretches to any width; non-scaling-stroke below keeps the line one weight whatever the stretch.
      preserveAspectRatio="none"
      fill="none"
      className={cn("block", TONE_TEXT_CLASS[tone], className)}
    >
      {filled ? <path d={sparklineArea(values, SPARK_WIDTH, SPARK_HEIGHT)} fill="currentColor" opacity="0.1" /> : null}
      <path d={line} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

interface CountUpProps {
  value: number
  format: (value: number) => string
  reduceMotion: boolean
}

function CountUp({ value, format, reduceMotion }: CountUpProps) {
  const holder = useRef<HTMLSpanElement>(null)
  const played = useRef(false)
  const count = useMotionValue(reduceMotion ? value : 0)
  const decimals = decimalsOf(value)
  const text = useTransform(count, (current) => format(roundTo(current, decimals)))
  useEffect(() => {
    const node = holder.current
    // A later change of value is news, not an introduction: it lands at once.
    if (reduceMotion || played.current || !node || typeof IntersectionObserver === "undefined") {
      played.current = true
      count.set(value)
      return
    }
    let controls: ReturnType<typeof animate> | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      played.current = true
      controls = animate(count, value, COUNT_SPRING)
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      controls?.stop()
    }
  }, [count, value, reduceMotion])
  const final = format(value)
  return (
    <span ref={holder} data-slot="stat-count" className="relative inline-block max-w-full">
      {/* The final text holds the width, so the digits count inside a box that never resizes. */}
      <span className="invisible" aria-hidden="true">
        {final}
      </span>
      <motion.span aria-hidden="true" data-slot="stat-count-value" className="absolute inset-0">
        {text}
      </motion.span>
      <span className="sr-only">{final}</span>
    </span>
  )
}

export { CountUp, StatChange, StatSparkline }
