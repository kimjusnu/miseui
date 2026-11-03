import { useEffect, useRef } from "react"
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react"

/** Long enough to be seen moving, then it settles without overshooting the real number. */
const COUNT_SPRING = { type: "spring", bounce: 0, duration: 1.2 } as const

function decimalsIn(value: number) {
  const text = String(value)
  return text.includes(".") && !text.includes("e") ? text.length - text.indexOf(".") - 1 : 0
}

interface CountFigureProps {
  /** Where the count starts: the old value of a before and after, or zero. */
  from: number
  to: number
  format: (value: number) => string
}

function CountFigure({ from, to, format }: CountFigureProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true })
  const count = useMotionValue(from)
  const factor = 10 ** decimalsIn(to)
  const text = useTransform(count, (current) => format(Math.round(current * factor) / factor))
  useEffect(() => {
    if (!seen) return
    const controls = animate(count, to, COUNT_SPRING)
    return () => controls.stop()
  }, [seen, count, to])
  const final = format(to)
  return (
    <span ref={ref} data-slot="stat-line-count" className="relative inline-block max-w-full">
      {/* The final text holds the width, so a figure counting up cannot push its neighbours along. */}
      <span aria-hidden="true" className="invisible">
        {final}
      </span>
      <motion.span aria-hidden="true" data-slot="stat-line-count-value" className="absolute inset-0">
        {text}
      </motion.span>
      <span className="sr-only">{final}</span>
    </span>
  )
}

export { CountFigure }
