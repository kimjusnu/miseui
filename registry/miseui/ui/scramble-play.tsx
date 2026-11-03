import type * as React from "react"
import { useCallback, useEffect, useRef } from "react"
import { cn } from "@/registry/miseui/lib/utils"

/** Draws one moment and says whether the run is over. */
type FramePainter = (elapsedMs: number) => boolean

/** One requestAnimationFrame per component. Painting goes straight to the DOM, so nothing re-renders per frame. */
function useTimeline() {
  const frame = useRef(0)
  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
  }, [])
  const play = useCallback(
    (paint: FramePainter) => {
      stop()
      let origin: number | null = null
      const tick = (now: number) => {
        origin = origin ?? now
        frame.current = paint(now - origin) ? 0 : requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    },
    [stop],
  )
  const isRunning = useCallback(() => frame.current !== 0, [])
  useEffect(() => stop, [stop])
  return { play, stop, isRunning }
}

const REPLAY_HOST = "a, button, [role='link'], [role='button']"

/**
 * Text inside a link cannot take focus itself, and the link is usually bigger than the text.
 * So the hover and focus that replay it are listened for on the nearest control around it.
 */
function useReplayHost(anchor: React.RefObject<HTMLElement | null>, enabled: boolean, replay: () => void) {
  const latest = useRef(replay)
  useEffect(() => {
    latest.current = replay
  })
  useEffect(() => {
    const element = anchor.current
    if (!enabled || !element) return
    const host = element.closest<HTMLElement>(REPLAY_HOST) ?? element.parentElement ?? element
    const onEnter = () => latest.current()
    // A pointer that clicked already played it on the way in. Only keyboard focus is news.
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) latest.current()
    }
    host.addEventListener("mouseenter", onEnter)
    host.addEventListener("focusin", onFocus)
    return () => {
      host.removeEventListener("mouseenter", onEnter)
      host.removeEventListener("focusin", onFocus)
    }
  }, [anchor, enabled])
}

interface GlyphCellProps {
  target: string
  /** Shown instead of the letter from the very first render, for text that starts hidden. */
  before?: string
  layerClassName?: string
  children?: React.ReactNode
}

/**
 * The real letter sizes the cell, so a proportional font never jitters and lines never reflow.
 * The cell stays inline: an inline-block would stop a link's underline and break kerning at every letter.
 * The stand-in lies over it and is centred by flex, because text-center lets a wider glyph spill only to the right.
 * An inline box is as tall as the font rather than the line, so the stand-in needs a normal line height to share its baseline.
 * At rest the layer is empty, which leaves plain letters that select and copy normally.
 */
function GlyphCell({ target, before, layerClassName, children }: GlyphCellProps) {
  return (
    <span data-slot="glyph-cell" className="relative">
      <span data-slot="glyph-letter" className={before === undefined ? undefined : "invisible"}>
        {target}
      </span>
      <span data-slot="glyph-layer" className={cn("pointer-events-none absolute inset-0 flex justify-center leading-[normal] select-none", layerClassName)}>
        {before}
      </span>
      {children}
    </span>
  )
}

function glyphCells(visual: HTMLElement) {
  return Array.from(visual.querySelectorAll<HTMLElement>("[data-slot='glyph-cell']"))
}

/**
 * Null puts the real letter back. Writes only on change: most cells are idle most frames.
 * Hidden by colour, not visibility, so an underline from a link around it keeps drawing under the noise.
 */
function paintGlyph(cell: HTMLElement, glyph: string | null) {
  const letter = cell.children[0] as HTMLElement
  const layer = cell.children[1] as HTMLElement
  const next = glyph ?? ""
  if (layer.textContent !== next) layer.textContent = next
  const color = glyph === null ? "" : "transparent"
  if (letter.style.color !== color) letter.style.color = color
}

interface WordRowProps {
  last: boolean
  children: React.ReactNode
}

/** A word holds together, so a line only ever breaks at a real space. */
function WordRow({ last, children }: WordRowProps) {
  return (
    <span>
      <span data-slot="glyph-word" className="whitespace-nowrap">
        {children}
      </span>
      {last ? null : " "}
    </span>
  )
}

export { GlyphCell, WordRow, glyphCells, paintGlyph, useReplayHost, useTimeline, type FramePainter }
