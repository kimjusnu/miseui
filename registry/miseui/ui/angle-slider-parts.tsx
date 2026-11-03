import { motion, useTransform, type MotionValue } from "motion/react"
import { arcPath, polarPoint, valueToAngle, type DialRange } from "@/registry/miseui/ui/angle-slider-math"
import { cn } from "@/registry/miseui/lib/utils"

interface AngleSliderMark {
  value: number
  label?: string
}

/** Everything is drawn on this box, so a dial of any size stays crisp and keeps its proportions. */
const VIEW_BOX = 100
const CENTRE = VIEW_BOX / 2
const RIM_RADIUS = 46
const TRACK_RADIUS = 44
const TICK_LENGTH = 3
const MAJOR_TICK_LENGTH = 6
const LABEL_RADIUS = 31
const TICK_STEP_DEGREES = 15
const GAUGE_STROKE = 6

function rotate(rotation: MotionValue<number>) {
  return { rotate: rotation }
}

function DialRing() {
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} className="absolute inset-0 size-full">
      <circle cx={CENTRE} cy={CENTRE} r={TRACK_RADIUS} fill="none" strokeWidth={GAUGE_STROKE} className="stroke-muted" />
    </svg>
  )
}

function RimThumb({ rotation }: { rotation: MotionValue<number> }) {
  return (
    <motion.div aria-hidden="true" data-slot="angle-slider-thumb" style={rotate(rotation)} className="absolute inset-0">
      {/* The track runs at radius 44 of 100, so a 12% thumb flush with the top sits exactly on it. The outline keeps a near-black accent visible on a dark panel. */}
      <span className="absolute top-0 left-1/2 aspect-square w-[12%] -translate-x-1/2 rounded-full bg-mise shadow-sm ring-2 ring-background outline-1 outline-offset-2 outline-foreground/20" />
    </motion.div>
  )
}

function Needle({ rotation, inset }: { rotation: MotionValue<number>; inset: string }) {
  return (
    <motion.div aria-hidden="true" data-slot="angle-slider-thumb" style={rotate(rotation)} className="absolute inset-0">
      <span className={cn("absolute left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-foreground", inset)} />
    </motion.div>
  )
}

function DialTicks({ range, marks }: { range: DialRange; marks: readonly AngleSliderMark[] }) {
  const markAngles = marks.map((mark) => valueToAngle(mark.value, range))
  const count = Math.round(360 / TICK_STEP_DEGREES)
  const ticks = Array.from({ length: count }, (_, index) => index * TICK_STEP_DEGREES)
  return (
    <svg aria-hidden="true" data-slot="angle-slider-ticks" viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} className="absolute inset-0 size-full">
      {ticks.map((angle) => {
        const major = markAngles.includes(angle)
        const outer = polarPoint(angle, RIM_RADIUS + 3, CENTRE)
        const inner = polarPoint(angle, RIM_RADIUS + 3 - (major ? MAJOR_TICK_LENGTH : TICK_LENGTH), CENTRE)
        return (
          <line
            key={angle}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            strokeWidth={major ? 1 : 0.5}
            className={major ? "stroke-foreground" : "stroke-muted-foreground/60"}
          />
        )
      })}
      {marks.map((mark) => {
        if (!mark.label) return null
        const point = polarPoint(valueToAngle(mark.value, range), LABEL_RADIUS, CENTRE)
        return (
          <text key={mark.value} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize={7.5} className="fill-muted-foreground">
            {mark.label}
          </text>
        )
      })}
    </svg>
  )
}

function GaugeArc({ range, rotation }: { range: DialRange; rotation: MotionValue<number> }) {
  const path = arcPath(range.start, range.sweep, TRACK_RADIUS, CENTRE)
  const filled = useTransform(rotation, (turned) => (turned - range.start) / range.sweep)
  return (
    <svg aria-hidden="true" data-slot="angle-slider-gauge" viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} className="absolute inset-0 size-full">
      <path d={path} fill="none" strokeWidth={GAUGE_STROKE} strokeLinecap="round" className="stroke-muted" />
      <motion.path
        d={path}
        fill="none"
        strokeWidth={GAUGE_STROKE}
        strokeLinecap="round"
        className="stroke-mise"
        style={{ pathLength: filled }}
      />
    </svg>
  )
}

export { DialRing, DialTicks, GaugeArc, Needle, RimThumb, type AngleSliderMark }
