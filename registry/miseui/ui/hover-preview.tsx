import type * as React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, useReducedMotion } from "motion/react"
import {
  keyboardAnchor,
  useFineHover,
  usePreviewDismiss,
  usePreviewMotion,
  type Point,
  type PreviewMotion,
} from "@/registry/miseui/ui/hover-preview-state"
import { PreviewFloat, type HoverPreviewContent, type HoverPreviewVariant } from "@/registry/miseui/ui/hover-preview-surface"
import { cn } from "@/registry/miseui/lib/utils"

type HoverPreviewEffect = "tilt"

interface HoverPreviewContextValue {
  onEnter: (id: string, content: HoverPreviewContent, point: Point) => void
  onMove: (id: string, content: HoverPreviewContent, point: Point) => void
  onLeave: () => void
  onFocusLink: (id: string, content: HoverPreviewContent, point: Point) => void
}

const HoverPreviewContext = createContext<HoverPreviewContextValue | null>(null)

type HoverPreviewProps = React.ComponentProps<"ul"> & {
  /** `card` picture and words, `media` the picture alone, `tag` one line riding beside the pointer. */
  variant?: HoverPreviewVariant
  /** `tilt` leans the preview into the direction of travel. */
  effect?: HoverPreviewEffect
}

const HIDE_DELAY_MS = 60

function useHoverPreviewState(fineHover: boolean, movement: PreviewMotion) {
  const [shown, setShown] = useState<{ id: string; content: HoverPreviewContent } | null>(null)
  const currentId = useRef<string | null>(null)
  const dismissed = useRef(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const hide = useCallback(() => {
    clearTimeout(hideTimer.current)
    currentId.current = null
    setShown(null)
  }, [])
  const onEscape = useCallback(() => {
    dismissed.current = true
    hide()
  }, [hide])
  usePreviewDismiss({ visible: shown !== null, onScroll: hide, onEscape })
  useEffect(() => () => clearTimeout(hideTimer.current), [])

  const context = useMemo<HoverPreviewContextValue>(() => {
    const show = (id: string, content: HoverPreviewContent, point: Point) => {
      clearTimeout(hideTimer.current)
      if (currentId.current === null) movement.jumpTo(point)
      currentId.current = id
      setShown({ id, content })
    }
    return {
      onEnter: (id, content, point) => {
        if (!fineHover) return
        dismissed.current = false
        show(id, content, point)
      },
      onMove: (id, content, point) => {
        if (!fineHover || dismissed.current) return
        if (currentId.current !== id) show(id, content, point)
        movement.follow(point)
      },
      // Leaving one row and entering the next are separate events, so the hide waits a moment or the card would blink between rows.
      onLeave: () => {
        dismissed.current = false
        clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(hide, HIDE_DELAY_MS)
      },
      onFocusLink: (id, content, point) => {
        if (!fineHover) return
        movement.jumpTo(point)
        show(id, content, point)
      },
    }
  }, [fineHover, hide, movement])
  return { shown, context }
}

function HoverPreview({ variant = "card", effect, className, children, ...props }: HoverPreviewProps) {
  const fineHover = useFineHover()
  const reduceMotion = useReducedMotion() ?? false
  const movement = usePreviewMotion(effect === "tilt" && !reduceMotion)
  const { shown, context } = useHoverPreviewState(fineHover, movement)
  return (
    <HoverPreviewContext.Provider value={context}>
      <ul data-slot="hover-preview" data-variant={variant} data-effect={effect} className={cn("grid min-w-0", className)} {...props}>
        {children}
      </ul>
      {fineHover
        ? createPortal(
            <AnimatePresence>
              {shown ? (
                <PreviewFloat key="hover-preview" variant={variant} content={shown.content} x={movement.x} y={movement.y} rotate={movement.rotate} onSurface={movement.setSurface} />
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </HoverPreviewContext.Provider>
  )
}

const LINK_CLASS = [
  "flex min-h-12 min-w-0 items-center justify-between gap-4 rounded-sm py-2 text-[15px] font-medium outline-none",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-muted-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
]

type HoverPreviewLinkProps = Omit<React.ComponentProps<"a">, "title"> & {
  /** What floats beside the pointer. It repeats or adds to the row and is never the only way to anything. */
  preview: HoverPreviewContent
  /** A short line at the end of the row, such as a date. */
  aside?: React.ReactNode
}

function HoverPreviewLink({ preview, aside, className, children, href, onPointerEnter, onPointerMove, onPointerLeave, onFocus, onBlur, ...props }: HoverPreviewLinkProps) {
  const context = useContext(HoverPreviewContext)
  if (!context) throw new Error("HoverPreviewLink must be used inside <HoverPreview>")
  const id = href ?? String(children)
  const point = (event: React.PointerEvent): Point => ({ x: event.clientX, y: event.clientY })
  return (
    <li className="min-w-0 border-b last:border-b-0">
      <a
        data-slot="hover-preview-link"
        href={href}
        className={cn(LINK_CLASS, className)}
        onPointerEnter={(event) => {
          onPointerEnter?.(event)
          if (event.pointerType !== "touch") context.onEnter(id, preview, point(event))
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event)
          if (event.pointerType !== "touch") context.onMove(id, preview, point(event))
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          context.onLeave()
        }}
        onFocus={(event) => {
          onFocus?.(event)
          // Clicking a link also focuses it; only someone tabbing here is asking for the card this way.
          if (event.currentTarget.matches(":focus-visible")) context.onFocusLink(id, preview, keyboardAnchor(event.currentTarget.getBoundingClientRect()))
        }}
        onBlur={(event) => {
          onBlur?.(event)
          context.onLeave()
        }}
        {...props}
      >
        <span className="min-w-0">{children}</span>
        {aside ? <span className="shrink-0 text-[13px] font-normal text-muted-foreground tabular-nums">{aside}</span> : null}
      </a>
    </li>
  )
}

export {
  HoverPreview,
  HoverPreviewLink,
  type HoverPreviewProps,
  type HoverPreviewLinkProps,
  type HoverPreviewContent,
  type HoverPreviewVariant,
  type HoverPreviewEffect,
}
