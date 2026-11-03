import type * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { typingFrame, type TypingTimeline } from "@/registry/miseui/ui/typewriter-math"

/** Long gaps mean the page slept. Resuming should continue from where it stopped, not jump ahead. */
const MAX_FRAME_GAP_MS = 64

/** Writes only on change, so most frames touch nothing. */
function write(node: HTMLElement | null, text: string) {
  if (node && node.textContent !== text) node.textContent = text
}

function paint(visual: HTMLElement, timeline: TypingTimeline, clock: number) {
  const frame = typingFrame(timeline, clock)
  const { glyphs } = timeline.segments[frame.phrase]
  write(visual.querySelector("[data-slot='typewriter-text-typed']"), glyphs.slice(0, frame.count).join(""))
  write(visual.querySelector("[data-slot='typewriter-text-rest']"), glyphs.slice(frame.count).join(""))
  const caret = visual.querySelector<HTMLElement>("[data-slot='typewriter-text-caret']")
  if (caret) caret.style.opacity = String(frame.caret)
  return frame.done
}

interface PlayOptions {
  visualRef: React.RefObject<HTMLElement | null>
  timeline: TypingTimeline
  running: boolean
  reduceMotion: boolean
  /** A new structure means a fresh run. */
  runKey: string
}

/** One frame loop on one clock. The clock only advances while running, so a pause holds the exact letter it stopped on. */
function useTypewriterPlay({ visualRef, timeline, running, reduceMotion, runKey }: PlayOptions) {
  const clock = useRef(0)

  // Before paint, so the finished text from the first render never flashes ahead of the typing.
  useLayoutEffect(() => {
    clock.current = 0
    if (!reduceMotion && visualRef.current) paint(visualRef.current, timeline, 0)
  }, [visualRef, timeline, reduceMotion, runKey])

  useEffect(() => {
    const visual = visualRef.current
    if (reduceMotion || !running || !visual) return
    let frame = 0
    let last: number | null = null
    const tick = (now: number) => {
      clock.current += Math.min(now - (last ?? now), MAX_FRAME_GAP_MS)
      last = now
      frame = paint(visual, timeline, clock.current) ? 0 : requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [visualRef, timeline, running, reduceMotion, runKey])
}

/** True while something asks a loop to hold still: a pointer on it, focus in it, or a hidden tab. */
function useLoopHold(anchor: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-slot='typewriter-text']")
    if (!enabled || !root) return
    const onEnter = () => setHovered(true)
    const onLeave = () => setHovered(false)
    const onFocus = () => setFocused(true)
    const onBlur = () => setFocused(false)
    const onVisibility = () => setHidden(document.hidden)
    root.addEventListener("mouseenter", onEnter)
    root.addEventListener("mouseleave", onLeave)
    root.addEventListener("focusin", onFocus)
    root.addEventListener("focusout", onBlur)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      root.removeEventListener("mouseenter", onEnter)
      root.removeEventListener("mouseleave", onLeave)
      root.removeEventListener("focusin", onFocus)
      root.removeEventListener("focusout", onBlur)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [anchor, enabled])

  return hovered || focused || hidden
}

export { useLoopHold, useTypewriterPlay }
