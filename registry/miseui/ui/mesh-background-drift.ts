import type * as React from "react"
import { useRef, useSyncExternalStore } from "react"
import { useInView, useReducedMotion } from "motion/react"

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

/** Longhands, because React warns when a shorthand and one of its longhands are updated together. `steady` is for a full turn, which has no way back to ease into. */
function driftStyle(name: string, seconds: number, playing: boolean, steady = false): React.CSSProperties {
  return {
    animationName: name,
    animationDuration: `${seconds}s`,
    animationTimingFunction: steady ? "linear" : "ease-in-out",
    animationIterationCount: "infinite",
    animationDirection: steady ? "normal" : "alternate",
    animationPlayState: playing ? "running" : "paused",
    willChange: "transform",
  }
}

/** Reduced motion turns the whole effect off, which leaves the same layers standing still: a finished picture. The ref goes on the drawing layer, so the owner keeps theirs on the root. */
function useDrift(requested: boolean, paused: boolean) {
  const reduceMotion = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const tabVisible = useTabVisible()
  const moving = requested && !reduceMotion
  return { ref, moving, playing: moving && !paused && inView && tabVisible }
}

export { driftStyle, useDrift }
