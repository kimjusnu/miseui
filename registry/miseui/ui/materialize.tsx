import type * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

/** A surface arrives slightly smaller and softer, like glass coming into focus, never as a plain fade. */
const ENTER_SCALE = 0.96
const ENTER_BLUR_PX = 8
const ENTER_OFFSET_PX = 6

interface MaterializeProps extends Omit<React.ComponentProps<typeof motion.div>, "children"> {
  /** Mount with the enter animation; unmount with the mirrored exit. */
  show: boolean
  /** Where the surface grows from, e.g. "top left" or "50% 100%". Anchor it to the trigger. */
  origin?: string
  children: React.ReactNode
}

function Materialize({ show, origin = "center", className, style, children, ...props }: MaterializeProps) {
  const reduceMotion = useReducedMotion()
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: ENTER_SCALE, y: ENTER_OFFSET_PX, filter: `blur(${ENTER_BLUR_PX}px)` }
  const visible = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          data-slot="materialize"
          data-reduced={reduceMotion ? "true" : "false"}
          initial={hidden}
          animate={visible}
          exit={hidden}
          transition={SPRING_DEFAULT}
          style={{ transformOrigin: origin, ...style }}
          className={cn("will-change-[transform,opacity,filter]", className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { Materialize, type MaterializeProps }
