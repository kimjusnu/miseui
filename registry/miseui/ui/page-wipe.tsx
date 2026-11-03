import type * as React from "react"
import { useCallback, useEffect } from "react"
import { useViewTransition } from "@/registry/miseui/hooks/use-view-transition"
import { cn } from "@/registry/miseui/lib/utils"

type PageWipeVariant = "curtain" | "sweep" | "iris"
type PageWipeEffect = "recede"

const PAGE_WIPE_STYLE_ID = "miseui-page-wipes"

const EASE_THROUGH = "cubic-bezier(0.76, 0, 0.24, 1)"
const CURTAIN_LEG_MS = 320
const SWEEP_MS = 560
const IRIS_MS = 520
const RECEDE_SCALE = 0.96
const RECEDE_LIGHT = 0.8

/**
 * Both pseudo-elements are visible at once in a wipe, so the default plus-lighter blend would wash them out.
 * The old page dims under a sweep or iris because two pages often share most of their pixels, and then the edge cannot be seen.
 */
const WIPE_CSS = `
@keyframes miseui-wipe-cover { to { clip-path: inset(0 0 100% 0) } }
@keyframes miseui-wipe-lift { from { clip-path: inset(100% 0 0 0) } to { clip-path: inset(0) } }
@keyframes miseui-wipe-sweep {
  from { clip-path: polygon(-20% 0, -20% 0, -40% 100%, -40% 100%) }
  to { clip-path: polygon(-20% 0, 120% 0, 100% 100%, -40% 100%) }
}
@keyframes miseui-wipe-iris {
  from { clip-path: circle(0 at var(--page-wipe-x, 50%) var(--page-wipe-y, 50%)) }
  to { clip-path: circle(150vmax at var(--page-wipe-x, 50%) var(--page-wipe-y, 50%)) }
}
@keyframes miseui-wipe-dim { to { filter: brightness(${RECEDE_LIGHT}) } }
@keyframes miseui-wipe-recede { to { transform: scale(${RECEDE_SCALE}); filter: brightness(${RECEDE_LIGHT}) } }
@media (prefers-reduced-motion: no-preference) {
  html[data-transition][data-page-wipe]::view-transition-old(root),
  html[data-transition][data-page-wipe]::view-transition-new(root) { mix-blend-mode: normal; animation-delay: 0ms; animation-fill-mode: both }
  html[data-transition][data-page-wipe]::view-transition { background: var(--background) }
  html[data-transition][data-page-wipe="curtain"]::view-transition { background: var(--mise) }
  html[data-transition][data-page-wipe="curtain"]::view-transition-old(root) { animation: miseui-wipe-cover ${CURTAIN_LEG_MS}ms ${EASE_THROUGH} both }
  html[data-transition][data-page-wipe="curtain"]::view-transition-new(root) { animation: miseui-wipe-lift ${CURTAIN_LEG_MS}ms ${EASE_THROUGH} ${CURTAIN_LEG_MS}ms both }
  html[data-transition][data-page-wipe="sweep"]::view-transition-old(root) { animation: miseui-wipe-dim ${SWEEP_MS}ms ${EASE_THROUGH} both }
  html[data-transition][data-page-wipe="sweep"]::view-transition-new(root) { animation: miseui-wipe-sweep ${SWEEP_MS}ms ${EASE_THROUGH} both }
  html[data-transition][data-page-wipe="iris"]::view-transition-old(root) { animation: miseui-wipe-dim ${IRIS_MS}ms ${EASE_THROUGH} both }
  html[data-transition][data-page-wipe="iris"]::view-transition-new(root) { animation: miseui-wipe-iris ${IRIS_MS}ms ${EASE_THROUGH} both }
  html[data-transition][data-page-wipe="curtain"][data-page-wipe-effect="recede"]::view-transition-old(root) {
    animation: miseui-wipe-cover ${CURTAIN_LEG_MS}ms ${EASE_THROUGH} both, miseui-wipe-recede ${CURTAIN_LEG_MS}ms ${EASE_THROUGH} both
  }
  html[data-transition][data-page-wipe="sweep"][data-page-wipe-effect="recede"]::view-transition-old(root) { animation: miseui-wipe-recede ${SWEEP_MS}ms ${EASE_THROUGH} both }
  html[data-transition][data-page-wipe="iris"][data-page-wipe-effect="recede"]::view-transition-old(root) { animation: miseui-wipe-recede ${IRIS_MS}ms ${EASE_THROUGH} both }
}
`

function ensureWipeStyles() {
  if (document.getElementById(PAGE_WIPE_STYLE_ID)) return
  const style = document.createElement("style")
  style.id = PAGE_WIPE_STYLE_ID
  style.textContent = WIPE_CSS
  document.head.append(style)
}

function clearWipeMarks() {
  const root = document.documentElement
  delete root.dataset.pageWipe
  delete root.dataset.pageWipeEffect
}

/** A keyboard click reports (0, 0), which would open the iris from a corner, so it starts from the control instead. */
function wipeOrigin(event: Pick<React.MouseEvent<HTMLElement>, "detail" | "clientX" | "clientY" | "currentTarget">) {
  if (event.detail > 0) return { x: event.clientX, y: event.clientY }
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/** A click with a modifier means a new tab or window, and the browser should be left to do that. */
function isPlainClick(event: React.MouseEvent<HTMLElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

interface PageWipeOptions {
  /** `curtain` the accent colour rises then lifts away, `sweep` the new page slides over on a slanted edge, `iris` it opens from where you pressed. */
  variant?: PageWipeVariant
  /** `recede` pushes the old page back and down in light while the new one arrives. */
  effect?: PageWipeEffect
}

/**
 * Returns `wipe(update, event?)`. The update runs inside a View Transition: browsers without one just run it, and
 * reduced motion gets the hook's cross-fade, because every wipe rule here sits inside a no-preference query.
 */
function usePageWipe({ variant = "curtain", effect }: PageWipeOptions = {}) {
  const transition = useViewTransition("fade-through")

  useEffect(() => {
    ensureWipeStyles()
    return clearWipeMarks
  }, [])

  return useCallback(
    (update: () => void, event?: React.MouseEvent<HTMLElement>) => {
      // These marks can stay on <html> afterwards: the rules also need the hook's data-transition, which only exists during a transition.
      const root = document.documentElement
      root.dataset.pageWipe = variant
      if (effect) root.dataset.pageWipeEffect = effect
      else delete root.dataset.pageWipeEffect
      if (event) {
        const origin = wipeOrigin(event)
        root.style.setProperty("--page-wipe-x", `${origin.x}px`)
        root.style.setProperty("--page-wipe-y", `${origin.y}px`)
      }
      transition(update)
    },
    [effect, transition, variant],
  )
}

type PageWipeLinkProps = React.ComponentProps<"a"> & PageWipeOptions & {
  /** Do the navigation here, for example `router.push(href)`. The wipe wraps it. */
  onNavigate: (href: string) => void
}

function PageWipeLink({ variant = "curtain", effect, onNavigate, href, target, onClick, className, ...props }: PageWipeLinkProps) {
  const wipe = usePageWipe({ variant, effect })
  return (
    <a
      data-slot="page-wipe"
      data-variant={variant}
      data-effect={effect}
      href={href}
      target={target}
      className={cn("rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || !href || !isPlainClick(event) || (target && target !== "_self")) return
        event.preventDefault()
        wipe(() => onNavigate(href), event)
      }}
      {...props}
    />
  )
}

export { PageWipeLink, usePageWipe, type PageWipeLinkProps, type PageWipeOptions, type PageWipeVariant, type PageWipeEffect }
