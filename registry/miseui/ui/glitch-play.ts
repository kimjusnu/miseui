import type * as React from "react"
import { useCallback, useEffect, useRef } from "react"
import { BANDS, MIN_REPLAY_MS, frameAt, type GlitchBurst, type GlitchFrame, type GlitchTextVariant } from "@/registry/miseui/ui/glitch-math"

const OFF_OPACITY = "0.12"

type Painter = (frame: GlitchFrame | null) => void

function all(root: HTMLElement, slot: string) {
  return Array.from(root.querySelectorAll<HTMLElement>(`[data-slot='${slot}']`))
}

function paintFringes(root: HTMLElement): Painter {
  const [red, cyan] = all(root, "glitch-text-fringe")
  return (frame) => {
    const offset = frame?.fringe ?? 0
    red.style.visibility = frame ? "visible" : ""
    cyan.style.visibility = frame ? "visible" : ""
    red.style.transform = frame ? `translateX(${offset}em)` : ""
    cyan.style.transform = frame ? `translateX(${-offset}em)` : ""
  }
}

/** The whole line is rebuilt from bands during the burst, so the real text is only hidden for those few frames. */
function paintBands(root: HTMLElement): Painter {
  const bands = all(root, "glitch-text-band")
  const content = root.querySelector<HTMLElement>("[data-slot='glitch-text-content']")
  return (frame) => {
    if (content) content.style.opacity = frame ? "0" : ""
    bands.forEach((band, index) => {
      band.style.visibility = frame ? "visible" : ""
      band.style.transform = frame ? `translateX(${frame.bands[index % BANDS.length]}em)` : ""
    })
  }
}

function paintLetters(root: HTMLElement): Painter {
  const letters = all(root, "glitch-text-letter")
  return (frame) => {
    letters.forEach((letter, index) => {
      letter.style.opacity = frame?.off.includes(index) ? OFF_OPACITY : ""
    })
  }
}

function paintSkew(root: HTMLElement): Painter {
  const content = root.querySelector<HTMLElement>("[data-slot='glitch-text-content']")
  return (frame) => {
    if (content) content.style.transform = frame ? `translateX(${frame.shift}em) skewX(${frame.skew}deg)` : ""
  }
}

const PAINTERS: Record<GlitchTextVariant, (root: HTMLElement) => Painter> = {
  split: paintFringes,
  slice: paintBands,
  flicker: paintLetters,
  skew: paintSkew,
}

interface BurstOptions {
  anchor: React.RefObject<HTMLElement | null>
  variant: GlitchTextVariant
  burst: GlitchBurst
}

/** One frame loop per component, ending in a clean element with nothing left behind. */
function useBurst({ anchor, variant, burst }: BurstOptions) {
  const frame = useRef(0)
  const lastStart = useRef(Number.NEGATIVE_INFINITY)
  const painter = useRef<Painter | null>(null)

  const stop = useCallback(() => {
    if (frame.current === 0) return
    cancelAnimationFrame(frame.current)
    frame.current = 0
    // A burst cut short showed nothing worth a cool-down (StrictMode cuts the first one), and it must not leave a pose behind.
    lastStart.current = Number.NEGATIVE_INFINITY
    painter.current?.(null)
  }, [])

  const play = useCallback(() => {
    const root = anchor.current
    const moment = performance.now()
    if (!root || frame.current !== 0 || moment - lastStart.current < MIN_REPLAY_MS) return
    lastStart.current = moment
    const paint = PAINTERS[variant](root)
    painter.current = paint
    let origin: number | null = null
    let held: GlitchFrame | null = null
    const tick = (now: number) => {
      origin = origin ?? now
      const current = frameAt(burst, now - origin)
      // Only on a new pose: the point is that it jumps, and the frames between have nothing to do.
      if (current !== held) paint(current)
      held = current
      frame.current = current ? requestAnimationFrame(tick) : 0
    }
    frame.current = requestAnimationFrame(tick)
  }, [anchor, variant, burst])

  useEffect(() => stop, [stop])
  return { play, stop }
}

const REPLAY_HOST = "a, button, [role='link'], [role='button']"

/** Listens on the link or button around the text, since text cannot take focus and the control is usually bigger. */
function useHoverReplay(anchor: React.RefObject<HTMLElement | null>, enabled: boolean, play: () => void) {
  useEffect(() => {
    const root = anchor.current
    if (!enabled || !root) return
    const host = root.closest<HTMLElement>(REPLAY_HOST) ?? root
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) play()
    }
    host.addEventListener("mouseenter", play)
    host.addEventListener("focusin", onFocus)
    return () => {
      host.removeEventListener("mouseenter", play)
      host.removeEventListener("focusin", onFocus)
    }
  }, [anchor, enabled, play])
}

export { useBurst, useHoverReplay }
