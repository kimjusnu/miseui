import { useEffect, useMemo, useRef, useState } from "react"
import { Check, RotateCcw, X } from "lucide-react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { CARD_CLASS, CONTROL_ROW, DRAG_CLIP, reachable, STACK_CELL, StackRoot, StackStatus, SURFACE_SHADOW, type StackVariantProps } from "@/registry/miseui/ui/card-stack-card"
import { shouldLeave, swipeTint, type SwipeChoice } from "@/registry/miseui/ui/card-stack-math"
import { cn } from "@/registry/miseui/lib/utils"

const LEAVE_PX = 260
const LEAVE_SECONDS = 0.2
const PEEK_PX = 8
const PEEK_SCALE = 0.03

/** Fixed hues: the choice means yes or no whatever the accent is, and an accent may itself be red or green. Words go with them, so colour is not the only signal. */
const TINT: Record<SwipeChoice, { wash: string; ink: string; align: string }> = {
  right: { wash: "bg-emerald-500/12", ink: "text-emerald-700 dark:text-emerald-300", align: "justify-start" },
  left: { wash: "bg-red-500/12", ink: "text-red-700 dark:text-red-300", align: "justify-end" },
}

interface ChoiceTintProps {
  choice: SwipeChoice
  x: MotionValue<number>
  width: number
  word: string
}

function ChoiceTint({ choice, x, width, word }: ChoiceTintProps) {
  const opacity = useTransform(x, (value) => ((choice === "right" ? value > 0 : value < 0) ? swipeTint(value, width) : 0))
  const Icon = choice === "right" ? Check : X
  return (
    <motion.div
      aria-hidden="true"
      data-slot={`card-stack-tint-${choice}`}
      className={cn("pointer-events-none absolute inset-0 flex items-start rounded-[inherit] p-3 text-[13px] font-medium", TINT[choice].wash, TINT[choice].ink, TINT[choice].align)}
      style={{ opacity }}
    >
      <span className="flex items-center gap-1 rounded-md bg-background px-2 py-1 shadow-sm">
        <Icon className="size-3.5" />
        {word}
      </span>
    </motion.div>
  )
}

export function Swipe({ items, label, labels, rootProps, onDecide }: StackVariantProps & { onDecide?: (id: string, choice: SwipeChoice) => void }) {
  const reduceMotion = useReducedMotion() ?? false
  const rootRef = useRef<HTMLDivElement>(null)
  const againRef = useRef<HTMLButtonElement>(null)
  const dragged = useRef(false)
  const [position, setPosition] = useState(0)
  const [choices, setChoices] = useState<readonly SwipeChoice[]>([])
  const [width, setWidth] = useState(0)
  const x = useMotionValue(0)
  const count = items.length
  const done = position >= count
  const current = items[position]
  const kept = useMemo(() => choices.filter((choice) => choice === "right").length, [choices])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => setWidth(root.offsetWidth))
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const commit = (choice: SwipeChoice) => {
    if (!current) return
    onDecide?.(current.id, choice)
    setChoices([...choices, choice])
    setPosition(position + 1)
    x.set(0)
  }
  const decide = (choice: SwipeChoice) => {
    if (!current) return
    if (reduceMotion) {
      commit(choice)
      return
    }
    void animate(x, choice === "right" ? LEAVE_PX : -LEAVE_PX, { duration: LEAVE_SECONDS, ease: [0.2, 0, 0.6, 1], onComplete: () => commit(choice) })
  }
  // The buttons that held focus are gone, and focus must not fall back to the top of the page.
  useEffect(() => {
    if (done && count > 0) againRef.current?.focus()
  }, [done, count])

  return (
    <StackRoot {...rootProps} ref={rootRef} aria-label={label}>
      <div className={cn("grid grid-cols-[minmax(0,1fr)] pt-2 pb-5", DRAG_CLIP)}>
        {items.map((item, index) => {
          const depth = index - position
          const isTop = depth === 0
          const hidden = depth < 0 || depth > 2
          return (
            <motion.div
              key={item.id}
              {...reachable(isTop)}
              data-slot="card-stack-card"
              data-depth={depth}
              className={cn(STACK_CELL, CARD_CLASS, SURFACE_SHADOW, "relative touch-pan-y", hidden && "invisible", isTop && "cursor-grab active:cursor-grabbing")}
              style={{ zIndex: count - index, transformOrigin: "50% 100%", ...(isTop ? { x } : {}) }}
              initial={false}
              animate={isTop ? { y: 0, scale: 1 } : { y: Math.max(depth, 0) * PEEK_PX, scale: 1 - Math.max(depth, 0) * PEEK_SCALE }}
              transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
              drag={isTop && !reduceMotion ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.7}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 40 }}
              onDragStart={() => {
                dragged.current = true
              }}
              onDragEnd={(_event, info) => {
                if (shouldLeave(info.offset.x, info.velocity.x, width)) decide(info.offset.x >= 0 ? "right" : "left")
              }}
              onClickCapture={(event) => {
                if (dragged.current) event.preventDefault()
                dragged.current = false
              }}
            >
              {item.content}
              {isTop ? (
                <>
                  <ChoiceTint choice="right" x={x} width={width} word={labels.right} />
                  <ChoiceTint choice="left" x={x} width={width} word={labels.left} />
                </>
              ) : null}
            </motion.div>
          )
        })}
        {done ? (
          <div data-slot="card-stack-done" className={cn(STACK_CELL, "flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-4 text-center")}>
            <p className="text-[15px] font-medium text-foreground">{labels.done}</p>
            <p className="text-[13px] text-muted-foreground tabular-nums">
              {kept} {labels.right.toLowerCase()}, {count - kept} {labels.left.toLowerCase()}
            </p>
          </div>
        ) : null}
      </div>
      <div className={CONTROL_ROW}>
        <StackStatus text={done ? labels.done : `${position + 1} of ${count}: ${current?.label ?? ""}`} />
        {done ? (
          <Button
            ref={againRef}
            variant="outline"
            size="sm"
            className="pointer-coarse:h-10"
            onClick={() => {
              setPosition(0)
              setChoices([])
            }}
          >
            <RotateCcw aria-hidden="true" />
            {labels.again}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="pointer-coarse:h-10" onClick={() => decide("left")}>
              <X aria-hidden="true" className="text-red-600 dark:text-red-400" />
              {labels.left}
            </Button>
            <Button variant="outline" size="sm" className="pointer-coarse:h-10" onClick={() => decide("right")}>
              <Check aria-hidden="true" className="text-emerald-600 dark:text-emerald-400" />
              {labels.right}
            </Button>
          </div>
        )}
      </div>
    </StackRoot>
  )
}
