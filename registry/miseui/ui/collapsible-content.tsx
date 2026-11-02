import type * as React from "react"
import { useContext } from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  CollapsibleContext,
  DEFAULT_COLLAPSED_HEIGHT_PX,
  FADE_MASK_CLASS,
  FADE_STOP_CLOSED,
  FADE_STOP_OPEN,
  PANEL_CLASS,
} from "@/registry/miseui/ui/collapsible-classes"
import { cn } from "@/registry/miseui/lib/utils"

const INSTANT = { duration: 0 } as const

type CollapsibleContentProps = Omit<React.ComponentProps<typeof CollapsiblePrimitive.Content>, "forceMount"> & {
  /** `fade` only: how much of the text stays visible while closed. */
  collapsedHeight?: number
}

type PanelProps = CollapsibleContentProps & { collapsedHeight: number }

/** Fade without the spring: the preview is a fixed height, so it needs no measuring and stays mounted to stay visible. */
function FadeContent({ children, collapsedHeight, ...props }: PanelProps) {
  const { open } = useContext(CollapsibleContext)
  const closedStyle = { height: collapsedHeight, "--collapsible-fade": FADE_STOP_CLOSED } as React.CSSProperties
  return (
    <CollapsiblePrimitive.Content
      forceMount
      inert={!open}
      data-slot="collapsible-content"
      className={cn("overflow-hidden", !open && FADE_MASK_CLASS)}
      style={open ? undefined : closedStyle}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Content>
  )
}

function SpringContent({ children, collapsedHeight, ...props }: PanelProps) {
  const { variant, open, reduceMotion } = useContext(CollapsibleContext)
  const isFade = variant === "fade"
  const height = open ? "auto" : isFade ? collapsedHeight : 0
  // forceMount keeps the panel in the DOM so the spring can run both ways, so inert is what hides it from the tab order.
  return (
    <CollapsiblePrimitive.Content forceMount inert={!open} data-slot="collapsible-content" {...props}>
      <motion.div
        className={cn("overflow-hidden", isFade && FADE_MASK_CLASS)}
        initial={false}
        animate={isFade ? { height, "--collapsible-fade": open ? FADE_STOP_OPEN : FADE_STOP_CLOSED } : { height }}
        transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
      >
        {children}
      </motion.div>
    </CollapsiblePrimitive.Content>
  )
}

function CollapsibleContent({
  className,
  children,
  collapsedHeight = DEFAULT_COLLAPSED_HEIGHT_PX,
  ...props
}: CollapsibleContentProps) {
  const { variant, effect } = useContext(CollapsibleContext)
  const panel = <div className={cn(PANEL_CLASS[variant], className)}>{children}</div>
  if (effect === "spring") {
    return (
      <SpringContent collapsedHeight={collapsedHeight} {...props}>
        {panel}
      </SpringContent>
    )
  }
  if (variant === "fade") {
    return (
      <FadeContent collapsedHeight={collapsedHeight} {...props}>
        {panel}
      </FadeContent>
    )
  }
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none"
      {...props}
    >
      {panel}
    </CollapsiblePrimitive.Content>
  )
}

export { CollapsibleContent, type CollapsibleContentProps }
