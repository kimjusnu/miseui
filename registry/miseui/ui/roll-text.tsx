import type * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type RollTextVariant = "word" | "letters" | "flip"
type RollTextEffect = "change"
type RollTextTrigger = "self" | "parent"

const STEP_MS = 18
/** A long label must not still be moving after the pointer has left, so the whole wave has a ceiling. */
const MAX_WAVE_MS = 240

function letterDelay(index: number, count: number) {
  const step = Math.min(STEP_MS, MAX_WAVE_MS / Math.max(1, count))
  return Math.round(index * step)
}

/** A focused link rolls too: keyboard users deserve the same answer as a pointer. `in-` reaches any focused ancestor. */
const ROLL_UP: Record<RollTextTrigger, string> = {
  self: "group-hover/roll:-translate-y-full in-focus-visible:-translate-y-full",
  parent: "group-hover:-translate-y-full in-focus-visible:-translate-y-full",
}

const TURN_OVER: Record<RollTextTrigger, string> = {
  self: "group-hover/roll:[transform:rotateX(90deg)] in-focus-visible:[transform:rotateX(90deg)]",
  parent: "group-hover:[transform:rotateX(90deg)] in-focus-visible:[transform:rotateX(90deg)]",
}

const TRAVEL = "transition-transform duration-(--duration-base) ease-(--ease-mise)"
/** Room for descenders inside the clip. The copy waiting below starts in its own empty line box, so nothing peeks in. */
const CLIP = "overflow-y-clip pb-[0.1em] -mb-[0.1em]"

interface VisualProps {
  text: string
  trigger: RollTextTrigger
}

function RollWord({ text, trigger }: VisualProps) {
  return (
    <span data-slot="roll-text-clip" className={cn("block", CLIP)}>
      <span className={cn("relative block", TRAVEL, ROLL_UP[trigger])}>
        <span className="block">{text}</span>
        <span data-slot="roll-text-copy" className="absolute inset-x-0 top-full block">
          {text}
        </span>
      </span>
    </span>
  )
}

function RollLetters({ text, trigger }: VisualProps) {
  const letters = Array.from(text)
  const words = text.split(" ")
  const starts = words.map((_, position) => words.slice(0, position).reduce((sum, word) => sum + Array.from(word).length + 1, 0))
  return (
    <span className="block">
      {words.map((word, position) => (
        <span key={`${word}-${starts[position]}`}>
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((letter, offset) => {
              const index = starts[position] + offset
              return (
                <span key={index} data-slot="roll-text-letter" className={cn("inline-block", CLIP)}>
                  <span className={cn("relative inline-block", TRAVEL, ROLL_UP[trigger])} style={{ transitionDelay: `${letterDelay(index, letters.length)}ms` }}>
                    <span className="inline-block">{letter}</span>
                    <span data-slot="roll-text-copy" className="absolute inset-x-0 top-full inline-block">
                      {letter}
                    </span>
                  </span>
                </span>
              )
            })}
          </span>
          {position < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  )
}

/**
 * A real cube: the second copy is the floor, hinged at the bottom edge of the first and folded back out of sight.
 * The rotor turns about the centre of that cube, which is half a line behind the text.
 */
function RollFlip({ text, trigger }: VisualProps) {
  return (
    <span data-slot="roll-text-stage" className="block [perspective:20em]">
      <span className={cn("relative block origin-[50%_50%_-0.5lh] [transform-style:preserve-3d]", TRAVEL, TURN_OVER[trigger])}>
        <span className="block backface-hidden">{text}</span>
        <span data-slot="roll-text-copy" className="absolute inset-x-0 top-full block origin-top backface-hidden [transform:rotateX(-90deg)]">
          {text}
        </span>
      </span>
    </span>
  )
}

function RollChange({ text }: { text: string }) {
  return (
    <span data-slot="roll-text-clip" className={cn("relative block", CLIP)}>
      {/* popLayout takes the old word out of the flow, or the box would hold both widths while they pass. */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={text} className="block" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={SPRING_DEFAULT}>
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

const VISUAL: Record<RollTextVariant, (props: VisualProps) => React.JSX.Element> = {
  word: RollWord,
  letters: RollLetters,
  flip: RollFlip,
}

type RollTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  text: string
  /** `word` one block rolls up, `letters` a wave along the label, `flip` the label turns over like a cube. */
  variant?: RollTextVariant
  /** `change` stops reacting to hover and rolls whenever `text` changes, for a label that reports a new state. */
  effect?: RollTextEffect
  /** `parent` rolls when an ancestor with the `group` class is hovered, so a whole row can drive one label. */
  trigger?: RollTextTrigger
}

function RollText({ text, variant = "word", effect, trigger = "self", className, ...props }: RollTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  const root = { ...props, "data-slot": "roll-text", "data-variant": variant, "data-effect": effect }
  if (reduceMotion) {
    return (
      <span {...root} data-reduced="true" className={cn("inline-block max-w-full", className)}>
        {text}
      </span>
    )
  }
  const Visual = VISUAL[variant]
  return (
    <span {...root} className={cn("group/roll relative inline-block max-w-full", className)}>
      {/* Letters and a second copy would be read as stutter, so assistive tech gets the plain label once. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="block">
        {effect === "change" ? <RollChange text={text} /> : <Visual text={text} trigger={trigger} />}
      </span>
    </span>
  )
}

export { RollText, letterDelay, type RollTextProps, type RollTextVariant, type RollTextEffect, type RollTextTrigger }
