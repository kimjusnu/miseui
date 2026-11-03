import type * as React from "react"
import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { createSparkEngine, type SparkEngine } from "@/registry/miseui/ui/click-spark-engine"
import { DEFAULT_COUNT, type ClickSparkVariant } from "@/registry/miseui/ui/click-spark-math"
import { cn } from "@/registry/miseui/lib/utils"

type ClickSparkProps = React.ComponentProps<"div"> & {
  /** `spark` short lines radiating, `dots` round bits with light gravity, `ring` one soft band spreading, `confetti` small falling rects. */
  variant?: ClickSparkVariant
  /** How many pieces. `ring` is always one band. */
  count?: number
}

/** A keyboard press has no position: it reports detail 0 and bursts from the middle of what was pressed. */
function pressPoint(event: React.MouseEvent<HTMLElement>) {
  if (event.detail !== 0) return { x: event.clientX, y: event.clientY }
  const target = event.target instanceof Element ? event.target : event.currentTarget
  const box = target.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

function ClickSpark({ variant = "spark", count, className, children, onClick, ...props }: ClickSparkProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<SparkEngine | null>(null)
  const reduceMotion = useReducedMotion() ?? false

  useEffect(
    () => () => {
      engineRef.current?.dispose()
      engineRef.current = null
    },
    [],
  )

  return (
    <div
      ref={rootRef}
      data-slot="click-spark"
      data-variant={variant}
      className={cn("relative min-w-0", className)}
      onClick={(event) => {
        // Reads the press and nothing else: no preventDefault, no stopPropagation, so links and forms behave as they would without it.
        onClick?.(event)
        const root = rootRef.current
        if (reduceMotion || !root) return
        engineRef.current ??= createSparkEngine(root)
        const { x, y } = pressPoint(event)
        engineRef.current.burst(x, y, variant, count ?? DEFAULT_COUNT[variant])
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export { ClickSpark, type ClickSparkProps, type ClickSparkVariant }
