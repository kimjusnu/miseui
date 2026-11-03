import { useEffect, useRef, useState } from "react"

/** First sentence of a plain string, or a cut at a word boundary: what a screen reader hears before `more` is opened. */
function previewOfText(text: string, maxLength = 120) {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  const sentenceEnd = trimmed.search(/[.!?](\s|$)/)
  if (sentenceEnd >= 0 && sentenceEnd < maxLength) return trimmed.slice(0, sentenceEnd + 1)
  const cut = trimmed.lastIndexOf(" ", maxLength)
  return `${trimmed.slice(0, cut > 0 ? cut : maxLength)}...`
}

interface RevealOptions {
  revealed?: boolean
  defaultRevealed?: boolean
  onRevealedChange?: (revealed: boolean) => void
}

function useReveal({ revealed, defaultRevealed = false, onRevealedChange }: RevealOptions) {
  const [uncontrolled, setUncontrolled] = useState(defaultRevealed)
  const current = revealed ?? uncontrolled
  const setRevealed = (next: boolean) => {
    setUncontrolled(next)
    onRevealedChange?.(next)
  }
  return [current, setRevealed] as const
}

/**
 * The button that reveals is gone once it has been pressed, which would drop keyboard focus to the top of the page.
 * Focus moves to the revealed content instead, but only when it was a press that revealed it.
 */
function useFocusOnReveal(revealed: boolean) {
  const target = useRef<HTMLElement | null>(null)
  const pressed = useRef(false)
  useEffect(() => {
    if (!revealed || !pressed.current) return
    pressed.current = false
    target.current?.focus()
  }, [revealed])
  return { target, markPressed: () => (pressed.current = true) }
}

/** The fade and the button only make sense when something really runs past the collapsed height. */
function useOverflowing(node: HTMLElement | null, collapsedHeight: number) {
  const [overflowing, setOverflowing] = useState(true)
  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return
    const inner = node.firstElementChild
    const measure = () => setOverflowing((inner?.scrollHeight ?? node.scrollHeight) > collapsedHeight + 1)
    const observer = new ResizeObserver(measure)
    observer.observe(inner ?? node)
    return () => observer.disconnect()
  }, [node, collapsedHeight])
  return overflowing
}

export { previewOfText, useFocusOnReveal, useOverflowing, useReveal }
