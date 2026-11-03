import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { CARD_CLASS, composeHandlers, CONTROL_ROW, isKeyboardFocus, pressedControl, reachable, STACK_CELL, StackRoot, SURFACE_SHADOW, useAutoplay, type StackVariantProps } from "@/registry/miseui/ui/card-stack-card"
import { depthOf, fanPose, fitFan, type FanFit } from "@/registry/miseui/ui/card-stack-math"
import { cn } from "@/registry/miseui/lib/utils"

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)"
const FIRST_FIT: FanFit = { spread: 8, gap: 0 }

/** Measured, not assumed: how far a fan may open depends on the cell it landed in and on how tall its cards are. */
function useFanFit(rootRef: React.RefObject<HTMLElement | null>, count: number) {
  const [fit, setFit] = useState(FIRST_FIT)
  useEffect(() => {
    const root = rootRef.current
    const card = root?.querySelector<HTMLElement>('[data-slot="card-stack-card"]')
    if (!root || !card || typeof ResizeObserver === "undefined") return
    // offsetWidth and offsetHeight ignore transforms, so the card's own rotation does not feed back into this.
    const measure = () => setFit(fitFan(count, root.offsetWidth, card.offsetWidth, card.offsetHeight))
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(card)
    return () => observer.disconnect()
  }, [rootRef, count])
  return fit
}

export function Fan({ items, label, autoplay, paused, interval, labels, rootProps }: StackVariantProps) {
  const reduceMotion = useReducedMotion() ?? false
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [top, setTop] = useState(0)
  const count = items.length
  const fit = useFanFit(rootRef, count)
  const running = useAutoplay(rootRef, { enabled: autoplay, paused, held: open, intervalMs: interval, onTurn: () => setTop((current) => (current + 1) % Math.max(count, 1)) })

  return (
    <StackRoot
      {...rootProps}
      ref={rootRef}
      aria-label={label}
      data-open={open}
      data-playing={autoplay ? String(running) : undefined}
      {...composeHandlers(rootProps, {
        onPointerEnter: (event) => {
          if (event.pointerType === "mouse" && window.matchMedia(FINE_POINTER_QUERY).matches) setOpen(true)
        },
        onPointerLeave: (event) => {
          if (event.pointerType === "mouse" && !event.currentTarget.contains(document.activeElement)) setOpen(false)
        },
        onFocus: (event) => {
          if (isKeyboardFocus(event.target)) setOpen(true)
        },
        onBlur: (event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
        },
      })}
    >
      {/* The bottom room is where a corner swings to at full spread: reserved now, so opening moves nothing around it. */}
      <div
        data-slot="card-stack-fan"
        className="grid grid-cols-[minmax(0,1fr)] justify-items-center pt-2 pb-8"
        onClick={(event) => {
          if (!window.matchMedia(FINE_POINTER_QUERY).matches && !pressedControl(event.target)) setOpen(!open)
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
              className={cn(STACK_CELL, CARD_CLASS, SURFACE_SHADOW, "w-[54%]")}
              style={{ zIndex: count - depth, transformOrigin: "50% 100%" }}
              initial={false}
              animate={fanPose(count - 1 - depth, count, open, fit)}
              transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
            >
              {item.content}
            </motion.div>
          )
        })}
      </div>
      <div className={CONTROL_ROW}>
        <p data-slot="card-stack-status" className="text-[13px] text-muted-foreground tabular-nums">
          {count === 1 ? "1 card" : `${count} cards`}
        </p>
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? labels.gather : labels.spread}
        </Button>
      </div>
    </StackRoot>
  )
}
