import type * as React from "react"
import { useContext, useMemo, useState } from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { motion, useReducedMotion } from "motion/react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  CollapsibleContext,
  ROOT_CLASS,
  TRIGGER_CLASS,
  type CollapsibleEffect,
  type CollapsibleVariant,
} from "@/registry/miseui/ui/collapsible-classes"
import { CollapsibleContent, type CollapsibleContentProps } from "@/registry/miseui/ui/collapsible-content"
import { cn } from "@/registry/miseui/lib/utils"

const INSTANT = { duration: 0 } as const

type CollapsibleProps = React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
  /** `plain` a bare row, `card` a bordered surface, `fade` long text fading into Show more, `inline` a quiet text link. */
  variant?: CollapsibleVariant
  /** `spring` animates height from wherever it is now, so it can reverse mid-flight. */
  effect?: CollapsibleEffect
}

function Collapsible({
  variant = "plain",
  effect,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  ...props
}: CollapsibleProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const current = open ?? uncontrolled
  const context = useMemo(
    () => ({ variant, effect, open: current, reduceMotion }),
    [variant, effect, current, reduceMotion],
  )
  return (
    <CollapsibleContext.Provider value={context}>
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        data-variant={variant}
        data-effect={effect}
        className={cn(ROOT_CLASS[variant], className)}
        open={current}
        onOpenChange={(next) => {
          setUncontrolled(next)
          onOpenChange?.(next)
        }}
        {...props}
      />
    </CollapsibleContext.Provider>
  )
}

function CollapsibleIcon() {
  const { variant, effect, open, reduceMotion } = useContext(CollapsibleContext)
  const isInline = variant === "inline"
  const Icon = isInline ? ChevronRight : ChevronDown
  if (effect === "spring") {
    return (
      <motion.span
        aria-hidden="true"
        className="flex shrink-0 text-muted-foreground"
        initial={false}
        animate={{ rotate: open ? (isInline ? 90 : 180) : 0 }}
        transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
      >
        <Icon className="size-4" />
      </motion.span>
    )
  }
  return (
    <span aria-hidden="true" className="flex shrink-0 text-muted-foreground">
      <Icon
        className={cn(
          "size-4 transition-transform duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none",
          isInline ? "group-data-[state=open]/trigger:rotate-90" : "group-data-[state=open]/trigger:rotate-180",
        )}
      />
    </span>
  )
}

type CollapsibleTriggerProps = React.ComponentProps<typeof CollapsiblePrimitive.Trigger> & {
  /** Used when the trigger has no children. */
  moreLabel?: string
  lessLabel?: string
}

function CollapsibleTrigger({
  className,
  children,
  moreLabel = "Show more",
  lessLabel = "Show less",
  ...props
}: CollapsibleTriggerProps) {
  const { variant, open } = useContext(CollapsibleContext)
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "group/trigger rounded-sm text-left outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise)",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        TRIGGER_CLASS[variant],
        className,
      )}
      {...props}
    >
      {children ?? (open ? lessLabel : moreLabel)}
      <CollapsibleIcon />
    </CollapsiblePrimitive.Trigger>
  )
}

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps,
  type CollapsibleVariant,
  type CollapsibleEffect,
}
