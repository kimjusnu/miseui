import type * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { Button } from "@/registry/miseui/ui/button"
import { BEFORE_START, decryptPlan, type DecryptPlan, type DecryptTextVariant } from "@/registry/miseui/ui/decrypt-math"
import { DecryptVisual, createDecryptPainter } from "@/registry/miseui/ui/decrypt-parts"
import { useTimeline } from "@/registry/miseui/ui/scramble-play"
import { cn } from "@/registry/miseui/lib/utils"

type DecryptTextEffect = "press"
type DecryptTextTrigger = "view" | "mount"
type DecryptTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

const DEFAULT_SEED = 11
const VIEW_MARGIN = "0px 0px -10% 0px"
/** The encrypted state is the point, so on its own it stays long enough to be seen as a state. */
const HOLD_MS = 320

interface PlaybackOptions {
  visualRef: React.RefObject<HTMLSpanElement | null>
  plan: DecryptPlan
  variant: DecryptTextVariant
  press: boolean
  locked: boolean
  due: boolean
  reduceMotion: boolean
}

function useDecryptPlayback({ visualRef, plan, variant, press, locked, due, reduceMotion }: PlaybackOptions) {
  const { play, stop } = useTimeline()
  // A press text that opens already revealed has nothing to decode.
  const wasLocked = useRef(locked)

  useLayoutEffect(() => {
    if (reduceMotion || !visualRef.current || (press && !locked && !wasLocked.current)) return
    createDecryptPainter(visualRef.current, plan, variant)(BEFORE_START)
  }, [visualRef, plan, variant, press, locked, reduceMotion])

  useEffect(() => {
    const pressedOpen = wasLocked.current && !locked
    wasLocked.current = locked
    if (reduceMotion || locked || !visualRef.current) return
    if (press ? !pressedOpen : !due) return
    const paint = createDecryptPainter(visualRef.current, plan, variant)
    const hold = press ? 0 : HOLD_MS
    play((elapsed) => paint(elapsed - hold))
    return stop
  }, [visualRef, plan, variant, press, locked, due, reduceMotion, play, stop])
}

function useRevealed(revealed: boolean | undefined, defaultRevealed: boolean, onChange?: (revealed: boolean) => void) {
  const [inner, setInner] = useState(defaultRevealed)
  const isRevealed = revealed ?? inner
  const toggle = () => {
    setInner(!isRevealed)
    onChange?.(!isRevealed)
  }
  return [isRevealed, toggle] as const
}

type DecryptTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  text: string
  /** The element to render. A heading stays a heading. */
  as?: DecryptTextTag
  /** `dots` password dots replaced letter by letter, `redact` a bar over each word retracts in turn, `cipher` muted monospace letters lock one by one, `scan` a line crosses and decodes what it passes. */
  variant?: DecryptTextVariant
  /** `press` stays encrypted behind a real button and keeps the text from assistive tech until then. */
  effect?: DecryptTextEffect
  /** `view` plays once when first seen, `mount` plays right away. Ignored by `press`. */
  trigger?: DecryptTextTrigger
  /** The same seed gives the same cipher. */
  seed?: number
  revealed?: boolean
  defaultRevealed?: boolean
  onRevealedChange?: (revealed: boolean) => void
  /** What the button says while encrypted. */
  label?: string
  /** What the button says once decoded. */
  hideLabel?: string
}

function DecryptText({
  text,
  as: Tag = "span",
  variant = "dots",
  effect,
  trigger = "view",
  seed = DEFAULT_SEED,
  revealed,
  defaultRevealed = false,
  onRevealedChange,
  label = "Decrypt",
  hideLabel = "Hide",
  className,
  ...props
}: DecryptTextProps) {
  const press = effect === "press"
  const reduceMotion = useReducedMotion() ?? false
  const visualRef = useRef<HTMLSpanElement>(null)
  const seen = useInView(visualRef, { once: true, margin: VIEW_MARGIN })
  const [isRevealed, toggle] = useRevealed(revealed, defaultRevealed, onRevealedChange)
  const locked = press && !isRevealed
  const plan = useMemo(() => decryptPlan(text, variant, seed), [text, variant, seed])
  useDecryptPlayback({ visualRef, plan, variant, press, locked, due: trigger === "mount" || seen, reduceMotion })

  const root = { "data-slot": "decrypt-text", "data-variant": variant, "data-effect": effect, "data-revealed": press ? String(isRevealed) : undefined }
  const faceClass = variant === "cipher" ? "font-mono" : undefined
  const visual = <DecryptVisual runKey={`${variant}:${seed}:${reduceMotion}:${text}`} plan={plan} variant={variant} locked={locked} visualRef={visualRef} />

  if (!press) {
    return (
      <Tag {...props} {...root} className={cn("relative", faceClass, className)}>
        {/* Assistive tech gets the sentence once, never the cipher. */}
        <span className="sr-only select-none">{text}</span>
        {visual}
      </Tag>
    )
  }
  return (
    <div {...props} {...root} className={cn("grid grid-cols-[minmax(0,1fr)] gap-2", className)}>
      <Tag className={cn("relative", faceClass)}>
        {/* Empty until pressed, then read once. The live region itself never moves: the letters on screen are hidden from it. */}
        <span className="sr-only select-none" aria-live="polite">
          {isRevealed ? text : ""}
        </span>
        {visual}
      </Tag>
      {/* The same button stays and only its label changes, so keyboard focus has nowhere to get lost. */}
      <Button type="button" variant="outline" size="sm" className="justify-self-start font-sans pointer-coarse:h-10" onClick={toggle}>
        {isRevealed ? hideLabel : label}
      </Button>
    </div>
  )
}

export { DecryptText, type DecryptTextProps, type DecryptTextVariant, type DecryptTextEffect, type DecryptTextTrigger }
