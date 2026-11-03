import type * as React from "react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { sketchBoxPath, sketchStrokePath, type LineRect, type LineTiming } from "@/registry/miseui/ui/highlighter-math"

type HighlighterVariant = "marker" | "underline" | "sketch" | "box"

const INSTANT = { duration: 0 } as const
/** Room around the words for the outline, so it does not touch the letters. */
const BOX_PADDING_X = 3
const BOX_PADDING_Y = 2
/** How far past the bounding box a stroke may wander, so the svg never cuts it. */
const STROKE_ROOM = 8
const STROKE_WIDTH = 2

interface LineMarkProps {
  line: LineRect
  timing: LineTiming
  /** False holds the mark undrawn. */
  shown: boolean
  /** Already drawn once: a re-measure places it at once instead of drawing it again. */
  settled: boolean
  /** Picks the hand-drawn shape. Each line adds its index, so two lines of one mark never share a stroke. */
  seed: number
  index: number
}

function drawTransition({ timing, settled }: Pick<LineMarkProps, "timing" | "settled">) {
  return settled ? INSTANT : { ...SPRING_DEFAULT, duration: timing.duration, delay: timing.delay }
}

const hiddenBand = { scaleX: 0 }
const shownBand = { scaleX: 1 }

/** Swiped across, not faded: the eye follows the band along the words, which is the reading order. */
function MarkerBand({ line, timing, shown, settled }: LineMarkProps) {
  return (
    <motion.span
      data-slot="highlighter-line"
      className="absolute block origin-left rounded-[0.16em] bg-mise-soft rtl:origin-right"
      style={{ left: line.left - 2, top: line.top + line.height * 0.06, width: line.width + 4, height: line.height * 0.88 }}
      initial={settled ? false : hiddenBand}
      animate={shown ? shownBand : hiddenBand}
      transition={drawTransition({ timing, settled })}
    />
  )
}

function UnderlineStroke({ line, timing, shown, settled }: LineMarkProps) {
  return (
    <motion.span
      data-slot="highlighter-line"
      className="absolute block h-0.5 origin-left rounded-full bg-mise rtl:origin-right"
      style={{ left: line.left, top: line.top + line.height - 1, width: line.width }}
      initial={settled ? false : hiddenBand}
      animate={shown ? shownBand : hiddenBand}
      transition={drawTransition({ timing, settled })}
    />
  )
}

interface DrawnPathProps extends LineMarkProps {
  path: string
  /** Where the path's 0,0 sits relative to the anchor. */
  x: number
  y: number
  width: number
  height: number
}

const hiddenPath = { pathLength: 0, opacity: 0 }
const shownPath = { pathLength: 1, opacity: 1 }

function DrawnPath({ path, x, y, width, height, timing, shown, settled }: DrawnPathProps) {
  const transition = drawTransition({ timing, settled })
  return (
    <svg
      data-slot="highlighter-line"
      className="absolute block overflow-visible fill-none stroke-mise"
      style={{ left: x - STROKE_ROOM, top: y - STROKE_ROOM }}
      width={width + STROKE_ROOM * 2}
      height={height + STROKE_ROOM * 2}
      viewBox={`${-STROKE_ROOM} ${-STROKE_ROOM} ${width + STROKE_ROOM * 2} ${height + STROKE_ROOM * 2}`}
    >
      <motion.path
        d={path}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={settled ? false : hiddenPath}
        animate={shown ? shownPath : hiddenPath}
        // A round cap at length zero is still a visible dot, so opacity holds it back until the stroke actually starts.
        transition={settled ? INSTANT : { pathLength: transition, opacity: { duration: 0.01, delay: timing.delay } }}
      />
    </svg>
  )
}

function SketchStroke(props: LineMarkProps) {
  const { line, seed, index } = props
  return (
    <DrawnPath
      {...props}
      path={sketchStrokePath(line.width, seed + index)}
      x={line.left}
      y={line.top + line.height}
      width={line.width}
      height={0}
    />
  )
}

function SketchBox(props: LineMarkProps) {
  const { line, seed, index } = props
  const width = line.width + BOX_PADDING_X * 2
  const height = line.height + BOX_PADDING_Y * 2
  return (
    <DrawnPath
      {...props}
      path={sketchBoxPath(width, height, seed + index)}
      x={line.left - BOX_PADDING_X}
      y={line.top - BOX_PADDING_Y}
      width={width}
      height={height}
    />
  )
}

const LINE_MARK: Record<HighlighterVariant, (props: LineMarkProps) => React.JSX.Element> = {
  marker: MarkerBand,
  underline: UnderlineStroke,
  sketch: SketchStroke,
  box: SketchBox,
}

/** Behind the text, in the stacking context of the mark, so no stroke ever lowers the contrast of a letter. */
const ANCHOR_CLASS = "pointer-events-none absolute -z-10 size-0 overflow-visible select-none forced-colors:hidden"

export { ANCHOR_CLASS, LINE_MARK, type HighlighterVariant, type LineMarkProps }
