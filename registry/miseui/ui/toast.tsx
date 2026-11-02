import type * as React from "react"
import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { AnimatePresence } from "motion/react"
import { ToastItem, resolveSwipe, type ToastEffect, type ToastVariant } from "@/registry/miseui/ui/toast-item"
import {
  DECK_GAP_PX,
  DEFAULT_MAX,
  FALLBACK_HEIGHT_PX,
  deckPlacement,
  regionClass,
  type ToastPosition,
} from "@/registry/miseui/ui/toast-layout"
import {
  DEFAULT_TOASTER,
  toast,
  toastStore,
  type ToastAction,
  type ToastOptions,
  type ToastPromiseMessages,
  type ToastRecord,
  type ToastType,
} from "@/registry/miseui/ui/toast-store"
import { cn } from "@/registry/miseui/lib/utils"

interface ToasterProps extends Omit<React.ComponentProps<"section">, "id"> {
  /** Only shows toasts sent with the same `toaster` option. */
  id?: string
  /** `stack` a deck that fans out on hover, `list` a plain column, `pill` one compact capsule, `bar` a full-width banner at the edge. */
  variant?: ToastVariant
  /** `spring` brings toasts in on a spring and lets them be swiped away with momentum. */
  effect?: ToastEffect
  /** `pill` and `bar` only use the top or bottom part. */
  position?: ToastPosition
  /** How many show at once; the rest wait their turn. */
  max?: number
  /** Position inside the nearest positioned ancestor, not the viewport. For previews. */
  contained?: boolean
}

const announcement = (record: ToastRecord) =>
  record.description ? `${record.title}. ${record.description}` : record.title

function useToasts(id: string) {
  const all = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot)
  return useMemo(() => all.filter((record) => record.toaster === id), [all, id])
}

/** Hover or focus inside the region pauses every timer and fans out the deck. */
function useRegionAttention(hasToasts: boolean) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  // Removing the last toast under a still pointer fires no leave event; without this a later toast would stay paused.
  if (!hasToasts && (hovered || focused)) {
    setHovered(false)
    setFocused(false)
  }
  const handlers = {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
    },
  }
  return { expanded: hovered || focused, setFocused, handlers }
}

function useMeasuredHeights() {
  const [measured, setMeasured] = useState<Readonly<Record<string, number>>>({})
  const onMeasure = useCallback((id: string, height: number | undefined) => {
    setMeasured((current) => {
      if (!height) return Object.fromEntries(Object.entries(current).filter(([key]) => key !== id))
      return current[id] === height ? current : { ...current, [id]: height }
    })
  }, [])
  return { measured, onMeasure }
}

/** Live regions must exist before their text changes, or screen readers miss it; toast cards come and go. */
function LiveRegions({ latest }: { latest: ToastRecord | undefined }) {
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {latest && latest.type !== "error" ? announcement(latest) : ""}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {latest?.type === "error" ? announcement(latest) : ""}
      </div>
    </>
  )
}

interface ToastListProps {
  visible: readonly ToastRecord[]
  variant: ToastVariant
  effect: ToastEffect | undefined
  isTop: boolean
  expanded: boolean
  onDismiss: (id: string) => void
}

function ToastList({ visible, variant, effect, isTop, expanded, onDismiss }: ToastListProps) {
  const { measured, onMeasure } = useMeasuredHeights()
  const direction = isTop ? 1 : -1
  const isDeck = variant === "stack"
  const heights = visible.map((record) => measured[record.id] ?? FALLBACK_HEIGHT_PX)
  const deckHeight = expanded ? heights.reduce((sum, height) => sum + height + DECK_GAP_PX, -DECK_GAP_PX) : (heights[0] ?? 0)
  return (
    <ol
      className={cn(
        "relative",
        visible.length > 0 && "pointer-events-auto",
        !isDeck && ["flex", variant !== "bar" && "gap-2", isTop ? "flex-col" : "flex-col-reverse"],
        variant === "pill" && "items-center",
      )}
      style={isDeck ? { height: deckHeight } : undefined}
    >
      <AnimatePresence initial={false} mode={isDeck ? "sync" : "popLayout"}>
        {visible.map((record, index) => (
          <ToastItem
            key={record.id}
            record={record}
            variant={variant}
            effect={effect}
            direction={direction}
            paused={expanded}
            placement={isDeck ? deckPlacement({ index, expanded, heights, direction }) : undefined}
            onDismiss={onDismiss}
            onExpire={toast.dismiss}
            onMeasure={onMeasure}
          />
        ))}
      </AnimatePresence>
    </ol>
  )
}

function Toaster({
  id = DEFAULT_TOASTER,
  variant = "stack",
  effect,
  position = "bottom-right",
  max,
  contained = false,
  className,
  "aria-label": ariaLabel = "Notifications",
  ...props
}: ToasterProps) {
  const toasts = useToasts(id)
  const { expanded, setFocused, handlers } = useRegionAttention(toasts.length > 0)
  const onDismiss = useCallback(
    (toastId: string) => {
      // The focused button is about to leave the DOM, and browsers do not reliably fire blur for that.
      setFocused(false)
      toast.dismiss(toastId)
    },
    [setFocused],
  )
  return (
    <section
      aria-label={ariaLabel}
      data-slot="toaster"
      data-variant={variant}
      data-effect={effect}
      data-expanded={expanded}
      className={cn("pointer-events-none z-50", regionClass(variant, position, contained), className)}
      {...handlers}
      {...props}
    >
      <LiveRegions latest={toasts[0]} />
      <ToastList
        visible={toasts.slice(0, Math.max(1, max ?? DEFAULT_MAX[variant]))}
        variant={variant}
        effect={effect}
        isTop={position.startsWith("top")}
        expanded={expanded}
        onDismiss={onDismiss}
      />
    </section>
  )
}

export {
  Toaster,
  toast,
  toastStore,
  deckPlacement,
  resolveSwipe,
  type ToasterProps,
  type ToastAction,
  type ToastEffect,
  type ToastOptions,
  type ToastPosition,
  type ToastPromiseMessages,
  type ToastRecord,
  type ToastType,
  type ToastVariant,
}
