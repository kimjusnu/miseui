import type * as React from "react"
import { useId } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

interface GooeyItem {
  id: string
  label?: string
}

const DEFAULT_DOT_PX = 14
const DEFAULT_GAP_PX = 10
/** Blur as a share of the dot, then an alpha ramp steep enough to re-solidify it: touching dots read as one body. */
const BLUR_SHARE = 0.3
const ALPHA_SLOPE = 18
const ALPHA_OFFSET = -7
/** Room on each side, in dot widths, for the blur and for dots mid-flight. */
const BLEED_DOTS = 1
/** Merged dots keep a third of a dot between centres, so the body reads as "all of them", not "one left". */
const MERGED_OVERLAP_SHARE = 0.35

interface GooeyMorphProps extends React.ComponentProps<"div"> {
  items: ReadonlyArray<GooeyItem>
  /** True gathers every dot into one body at the centre; false spreads them `gap` apart. */
  merged?: boolean
  /** Dot diameter in px. */
  size?: number
  /** Space between dots in px when spread. */
  gap?: number
}

/** Horizontal offset of dot `index` from the centre: `gap` apart when spread, overlapping when merged. */
function dotOffset(index: number, count: number, size: number, gap: number, merged: boolean) {
  const pitch = merged ? size * MERGED_OVERLAP_SHARE : size + gap
  return (index - (count - 1) / 2) * pitch
}

/** useId may contain characters that are awkward inside url(#...); keep the id to safe ones. */
function useFilterId() {
  return `gooey-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
}

function GooeyMorph({
  items,
  merged = false,
  size = DEFAULT_DOT_PX,
  gap = DEFAULT_GAP_PX,
  className,
  style,
  ...props
}: GooeyMorphProps) {
  const reduceMotion = useReducedMotion()
  const filterId = useFilterId()
  const count = items.length
  const rowWidth = count * size + Math.max(0, count - 1) * gap
  const bleed = size * BLEED_DOTS

  return (
    <div
      role="img"
      aria-label={items.map((item) => item.label ?? item.id).join(", ")}
      data-slot="gooey-morph"
      data-merged={merged ? "true" : "false"}
      data-reduced={reduceMotion ? "true" : "false"}
      className={cn("relative inline-block", className)}
      style={{ ...style, width: rowWidth + bleed * 2, height: size + bleed * 2 }}
      {...props}
    >
      {reduceMotion ? null : <GooeyFilter id={filterId} blur={size * BLUR_SHARE} />}
      <div
        data-testid="gooey-field"
        className="absolute inset-0"
        style={reduceMotion ? undefined : { filter: `url(#${filterId})` }}
      >
        {items.map((item, index) => (
          <motion.span
            key={item.id}
            data-testid="gooey-dot"
            className="absolute top-1/2 left-1/2 rounded-full bg-mise"
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
            initial={false}
            animate={{ x: dotOffset(index, count, size, gap, merged) }}
            transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          />
        ))}
      </div>
    </div>
  )
}

function GooeyFilter({ id, blur }: { id: string; blur: number }) {
  return (
    <svg aria-hidden="true" className="absolute size-0">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${ALPHA_SLOPE} ${ALPHA_OFFSET}`}
          />
        </filter>
      </defs>
    </svg>
  )
}

export { GooeyMorph, type GooeyMorphProps, type GooeyItem }
