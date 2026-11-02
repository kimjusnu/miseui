import type * as React from "react"
import { useEffect, useRef } from "react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { shortestDigitDelta, wheelOffset } from "@/registry/miseui/ui/number-input-math"
import { useHoldRepeat } from "@/registry/miseui/ui/number-input-state"
import { cn } from "@/registry/miseui/lib/utils"

const WHEEL_FACES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

type StepButtonProps = Omit<React.ComponentProps<"button">, "onClick" | "type"> & {
  onStep: () => void
}

/**
 * Out of the tab order on purpose: the field already takes the arrow keys, which is the spinbutton pattern.
 * `detail === 0` is a click with no pointer behind it, from a screen reader, which pointerdown never sees.
 */
function StepButton({ onStep, disabled = false, className, ...props }: StepButtonProps) {
  const hold = useHoldRepeat(onStep, disabled)
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={disabled}
      data-slot="number-input-step"
      className={cn(
        "relative flex shrink-0 touch-manipulation items-center justify-center select-none [-webkit-touch-callout:none]",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
        "disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5",
        className,
      )}
      // A mouse press would otherwise pull focus out of the field, and the arrow keys with it.
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (event.detail === 0) onStep()
      }}
      {...hold}
      {...props}
    />
  )
}

function WheelFace({ face, position }: { face: number; position: MotionValue<number> }) {
  const y = useTransform(position, (value) => `${wheelOffset(face, value) * 100}%`)
  return (
    <motion.span className="absolute inset-x-0 top-0 text-center" style={{ y }}>
      {face}
    </motion.span>
  )
}

function RollingDigit({ digit }: { digit: number }) {
  const reduceMotion = useReducedMotion() ?? false
  const position = useMotionValue(digit)
  const target = useRef(digit)
  useEffect(() => {
    const delta = shortestDigitDelta(((target.current % 10) + 10) % 10, digit)
    if (delta === 0) return
    target.current += delta
    if (reduceMotion) {
      position.set(target.current)
      return
    }
    const controls = animate(position, target.current, SPRING_DEFAULT)
    return () => controls.stop()
  }, [digit, position, reduceMotion])
  return (
    <span data-slot="number-input-digit" className="relative inline-block overflow-hidden">
      <span className="invisible">0</span>
      {WHEEL_FACES.map((face) => (
        <WheelFace key={face} face={face} position={position} />
      ))}
    </span>
  )
}

/** Sits over the field while nobody is typing, and the field keeps the real text for selection and assistive tech. */
function RollingText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const characters = Array.from(text)
  return (
    <span
      aria-hidden="true"
      data-slot="number-input-roll"
      style={style}
      className={cn("pointer-events-none absolute inset-0 flex items-center whitespace-pre tabular-nums", className)}
    >
      {/* Keyed from the right, so the units keep rolling when a thousands column appears on the left. */}
      {characters.map((character, index) => {
        const key = characters.length - index
        return /[0-9]/.test(character) ? (
          <RollingDigit key={key} digit={Number(character)} />
        ) : (
          <span key={key}>{character}</span>
        )
      })}
    </span>
  )
}

export { RollingText, StepButton }
