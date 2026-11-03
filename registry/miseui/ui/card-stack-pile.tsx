import { useEffect, useRef, useState } from "react"
import { ChevronRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { CARD_CLASS, composeHandlers, CONTROL_ROW, DRAG_CLIP, reachable, STACK_CELL, StackRoot, StackStatus, SURFACE_SHADOW, useAutoplay, useHeld, type StackVariantProps } from "@/registry/miseui/ui/card-stack-card"
import { depthOf, pilePose, shouldLeave } from "@/registry/miseui/ui/card-stack-math"
import { cn } from "@/registry/miseui/lib/utils"

const FLING_MS = 200
const FLING_PX = 220

/** The top card leaves sideways first, then drops to the back. Going straight to the back would pass through the cards above it. */
function usePileOrder(count: number, reduceMotion: boolean) {
  const [top, setTop] = useState(0)
  const [leaving, setLeaving] = useState<{ index: number; direction: number } | null>(null)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const current = count > 0 ? top % count : 0

  const sendBack = (direction: number) => {
    if (count < 2) return
    window.clearTimeout(timer.current)
    if (reduceMotion) {
      setTop((current + 1) % count)
      return
    }
    // Pressed again mid-flight: the card in flight lands at once and the next one goes.
    const from = leaving ? (current + 1) % count : current
    setTop(from)
    setLeaving({ index: from, direction })
    timer.current = window.setTimeout(() => {
      setLeaving(null)
      setTop((from + 1) % count)
    }, FLING_MS)
  }
  return { top: current, leaving, sendBack }
}

export function Pile({ items, label, autoplay, paused, interval, seed, labels, rootProps }: StackVariantProps) {
  const reduceMotion = useReducedMotion() ?? false
  const rootRef = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const { held, heldProps } = useHeld()
  const count = items.length
  const { top, leaving, sendBack } = usePileOrder(count, reduceMotion)
  const running = useAutoplay(rootRef, { enabled: autoplay, paused, held, intervalMs: interval, onTurn: () => sendBack(1) })
  const current = items[top]

  return (
    <StackRoot {...rootProps} {...composeHandlers(rootProps, heldProps)} ref={rootRef} aria-label={label} data-playing={autoplay ? String(running) : undefined}>
      <div className={cn("grid grid-cols-[minmax(0,1fr)] px-4 pt-2 pb-6", DRAG_CLIP)}>
        {items.map((item, index) => {
          const depth = depthOf(index, top, count)
          const isTop = depth === 0
          const flying = leaving?.index === index
          const direction = leaving?.direction ?? 1
          return (
            <motion.div
              key={item.id}
              {...reachable(isTop && !flying)}
              data-slot="card-stack-card"
              data-depth={depth}
              className={cn(STACK_CELL, CARD_CLASS, SURFACE_SHADOW, isTop && count > 1 && "cursor-grab active:cursor-grabbing")}
              style={{ zIndex: flying ? count + 1 : count - depth, transformOrigin: "50% 100%" }}
              initial={false}
              animate={flying ? { x: direction * FLING_PX, y: 0, rotate: direction * 6, scale: 1, opacity: 0 } : pilePose(index, depth, count, seed)}
              transition={reduceMotion ? { duration: 0 } : flying ? { type: "tween", duration: FLING_MS / 1000, ease: [0.2, 0, 0.6, 1] } : SPRING_DEFAULT}
              drag={isTop && count > 1 && !reduceMotion ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.6}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 40 }}
              onDragStart={() => {
                dragged.current = true
              }}
              onDragEnd={(_event, info) => {
                if (shouldLeave(info.offset.x, info.velocity.x, rootRef.current?.offsetWidth ?? 0)) sendBack(info.offset.x >= 0 ? 1 : -1)
              }}
              onClickCapture={(event) => {
                // Finishing a drag over a link must not also follow it. A plain press still does.
                if (dragged.current) event.preventDefault()
                dragged.current = false
              }}
            >
              {item.content}
            </motion.div>
          )
        })}
      </div>
      <div className={CONTROL_ROW}>
        <StackStatus text={current ? `${top + 1} of ${count}: ${current.label}` : ""} live={!running} />
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" disabled={count < 2} onClick={() => sendBack(1)}>
          {labels.next}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </StackRoot>
  )
}
