import type * as React from "react"
import { createContext, useContext, useMemo, useState } from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { motion, useReducedMotion } from "motion/react"
import { ChevronDown, Plus } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  ITEM_CLASS,
  PANEL_CLASS,
  ROOT_CLASS,
  TRIGGER_CLASS,
  toOpenList,
  type AccordionEffect,
  type AccordionIconName,
  type AccordionProps,
  type AccordionValue,
  type AccordionVariant,
} from "@/registry/miseui/ui/accordion-classes"
import { cn } from "@/registry/miseui/lib/utils"

interface AccordionContextValue {
  variant: AccordionVariant
  effect: AccordionEffect | undefined
  icon: AccordionIconName
  openList: readonly string[]
  reduceMotion: boolean
}

const AccordionContext = createContext<AccordionContextValue>({
  variant: "plain",
  effect: undefined,
  icon: "chevron",
  openList: [],
  reduceMotion: false,
})
const ItemOpenContext = createContext(false)

const INSTANT = { duration: 0 } as const
/** A chevron flips to point at what it will do; a plus turns into a close mark. */
const ICON_TURN: Record<AccordionIconName, number> = { chevron: 180, plus: 45 }

function Accordion({
  variant = "plain",
  effect,
  icon,
  className,
  type = "single",
  collapsible = true,
  value,
  defaultValue,
  onValueChange,
  ...rest
}: AccordionProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState<AccordionValue | undefined>(defaultValue)
  const openList = useMemo(() => toOpenList(value ?? uncontrolled), [value, uncontrolled])
  const resolvedIcon = icon ?? (variant === "flush" ? "plus" : "chevron")
  const context = useMemo(
    () => ({ variant, effect, icon: resolvedIcon, openList, reduceMotion }),
    [variant, effect, resolvedIcon, openList, reduceMotion],
  )
  const onChange = (next: AccordionValue) => {
    setUncontrolled(next)
    ;(onValueChange as ((value: AccordionValue) => void) | undefined)?.(next)
  }
  const shared = {
    ...rest,
    "data-slot": "accordion",
    "data-variant": variant,
    "data-effect": effect,
    className: cn(ROOT_CLASS[variant], className),
    onValueChange: onChange,
  }
  return (
    <AccordionContext.Provider value={context}>
      {type === "multiple" ? (
        <AccordionPrimitive.Root {...shared} type="multiple" value={openList as string[]} />
      ) : (
        <AccordionPrimitive.Root {...shared} type="single" collapsible={collapsible} value={openList[0] ?? ""} />
      )}
    </AccordionContext.Provider>
  )
}

function AccordionItem({ className, value, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  const { variant, openList } = useContext(AccordionContext)
  return (
    <ItemOpenContext.Provider value={openList.includes(value)}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        value={value}
        className={cn(ITEM_CLASS[variant], className)}
        {...props}
      />
    </ItemOpenContext.Provider>
  )
}

function AccordionIcon() {
  const { effect, icon, reduceMotion } = useContext(AccordionContext)
  const open = useContext(ItemOpenContext)
  const Icon = icon === "plus" ? Plus : ChevronDown
  if (effect === "spring") {
    return (
      <motion.span
        aria-hidden="true"
        data-slot="accordion-icon"
        data-icon={icon}
        className="flex shrink-0 text-muted-foreground"
        initial={false}
        animate={{ rotate: open ? ICON_TURN[icon] : 0 }}
        transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
      >
        <Icon className="size-4" />
      </motion.span>
    )
  }
  return (
    <span aria-hidden="true" data-slot="accordion-icon" data-icon={icon} className="flex shrink-0 text-muted-foreground">
      <Icon
        className={cn(
          "size-4 transition-transform duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none",
          icon === "plus"
            ? "group-data-[state=open]/trigger:rotate-45"
            : "group-data-[state=open]/trigger:rotate-180",
        )}
      />
    </span>
  )
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  const { variant } = useContext(AccordionContext)
  return (
    <AccordionPrimitive.Header className="flex" data-slot="accordion-header">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/trigger flex w-full items-center justify-between gap-4 rounded-sm text-left outline-none",
          "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
          "focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          TRIGGER_CLASS[variant],
          className,
        )}
        {...props}
      >
        {children}
        <AccordionIcon />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const { variant, effect, reduceMotion } = useContext(AccordionContext)
  const open = useContext(ItemOpenContext)
  const panel = <div className={cn(PANEL_CLASS[variant], className)}>{children}</div>
  if (effect !== "spring") {
    return (
      <AccordionPrimitive.Content
        data-slot="accordion-content"
        className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none"
        {...props}
      >
        {panel}
      </AccordionPrimitive.Content>
    )
  }
  // forceMount keeps the panel in the DOM so the spring can run both ways, so inert is what keeps a closed row out of the tab order.
  return (
    <AccordionPrimitive.Content forceMount inert={!open} data-slot="accordion-content" {...props}>
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
      >
        {panel}
      </motion.div>
    </AccordionPrimitive.Content>
  )
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionProps,
  type AccordionVariant,
  type AccordionEffect,
  type AccordionIconName,
}
