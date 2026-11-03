import { motion, useTransform, type MotionValue } from "motion/react"
import { meterFraction, type CountFormat } from "@/registry/miseui/ui/count-up-math"

interface FigureProps {
  count: MotionValue<number>
  format: CountFormat
  value: number
}

function PlainFigure({ count, format, value }: FigureProps) {
  const text = useTransform(count, (current) => format.text(current))
  return (
    // Stacked in one cell, right-aligned: the final text holds the width, and 99 turning into 100 grows to the left with the ones in place.
    <span aria-hidden="true" data-slot="count-up-visual" className="inline-grid justify-items-end whitespace-nowrap *:[grid-area:1/1]">
      <span data-slot="count-up-reserve" className="invisible" suppressHydrationWarning>
        {format.text(value)}
      </span>
      <motion.span data-slot="count-up-value" suppressHydrationWarning>
        {text}
      </motion.span>
    </span>
  )
}

interface MeterProps extends FigureProps {
  from: number
  /** The value of a full line. */
  top: number
}

function MeterFigure({ count, format, value, from, top }: MeterProps) {
  const scaleX = useTransform(count, (current) => meterFraction(current, from, top))
  return (
    <span className="grid grid-cols-[minmax(0,1fr)] gap-2">
      <span className="justify-self-start">
        <PlainFigure count={count} format={format} value={value} />
      </span>
      <span aria-hidden="true" data-slot="count-up-track" className="block h-0.5 overflow-clip rounded-full bg-border">
        <motion.span data-slot="count-up-fill" className="block h-full origin-left rounded-full bg-mise rtl:origin-right" style={{ scaleX }} />
      </span>
    </span>
  )
}

export { MeterFigure, PlainFigure }
