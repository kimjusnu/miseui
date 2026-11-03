import type * as React from "react"
import { useId } from "react"
import { useReducedMotion } from "motion/react"
import { CountUp, StatChange, StatSparkline } from "@/registry/miseui/ui/stat-parts"
import type { StatPolarity } from "@/registry/miseui/ui/stat-math"
import { cn } from "@/registry/miseui/lib/utils"

type StatVariant = "plain" | "card" | "compact" | "inline"
type StatEffect = "count-up"

type StatProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** A number can be formatted and counted; a string such as "4m 12s" is shown as it is. */
  value: number | string
  /** `plain` a large figure, `card` a surface with the trend along its foot, `compact` one table-like row, `inline` a run of text. */
  variant?: StatVariant
  /** `count-up` counts once when first seen. People who turned motion off get the final figure. */
  effect?: StatEffect
  /** Formats a numeric value. Defaults to grouped digits in the given locale. */
  format?: (value: number) => string
  locale?: string
  /** The change since the last period, signed. */
  change?: number
  /** Written after the change. Defaults to a percent sign. */
  changeSuffix?: string
  /** A few words of context after the change, such as "vs last month". */
  changeNote?: React.ReactNode
  /** Which way is good. `neutral` keeps the change grey. */
  polarity?: StatPolarity
  /** Samples for a small line. Described to assistive tech through `trendLabel`. */
  trend?: readonly number[]
  trendLabel?: string
}

/** cqi keeps a long figure on one line in a narrow cell; the clamp stops it shouting in a wide one. */
const VALUE_CLASS: Record<StatVariant, string> = {
  plain: "text-[clamp(24px,14cqi,32px)] leading-tight font-semibold tracking-tight",
  card: "text-[clamp(24px,12cqi,32px)] leading-tight font-semibold tracking-tight",
  compact: "text-[15px] leading-6 font-medium",
  inline: "text-[15px] leading-6 font-semibold",
}

const ROOT_CLASS: Record<StatVariant, string> = {
  // w-full: a size container takes no width from its content, so as a flex item it would otherwise collapse to nothing.
  plain: "@container grid w-full min-w-0 gap-1",
  card: "@container grid w-full min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs",
  compact: "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b py-2 last:border-b-0",
  inline: "inline-flex max-w-full flex-wrap items-baseline gap-x-2",
}

const defaultFormat = (locale?: string) => (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(value)

interface StatFigureProps {
  value: number | string
  format: (value: number) => string
  counting: boolean
  reduceMotion: boolean
  className: string
}

function StatFigure({ value, format, counting, reduceMotion, className }: StatFigureProps) {
  const numeric = typeof value === "number"
  return (
    // Tabular figures: a digit changing from 1 to 8 must not push everything beside it.
    <span data-slot="stat-value" className={cn("block min-w-0 tabular-nums wrap-anywhere", className)}>
      {numeric && counting ? <CountUp value={value} format={format} reduceMotion={reduceMotion} /> : numeric ? format(value) : value}
    </span>
  )
}

function StatTrendText({ trend, trendLabel }: Pick<StatProps, "trend" | "trendLabel">) {
  if (!trend || trend.length === 0 || !trendLabel) return null
  return <span className="sr-only">{trendLabel}</span>
}

interface StatLayoutProps {
  variant: StatVariant
  name: React.ReactNode
  figure: React.ReactNode
  changed: React.ReactNode
  line: (className: string, filled?: boolean) => React.ReactNode
}

function StatLayout({ variant, name, figure, changed, line }: StatLayoutProps) {
  if (variant === "card") {
    return (
      <>
        <div className="grid min-w-0 gap-2 p-4">
          {name}
          {figure}
          {changed}
        </div>
        {line("h-12 w-full", true)}
      </>
    )
  }
  if (variant === "compact") {
    return (
      <>
        <div className="grid min-w-0">
          {name}
          {changed}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {line("h-6 w-12 max-[320px]:hidden")}
          {figure}
        </div>
      </>
    )
  }
  return (
    <>
      {name}
      {figure}
      {changed}
      {line(variant === "inline" ? "h-4 w-12 self-center" : "mt-2 h-8 w-full")}
    </>
  )
}

function Stat({
  label,
  value,
  variant = "plain",
  effect,
  format,
  locale,
  change,
  changeSuffix = "%",
  changeNote,
  polarity = "neutral",
  trend,
  trendLabel,
  className,
  ...props
}: StatProps) {
  const labelId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const line = (lineClass: string, filled = false) =>
    trend && trend.length > 0 ? <StatSparkline values={trend} polarity={polarity} change={change} filled={filled} className={lineClass} /> : null
  return (
    <div role="group" aria-labelledby={labelId} data-slot="stat" data-variant={variant} data-effect={effect} className={cn(ROOT_CLASS[variant], className)} {...props}>
      <StatLayout
        variant={variant}
        line={line}
        name={
          <span id={labelId} data-slot="stat-label" className="min-w-0 text-[13px] leading-5 text-muted-foreground">
            {label}
          </span>
        }
        figure={
          <StatFigure value={value} format={format ?? defaultFormat(locale)} counting={effect === "count-up"} reduceMotion={reduceMotion} className={VALUE_CLASS[variant]} />
        }
        changed={change === undefined ? null : <StatChange change={change} suffix={changeSuffix} polarity={polarity} locale={locale} note={changeNote} />}
      />
      <StatTrendText trend={trend} trendLabel={trendLabel} />
    </div>
  )
}

export { Stat, type StatProps, type StatVariant, type StatEffect, type StatPolarity }
