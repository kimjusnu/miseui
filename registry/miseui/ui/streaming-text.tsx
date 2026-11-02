import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"

/** Characters per second. Close to a brisk reading pace, so text never races ahead of the eye. */
const DEFAULT_SPEED = 60
const MIN_SPEED = 1
const MS_PER_SECOND = 1000
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

interface StreamingTextProps extends React.ComponentProps<"span"> {
  /** Full text so far. Grow it as tokens arrive; the reveal keeps pace from where it left off. */
  text: string
  /** Characters revealed per second. */
  speed?: number
  /** Fires once each time every character of `text` has been shown. */
  onDone?: () => void
  /** Blinking caret at the end of the visible text while characters are still arriving. */
  cursor?: boolean
}

interface RevealState {
  readonly text: string
  readonly count: number
}

/**
 * Carry the reveal across a `text` change. If what the user has already read is still the
 * prefix of the new text we continue from there; otherwise the text is new and starts over.
 * With reduced motion everything is shown at once, so there is nothing to carry.
 */
function carryOver(previous: RevealState, text: string, reduceMotion: boolean): RevealState {
  if (reduceMotion) return { text, count: text.length }
  const shown = previous.text.slice(0, previous.count)
  return { text, count: text.startsWith(shown) ? previous.count : 0 }
}

/** Read once on mount, matching motion's hook. motion itself is not needed here, so we skip the dependency. */
function usePrefersReducedMotion() {
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
  )
  return prefersReducedMotion
}

function StreamingText({
  text,
  speed = DEFAULT_SPEED,
  onDone,
  cursor = true,
  className,
  ...props
}: StreamingTextProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [state, setState] = useState<RevealState>(() => ({ text, count: reduceMotion ? text.length : 0 }))
  if (state.text !== text) setState((previous) => carryOver(previous, text, reduceMotion))

  const done = state.count >= state.text.length
  const visible = state.text.slice(0, state.count)

  useEffect(() => {
    if (done || reduceMotion) return
    const intervalMs = MS_PER_SECOND / Math.max(speed, MIN_SPEED)
    const id = window.setInterval(() => {
      setState((previous) =>
        previous.count < previous.text.length ? { ...previous, count: previous.count + 1 } : previous,
      )
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [done, reduceMotion, speed])

  const doneFiredRef = useRef(false)
  useEffect(() => {
    if (!done) {
      doneFiredRef.current = false
      return
    }
    if (doneFiredRef.current) return
    doneFiredRef.current = true
    onDone?.()
  }, [done, onDone])

  return (
    <span
      aria-live="polite"
      aria-busy={!done}
      data-slot="streaming-text"
      data-streaming={done ? "false" : "true"}
      className={cn("whitespace-pre-wrap text-foreground", className)}
      {...props}
    >
      {visible}
      {cursor && !done ? (
        <span
          aria-hidden="true"
          data-testid="streaming-cursor"
          className="ml-px inline-block h-[1em] w-0.5 translate-y-[0.15em] animate-pulse rounded-full bg-mise motion-reduce:animate-none"
        />
      ) : null}
    </span>
  )
}

export { StreamingText, type StreamingTextProps }
