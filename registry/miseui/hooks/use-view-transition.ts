import { useCallback, useEffect } from "react"
import { flushSync } from "react-dom"

/**
 * Presets name the spatial story of a navigation, so the user keeps their
 * place: siblings slide along one axis, details scale up from the list, a
 * replaced screen fades through a neutral frame.
 */
export type ViewTransitionPreset = "fade-through" | "shared-axis-x" | "shared-axis-y" | "scale-up" | "blur-in"

export const STYLE_ELEMENT_ID = "miseui-view-transitions"

const DURATION_MS = 240
const EASE = "cubic-bezier(0.2, 0, 0, 1)"
const AXIS_OFFSET = "24px"
const SCALE_FROM = 0.96
const BLUR_PX = 12

const PRESET_CSS = `
@keyframes miseui-vt-fade-out { to { opacity: 0 } }
@keyframes miseui-vt-fade-in { from { opacity: 0 } }
@keyframes miseui-vt-out-left { to { opacity: 0; transform: translateX(-${AXIS_OFFSET}) } }
@keyframes miseui-vt-in-right { from { opacity: 0; transform: translateX(${AXIS_OFFSET}) } }
@keyframes miseui-vt-out-up { to { opacity: 0; transform: translateY(-${AXIS_OFFSET}) } }
@keyframes miseui-vt-in-down { from { opacity: 0; transform: translateY(${AXIS_OFFSET}) } }
@keyframes miseui-vt-scale-in { from { opacity: 0; transform: scale(${SCALE_FROM}) } }
@keyframes miseui-vt-blur-in { from { opacity: 0; filter: blur(${BLUR_PX}px) } }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: ${DURATION_MS}ms; animation-timing-function: ${EASE}; }
html[data-transition="fade-through"]::view-transition-old(root) { animation-name: miseui-vt-fade-out; animation-duration: ${DURATION_MS / 2}ms }
html[data-transition="fade-through"]::view-transition-new(root) { animation-name: miseui-vt-fade-in; animation-delay: ${DURATION_MS / 2}ms; animation-fill-mode: backwards }
html[data-transition="shared-axis-x"]::view-transition-old(root) { animation-name: miseui-vt-out-left }
html[data-transition="shared-axis-x"]::view-transition-new(root) { animation-name: miseui-vt-in-right }
html[data-transition="shared-axis-y"]::view-transition-old(root) { animation-name: miseui-vt-out-up }
html[data-transition="shared-axis-y"]::view-transition-new(root) { animation-name: miseui-vt-in-down }
html[data-transition="scale-up"]::view-transition-old(root) { animation-name: miseui-vt-fade-out }
html[data-transition="scale-up"]::view-transition-new(root) { animation-name: miseui-vt-scale-in }
html[data-transition="blur-in"]::view-transition-old(root) { animation-name: miseui-vt-fade-out }
html[data-transition="blur-in"]::view-transition-new(root) { animation-name: miseui-vt-blur-in }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root) { animation-name: miseui-vt-fade-out !important; transform: none !important }
  ::view-transition-new(root) { animation-name: miseui-vt-fade-in !important; transform: none !important; filter: none !important }
}
`

type StartViewTransition = (update: () => void) => { finished: Promise<void> }

function ensureStylesheet() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ELEMENT_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ELEMENT_ID
  style.textContent = PRESET_CSS
  document.head.append(style)
}

/**
 * Returns `transition(update)`: runs `update` inside a View Transition when the
 * browser supports it, otherwise immediately. React state changes inside
 * `update` are flushed synchronously so the new frame is captured.
 */
export function useViewTransition(preset: ViewTransitionPreset) {
  useEffect(ensureStylesheet, [])

  return useCallback(
    (update: () => void) => {
      const doc = document as Document & { startViewTransition?: StartViewTransition }
      const start = doc.startViewTransition
      if (typeof start !== "function") {
        update()
        return
      }
      document.documentElement.dataset.transition = preset
      const transition = start.call(doc, () => flushSync(update))
      void transition.finished.finally(() => {
        delete document.documentElement.dataset.transition
      })
    },
    [preset],
  )
}
