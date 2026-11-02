import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type ToggleGroupVariant = "plain" | "outline" | "pill" | "icon"
type ToggleGroupEffect = "spring"
type ToggleGroupValue = string | string[]

const ROOT_CLASS: Record<ToggleGroupVariant, string> = {
  plain: "isolate inline-flex max-w-full flex-wrap items-center gap-1",
  outline: "isolate inline-flex max-w-full items-stretch divide-x rounded-md border shadow-xs",
  pill: "isolate inline-flex max-w-full flex-wrap items-center gap-2",
  icon: "isolate inline-flex max-w-full items-center gap-1",
}

const ITEM_CLASS: Record<ToggleGroupVariant, string> = {
  plain: "h-9 rounded-md px-3 text-sm hover:text-foreground pointer-coarse:h-10",
  outline: "h-9 min-w-0 px-3 text-sm first:rounded-l-[inherit] last:rounded-r-[inherit] hover:text-foreground pointer-coarse:h-10",
  pill: "h-8 rounded-full border border-input px-3 text-[13px] hover:text-foreground data-[state=on]:border-transparent pointer-coarse:h-10",
  icon: "size-9 rounded-md hover:text-foreground pointer-coarse:size-10 [&_svg]:size-4",
}

const ITEM_ON_CLASS: Record<ToggleGroupVariant, string> = {
  plain: "data-[state=on]:text-foreground",
  outline: "data-[state=on]:text-foreground",
  pill: "data-[state=on]:text-primary-foreground data-[state=on]:hover:text-primary-foreground",
  icon: "data-[state=on]:text-mise-foreground data-[state=on]:hover:text-mise-foreground",
}

const HIGHLIGHT_CLASS: Record<ToggleGroupVariant, string> = {
  plain: "bg-accent",
  outline: "bg-accent",
  pill: "bg-primary",
  icon: "bg-mise",
}

interface ToggleGroupContextValue {
  variant: ToggleGroupVariant
  onList: readonly string[]
  multiple: boolean
  spring: boolean
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  variant: "plain",
  onList: [],
  multiple: false,
  spring: false,
})

function toOnList(value: ToggleGroupValue | undefined) {
  if (value === undefined || value === "") return []
  return typeof value === "string" ? [value] : value
}

type ToggleGroupOwnProps = {
  /** `plain` a quiet fill, `outline` joined buttons, `pill` wrapping chips, `icon` square glyphs in the accent. Give `icon` items an aria-label. */
  variant?: ToggleGroupVariant
  /** `spring` slides the highlight between options in `single`; in `multiple` each highlight grows in place. */
  effect?: ToggleGroupEffect
  disabled?: boolean
}

type ToggleGroupRootProps = Omit<React.ComponentProps<"div">, "defaultValue" | "dir">

type ToggleGroupProps = ToggleGroupRootProps &
  ToggleGroupOwnProps &
  (
    | { type?: "single"; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }
    | { type: "multiple"; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void }
  )

function ToggleGroup({ variant = "plain", effect, className, type = "single", value, defaultValue, onValueChange, ...props }: ToggleGroupProps) {
  // layoutId is global to the page; without a per-instance group two groups would fight over one highlight.
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState<ToggleGroupValue | undefined>(defaultValue)
  const onList = useMemo(() => toOnList(value ?? uncontrolled), [value, uncontrolled])
  const multiple = type === "multiple"
  const spring = effect === "spring" && !reduceMotion
  const context = useMemo(() => ({ variant, onList, multiple, spring }), [variant, onList, multiple, spring])
  const change = (next: ToggleGroupValue) => {
    setUncontrolled(next)
    ;(onValueChange as ((value: ToggleGroupValue) => void) | undefined)?.(next)
  }
  const shared = {
    ...props,
    "data-slot": "toggle-group",
    "data-variant": variant,
    "data-effect": effect,
    className: cn(ROOT_CLASS[variant], className),
    onValueChange: change,
  }
  return (
    <ToggleGroupContext.Provider value={context}>
      <LayoutGroup id={groupId}>
        {multiple ? (
          <ToggleGroupPrimitive.Root {...shared} type="multiple" value={onList as string[]} />
        ) : (
          <ToggleGroupPrimitive.Root {...shared} type="single" value={onList[0] ?? ""} />
        )}
      </LayoutGroup>
    </ToggleGroupContext.Provider>
  )
}

function Highlight({ variant, multiple, spring }: Pick<ToggleGroupContextValue, "variant" | "multiple" | "spring">) {
  const className = cn("absolute inset-0 -z-10 rounded-[inherit]", HIGHLIGHT_CLASS[variant])
  if (spring && !multiple) {
    return (
      <motion.span
        aria-hidden="true"
        data-slot="toggle-group-highlight"
        layoutId="toggle-group-highlight"
        transition={SPRING_DEFAULT}
        className={className}
      />
    )
  }
  if (!spring) return <span aria-hidden="true" data-slot="toggle-group-highlight" className={className} />
  const away = { opacity: 0, scale: 0.9 }
  return (
    <motion.span
      aria-hidden="true"
      data-slot="toggle-group-highlight"
      initial={away}
      animate={{ opacity: 1, scale: 1 }}
      exit={away}
      transition={SPRING_DEFAULT}
      className={className}
    />
  )
}

function ToggleGroupItem({ value, className, children, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const { variant, onList, multiple, spring } = useContext(ToggleGroupContext)
  const on = onList.includes(value)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      value={value}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap text-muted-foreground outline-none select-none",
        "transition-[color,scale,box-shadow,border-color] duration-(--duration-fast) ease-(--ease-mise)",
        "focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100",
        "disabled:pointer-events-none disabled:opacity-50",
        ITEM_CLASS[variant],
        ITEM_ON_CLASS[variant],
        className,
      )}
      {...props}
    >
      <AnimatePresence initial={false}>
        {on ? <Highlight key="highlight" variant={variant} multiple={multiple} spring={spring} /> : null}
      </AnimatePresence>
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupVariant, type ToggleGroupEffect }
