import type * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  BODY_CLASS,
  DOT_TONE_CLASS,
  HIT_AREA_CLASS,
  ROOT_CLASS,
  TONE_CLASS,
  type TagTone,
  type TagVariant,
} from "@/registry/miseui/ui/tag-classes"
import { cn } from "@/registry/miseui/lib/utils"

type TagEffect = "collapse"

/** Comfortably past the spring. A row that is hidden or in a background tab never reports the end of its animation. */
const CLOSE_FALLBACK_MS = 600

/** Removing a focused tag would drop focus onto the page; the neighbour is where a keyboard user wants to carry on. */
function focusNeighbour(node: HTMLElement | null) {
  const neighbour = node?.nextElementSibling ?? node?.previousElementSibling
  neighbour?.querySelector<HTMLElement>("button")?.focus()
}

/** Without taking the gap away too, the row would close to one gap short and then jump when the tag unmounts. */
function parentGap(node: HTMLElement | null) {
  if (!node?.parentElement) return 0
  return Number.parseFloat(getComputedStyle(node.parentElement).columnGap) || 0
}

function useRemoval(collapse: boolean, onRemove?: () => void) {
  const reduceMotion = useReducedMotion() ?? false
  const rootRef = useRef<HTMLSpanElement>(null)
  const finished = useRef(false)
  const [closing, setClosing] = useState<{ gap: number } | null>(null)
  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    onRemove?.()
  }, [onRemove])
  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(finish, CLOSE_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [closing, finish])
  const remove = () => {
    focusNeighbour(rootRef.current)
    if (collapse && !reduceMotion) setClosing({ gap: parentGap(rootRef.current) })
    else onRemove?.()
  }
  return { rootRef, closing, remove, finish }
}

function RemoveButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-slot="tag-remove"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "ms-1 -me-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full opacity-70 outline-none",
        "transition-opacity duration-(--duration-fast) ease-(--ease-mise) hover:opacity-100",
        "focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none",
        HIT_AREA_CLASS,
      )}
    >
      <X aria-hidden="true" className="size-3" />
    </button>
  )
}

interface TagBodyProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  pressed?: boolean
  disabled?: boolean
  children: React.ReactNode
}

function TagBody({ onClick, pressed, disabled, children }: TagBodyProps) {
  if (!onClick) return <span className={BODY_CLASS}>{children}</span>
  return (
    <button
      type="button"
      data-slot="tag-button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        BODY_CLASS,
        HIT_AREA_CLASS,
        "cursor-pointer rounded-[inherit] outline-none hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none",
      )}
    >
      {children}
    </button>
  )
}

type TagProps = Omit<React.ComponentProps<"span">, "onClick"> & {
  /** `soft` a tint, `outline` a border, `solid` full colour, `dot` a status dot beside plain text. */
  variant?: TagVariant
  /** Status tones use fixed hues; only `accent` follows the theme. The word in the tag has to carry the meaning too. */
  tone?: TagTone
  /** `collapse` closes the gap when removed, so the row slides shut. Fires onRemove once it has finished. */
  effect?: TagEffect
  /** Makes the label a button. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** Reports the pressed state of a clickable tag, for filters. */
  pressed?: boolean
  /** Adds the remove button. */
  onRemove?: () => void
  /** Name of the remove button. Include the tag, such as "Remove design". */
  removeLabel?: string
  disabled?: boolean
}

function Tag({ variant = "soft", tone = "neutral", effect, onClick, pressed, onRemove, removeLabel = "Remove", disabled, className, children, ...props }: TagProps) {
  const { rootRef, closing, remove, finish } = useRemoval(effect === "collapse", onRemove)
  const label = (
    <>
      {variant === "dot" ? (
        <span aria-hidden="true" data-slot="tag-dot" className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE_CLASS[tone])} />
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
    </>
  )
  return (
    <motion.span
      {...(props as React.ComponentProps<typeof motion.span>)}
      ref={rootRef}
      data-slot="tag"
      data-variant={variant}
      data-tone={tone}
      data-effect={effect}
      data-closing={closing ? "true" : undefined}
      inert={closing ? true : undefined}
      // Clipped only while closing, or it would cut off the focus ring and the touch hit area.
      className={cn(ROOT_CLASS[variant], TONE_CLASS[variant][tone], disabled && "opacity-50", closing && "overflow-hidden", className)}
      initial={false}
      animate={closing ? { width: 0, opacity: 0, marginInlineEnd: -closing.gap } : undefined}
      transition={SPRING_DEFAULT}
      onAnimationComplete={() => {
        if (closing) finish()
      }}
    >
      <TagBody onClick={onClick} pressed={pressed} disabled={disabled}>
        {label}
      </TagBody>
      {onRemove ? <RemoveButton label={removeLabel} disabled={disabled} onClick={remove} /> : null}
    </motion.span>
  )
}

export { Tag, type TagProps, type TagVariant, type TagTone, type TagEffect }
