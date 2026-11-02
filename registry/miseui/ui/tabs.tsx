import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type TabsEffect = "spring" | "pill"

interface TabsEffectValue {
  effect: TabsEffect
  value: string | undefined
  reduceMotion: boolean
}

const TabsEffectContext = createContext<TabsEffectValue | null>(null)

/** Motion corrects a corner radius for layout scaling only when it is a px value in `style`, so the pill stays round mid-slide. */
const PILL_RADIUS_PX = 999

const EFFECT_LIST_CLASS: Record<TabsEffect, string> = {
  spring: "h-10 gap-1 rounded-none border-b border-border bg-transparent p-0",
  pill: "h-10 rounded-full",
}

const EFFECT_TRIGGER_CLASS: Record<TabsEffect, string> = {
  spring: "px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
  pill: "rounded-full px-3 data-[state=active]:bg-transparent data-[state=active]:text-mise-foreground data-[state=active]:shadow-none",
}

const INDICATOR_CLASS: Record<TabsEffect, string> = {
  spring: "absolute inset-x-1 -bottom-0.5 -z-10 h-0.5 rounded-full bg-mise",
  pill: "absolute -inset-px -z-10 bg-mise shadow-sm",
}

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root> & {
  /** `spring` slides an underline between triggers; `pill` slides a filled pill behind the label. */
  effect?: TabsEffect
}

function Tabs({ effect, className, ...props }: TabsProps) {
  if (effect) return <EffectTabs effect={effect} className={className} {...props} />
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
}

function EffectTabs({
  effect,
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: TabsProps & { effect: TabsEffect }) {
  // layoutId is global to the page; without a per-instance group two Tabs would fight over one indicator.
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const current = value ?? uncontrolled
  const context = useMemo(() => ({ effect, value: current, reduceMotion }), [effect, current, reduceMotion])

  return (
    <TabsEffectContext.Provider value={context}>
      <LayoutGroup id={groupId}>
        <TabsPrimitive.Root
          data-slot="tabs"
          data-effect={effect}
          className={cn("flex flex-col gap-2", className)}
          value={value}
          defaultValue={defaultValue}
          onValueChange={(next) => {
            setUncontrolled(next)
            onValueChange?.(next)
          }}
          {...props}
        />
      </LayoutGroup>
    </TabsEffectContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const context = useContext(TabsEffectContext)
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        // One stacking context for the whole list keeps a flying indicator behind every label, not just its own.
        context && ["isolate", EFFECT_LIST_CLASS[context.effect]],
        className,
      )}
      {...props}
    />
  )
}

function TabsIndicator({ effect, reduceMotion }: Pick<TabsEffectValue, "effect" | "reduceMotion">) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="tabs-indicator"
      data-reduced={reduceMotion ? "true" : "false"}
      layoutId={reduceMotion ? undefined : "tabs-indicator"}
      transition={SPRING_DEFAULT}
      className={INDICATOR_CLASS[effect]}
      style={effect === "pill" ? { borderRadius: PILL_RADIUS_PX } : undefined}
    />
  )
}

function TabsTrigger({
  className,
  value,
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const context = useContext(TabsEffectContext)
  // A Slot takes exactly one child, so an asChild trigger keeps the plain active style instead of an indicator.
  const indicator = context !== null && !asChild ? context : null
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      asChild={asChild}
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium text-muted-foreground",
        "transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
        "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        indicator && ["relative", EFFECT_TRIGGER_CLASS[indicator.effect]],
        className,
      )}
      {...props}
    >
      {indicator ? (
        <>
          {indicator.value === value ? (
            <TabsIndicator effect={indicator.effect} reduceMotion={indicator.reduceMotion} />
          ) : null}
          {children}
        </>
      ) : (
        children
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsEffect, type TabsProps }
