import type * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react"
import { SPRING_DEFAULT, projectMomentum } from "@/registry/miseui/lib/motion"
import { BAR_TONE_CLASS, ROW_CLASS, SURFACE_CLASS, ToastRowContent, type ToastVariant } from "@/registry/miseui/ui/toast-row"
import type { ToastRecord } from "@/registry/miseui/ui/toast-store"
import { cn } from "@/registry/miseui/lib/utils"

export type ToastEffect = "spring"
export type { ToastVariant }

/** Past this share of its width, the projected rest point means "gone". */
const SWIPE_FRACTION = 0.5
const THROW_CLEARANCE_PX = 48
const QUIET_TWEEN = { duration: 0.15, ease: [0.2, 0, 0, 1] } as const
const INSTANT = { duration: 0 } as const
const ENTER_OFFSET_PX = { spring: 24, quiet: 8 }
const ENTER_SCALE = 0.96

interface SwipeGesture {
  /** Drag offset in px. */
  offset: number
  /** Release velocity in px/s. */
  velocity: number
  /** Rendered toast width in px. */
  width: number
}

/** -1 or 1 to throw the toast that way, 0 to let it settle back. A flick counts for where it was going, not where it let go. */
export function resolveSwipe({ offset, velocity, width }: SwipeGesture): -1 | 0 | 1 {
  const projected = offset + projectMomentum(velocity)
  if (Math.abs(projected) <= width * SWIPE_FRACTION) return 0
  return projected > 0 ? 1 : -1
}

function useAutoDismiss(onExpire: () => void, duration: number, paused: boolean) {
  const remaining = useRef(duration)
  useEffect(() => {
    remaining.current = duration
  }, [duration])
  useEffect(() => {
    if (paused || !Number.isFinite(duration)) return
    const startedAt = Date.now()
    const timer = setTimeout(onExpire, remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - startedAt
    }
  }, [paused, duration, onExpire])
}

/** Reports the row's natural height. First pass runs before paint, so the deck never shows a guessed height. */
function useMeasuredRow(id: string, onMeasure: (id: string, height: number | undefined) => void) {
  const rowRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    onMeasure(id, row.offsetHeight)
    const observer = new ResizeObserver(() => onMeasure(id, row.offsetHeight))
    observer.observe(row)
    return () => {
      observer.disconnect()
      onMeasure(id, undefined)
    }
  }, [id, onMeasure])
  return rowRef
}

function useSwipeAway(onGone: () => void) {
  const x = useMotionValue(0)
  const onDragEnd = (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const card = event.target instanceof Element ? event.target.closest("[data-slot='toast']") : null
    const width = card?.getBoundingClientRect().width ?? 0
    const side = resolveSwipe({ offset: info.offset.x, velocity: info.velocity.x, width })
    if (side === 0) return
    // Hand the release velocity to the spring so the throw has no seam, then remove it once it is off the edge.
    animate(x, side * (width + THROW_CLEARANCE_PX), { ...SPRING_DEFAULT, velocity: info.velocity.x }).then(onGone)
  }
  return { x, onDragEnd }
}

export interface ToastPlacement {
  y: number
  scale: number
  height?: number
  hideContent: boolean
  zIndex: number
}

interface ToastItemProps {
  /** AnimatePresence popLayout has to reach the element it pops out of flow. */
  ref?: React.Ref<HTMLLIElement>
  record: ToastRecord
  variant: ToastVariant
  effect: ToastEffect | undefined
  /** 1 when the toaster sits at the top, -1 at the bottom. */
  direction: 1 | -1
  paused: boolean
  /** Deck position for `stack`; flow variants leave it out and reflow on their own. */
  placement?: ToastPlacement
  onDismiss: (id: string) => void
  onExpire: (id: string) => void
  onMeasure: (id: string, height: number | undefined) => void
}

function enterFrom(reduceMotion: boolean, effect: ToastEffect | undefined, direction: 1 | -1, restY: number) {
  if (reduceMotion) return { opacity: 0, y: restY }
  const distance = effect === "spring" ? ENTER_OFFSET_PX.spring : ENTER_OFFSET_PX.quiet
  return { opacity: 0, y: restY - distance * direction, scale: ENTER_SCALE }
}

function ToastItem(props: ToastItemProps) {
  const { ref, record, variant, effect, direction, paused, placement, onDismiss, onExpire, onMeasure } = props
  const { id } = record
  const reduceMotion = useReducedMotion() ?? false
  const expire = useCallback(() => onExpire(id), [onExpire, id])
  useAutoDismiss(expire, record.duration, paused)
  const rowRef = useMeasuredRow(id, onMeasure)
  const { x, onDragEnd } = useSwipeAway(() => onDismiss(id))
  const transition = reduceMotion ? INSTANT : effect === "spring" ? SPRING_DEFAULT : QUIET_TWEEN
  const restY = placement?.y ?? 0
  return (
    <motion.li
      ref={ref}
      layout={placement ? false : "position"}
      data-slot="toast"
      data-type={record.type}
      initial={enterFrom(reduceMotion, effect, direction, restY)}
      animate={{ opacity: 1, y: restY, scale: placement?.scale ?? 1, ...(placement?.height ? { height: placement.height } : {}) }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: ENTER_SCALE }}
      transition={transition}
      style={{ x, zIndex: placement?.zIndex, transformOrigin: direction === -1 ? "bottom center" : "top center" }}
      drag={effect === "spring" && !reduceMotion ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.6}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => {
        if (event.key === "Escape") onDismiss(id)
      }}
      className={cn(
        "pointer-events-auto overflow-hidden",
        SURFACE_CLASS[variant],
        variant === "bar" && BAR_TONE_CLASS[record.type],
        placement && (direction === -1 ? "absolute inset-x-0 bottom-0" : "absolute inset-x-0 top-0"),
      )}
    >
      <motion.div
        ref={rowRef}
        // Cards at the back of the deck are clipped, so their buttons must not take focus until the deck fans out.
        inert={placement?.hideContent ?? false}
        initial={false}
        animate={{ opacity: placement?.hideContent ? 0 : 1 }}
        transition={transition}
        className={ROW_CLASS[variant]}
      >
        <ToastRowContent record={record} variant={variant} onDismiss={onDismiss} />
      </motion.div>
    </motion.li>
  )
}

export { ToastItem }
