import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { CARD_CLASS, composeHandlers, CONTROL_ROW, isKeyboardFocus, pressedControl, reachable, STACK_CELL, StackRoot, StackStatus, useAutoplay, useHeld, type StackVariantProps } from "@/registry/miseui/ui/card-stack-card"
import { cascadePose, CASCADE_PEEK_ROOM, depthOf } from "@/registry/miseui/ui/card-stack-math"
import { cn } from "@/registry/miseui/lib/utils"

function useRowHeight(rowsRef: React.RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const row = rowsRef.current?.querySelector<HTMLElement>('[data-slot="card-stack-card"]')
    if (!row || typeof ResizeObserver === "undefined") return
    // offsetHeight ignores transforms, so the peek's scale does not shrink the measure.
    const observer = new ResizeObserver(() => setHeight(row.offsetHeight))
    observer.observe(row)
    return () => observer.disconnect()
  }, [rowsRef])
  return height
}

/**
 * Open rows float over what follows instead of pushing it down: the page around them never moves, and the closed box
 * keeps its size. A list that grew in place would shift everything below it on every open and close.
 */
export function Cascade({ items, label, autoplay, paused, interval, labels, rootProps }: StackVariantProps) {
  const reduceMotion = useReducedMotion() ?? false
  const rootRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(0)
  const { held, heldProps } = useHeld()
  const count = items.length
  const rowHeight = useRowHeight(rowsRef)
  const running = useAutoplay(rootRef, { enabled: autoplay, paused, held: open || held, intervalMs: interval, onTurn: () => setTop((current) => (current + 1) % Math.max(count, 1)) })

  return (
    <StackRoot
      {...rootProps}
      ref={rootRef}
      aria-label={label}
      data-open={open}
      data-playing={autoplay ? String(running) : undefined}
      className={cn("relative", open && "z-20", rootProps.className)}
      {...composeHandlers(rootProps, {
        onPointerEnter: heldProps.onPointerEnter,
        onPointerLeave: heldProps.onPointerLeave,
        onFocus: (event) => {
          heldProps.onFocus()
          if (isKeyboardFocus(event.target)) setOpen(true)
        },
        onBlur: (event) => {
          heldProps.onBlur(event)
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
        },
      })}
      // Written here, not composed: it holds a ref, and a closure over a ref must not pass through a call during render.
      onKeyDown={(event) => {
        rootProps.onKeyDown?.(event)
        if (event.key !== "Escape" || !open) return
        event.stopPropagation()
        setOpen(false)
        toggleRef.current?.focus()
      }}
    >
      <div className={CONTROL_ROW}>
        <StackStatus text={count === 1 ? "1 update" : `${count} updates`} live={false} />
        <Button ref={toggleRef} variant="ghost" size="sm" className="pointer-coarse:h-10" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? labels.collapse : labels.showAll}
        </Button>
      </div>
      <div
        ref={rowsRef}
        data-slot="card-stack-rows"
        className="grid grid-cols-[minmax(0,1fr)]"
        style={{ paddingBottom: CASCADE_PEEK_ROOM }}
        onClick={(event) => {
          if (!open && !pressedControl(event.target)) setOpen(true)
        }}
      >
        {items.map((item, index) => {
          const depth = depthOf(index, top, count)
          return (
            <motion.div
              key={item.id}
              {...reachable(open || depth === 0)}
              data-slot="card-stack-card"
              data-depth={depth}
              className={cn(STACK_CELL, CARD_CLASS, "shadow-sm dark:shadow-black/40")}
              style={{ zIndex: count - depth, transformOrigin: "50% 100%" }}
              initial={false}
              animate={cascadePose(depth, open, rowHeight)}
              transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
            >
              {item.content}
            </motion.div>
          )
        })}
      </div>
    </StackRoot>
  )
}
