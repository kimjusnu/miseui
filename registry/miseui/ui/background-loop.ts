import type * as React from "react"
import { useEffect, useState, useSyncExternalStore } from "react"
import { useReducedMotion } from "motion/react"

/**
 * The accent as a light source, held in a lightness band per theme. A near-black accent would read as smoke on a light
 * page and a dark blue would pull muted text under 4.5:1 where a beam crosses it, so the band's floor is 0.6.
 * Older browsers keep plain --mise, which is only a stronger tint.
 */
export const LIGHT_TOKEN_CLASS = [
  "[--mise-light:var(--mise)]",
  "supports-[color:oklch(from_red_l_c_h)]:[--mise-light:oklch(from_var(--mise)_clamp(0.6,l,0.76)_c_h)]",
  "dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-light:oklch(from_var(--mise)_clamp(0.62,l,0.82)_c_h)]",
].join(" ")

/** Before hydration the hook cannot know the preference yet. A paused animation holds its seeded frame. */
export const LOOP_CLASS = "motion-reduce:[animation-play-state:paused]!"

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}

function useTabVisible() {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  )
}

function useOnScreen(rootRef: React.RefObject<HTMLElement | null>, watching: boolean) {
  const [onScreen, setOnScreen] = useState(true)
  useEffect(() => {
    const root = rootRef.current
    if (!watching || !root || typeof IntersectionObserver === "undefined") return
    const view = new IntersectionObserver(([entry]) => setOnScreen(entry?.isIntersecting ?? true))
    view.observe(root)
    return () => view.disconnect()
  }, [rootRef, watching])
  return onScreen
}

interface PlaybackOptions {
  /** The owner's stop control. */
  paused?: boolean
  /** False when this look never moves, so nothing is watched at all. */
  loops?: boolean
}

/** `still` draws one finished frame. `playing` is only true on screen, in a visible tab and not paused. */
export function useBackgroundPlayback(rootRef: React.RefObject<HTMLElement | null>, { paused = false, loops = true }: PlaybackOptions) {
  const reduceMotion = useReducedMotion() ?? false
  const moving = loops && !reduceMotion
  const onScreen = useOnScreen(rootRef, moving)
  const tabVisible = useTabVisible()
  return { still: !moving, playing: moving && !paused && onScreen && tabVisible }
}

/** Longhands, because the shorthand would reset the play state each element reads from the layer. */
export function loopStyle(name: string, seconds: number, delay: number, timing = "linear", direction = "normal"): React.CSSProperties {
  return {
    animationName: name,
    animationDuration: `${seconds}s`,
    animationDelay: `${delay}s`,
    animationTimingFunction: timing,
    animationDirection: direction,
    animationIterationCount: "infinite",
    animationPlayState: "var(--mise-bg-play)",
  }
}

/** Set once on the layer, so pausing writes one property however many elements are moving. */
export function playStyle(playing: boolean) {
  return { "--mise-bg-play": playing ? "running" : "paused" } as React.CSSProperties
}
