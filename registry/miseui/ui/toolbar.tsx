import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { Toolbar as ToolbarPrimitive } from "radix-ui"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type ToolbarVariant = "plain" | "floating" | "pill" | "vertical"
type ToolbarEffect = "spring"
type ToolbarOverflow = "wrap" | "scroll"

const ROOT_CLASS: Record<ToolbarVariant, string> = {
  plain: "rounded-md border bg-background p-1 shadow-xs",
  floating: "rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg",
  // 20 px is a full pill at one row, and a soft rectangle if the tools wrap to two.
  pill: "rounded-[20px] bg-muted p-1",
  vertical: "rounded-xl border bg-background p-1 shadow-xs",
}

const ITEM_BASE_CLASS = [
  "relative inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-2 px-2 text-[13px] font-medium whitespace-nowrap outline-none select-none",
  "pointer-coarse:h-10 pointer-coarse:min-w-10",
  "transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  "active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
]
const ITEM_SHAPE_CLASS: Record<ToolbarVariant, string> = {
  plain: "rounded-sm",
  floating: "rounded-md",
  pill: "rounded-full",
  vertical: "rounded-md",
}
const IDLE_CLASS = "text-muted-foreground hover:text-foreground"
const PRESSED_CLASS = "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
const PRESSED_SPRING_CLASS = "isolate data-[state=on]:text-foreground"

const ToolbarContext = createContext<{ variant: ToolbarVariant; effect?: ToolbarEffect }>({ variant: "plain" })
const ToggleGroupContext = createContext<{ shared: boolean; pressed: readonly string[] }>({ shared: false, pressed: [] })

type ToolbarProps = React.ComponentProps<typeof ToolbarPrimitive.Root> & {
  /** `plain` a bordered strip, `floating` a raised palette, `pill` a rounded track, `vertical` a column beside the work. */
  variant?: ToolbarVariant
  /** `spring` slides one highlight between the items of a single-choice group. */
  effect?: ToolbarEffect
  /** What happens when the tools do not fit: `wrap` to more rows or `scroll` inside itself. Ignored by `vertical`. */
  overflow?: ToolbarOverflow
}

function Toolbar({ variant = "plain", effect, overflow = "wrap", className, orientation, ...props }: ToolbarProps) {
  // layoutId is global to the page; without a per-instance group two toolbars would share one highlight.
  const groupId = useId()
  const context = useMemo(() => ({ variant, effect }), [variant, effect])
  const vertical = variant === "vertical"
  const scrolls = !vertical && overflow === "scroll"
  return (
    <ToolbarContext.Provider value={context}>
      <LayoutGroup id={groupId}>
        <ToolbarPrimitive.Root
          data-slot="toolbar"
          data-variant={variant}
          data-effect={effect}
          data-overflow={vertical ? undefined : overflow}
          orientation={orientation ?? (vertical ? "vertical" : "horizontal")}
          className={cn(
            "flex min-w-0 gap-1",
            ROOT_CLASS[variant],
            vertical ? "w-fit flex-col items-center" : "items-center",
            !vertical && (scrolls ? "overflow-x-auto" : "flex-wrap"),
            // A rounded clip on a scroller cuts off whatever runs past its edge.
            scrolls && "rounded-none",
            className,
          )}
          {...props}
        />
      </LayoutGroup>
    </ToolbarContext.Provider>
  )
}

function ToolbarGroup({ className, ...props }: React.ComponentProps<"div">) {
  const { variant } = useContext(ToolbarContext)
  return (
    <div
      role="group"
      data-slot="toolbar-group"
      className={cn("flex shrink-0 items-center gap-1", variant === "vertical" && "flex-col", className)}
      {...props}
    />
  )
}

function ToolbarSeparator({ className, ...props }: React.ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-6",
        "data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-6 data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  )
}

function ToolbarButton({ className, ...props }: React.ComponentProps<typeof ToolbarPrimitive.Button>) {
  const { variant } = useContext(ToolbarContext)
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(ITEM_BASE_CLASS, ITEM_SHAPE_CLASS[variant], IDLE_CLASS, "hover:bg-accent", className)}
      {...props}
    />
  )
}

function ToolbarLink({ className, ...props }: React.ComponentProps<typeof ToolbarPrimitive.Link>) {
  const { variant } = useContext(ToolbarContext)
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(ITEM_BASE_CLASS, ITEM_SHAPE_CLASS[variant], "font-normal text-foreground underline decoration-current/40 underline-offset-4", className)}
      {...props}
    />
  )
}

type GroupProps = React.ComponentProps<typeof ToolbarPrimitive.ToggleGroup>

function toPressed(value: string | readonly string[] | undefined): readonly string[] {
  if (value === undefined || value === "") return []
  return typeof value === "string" ? [value] : value
}

function ToolbarToggleGroup({ className, value, defaultValue, onValueChange, type, ...props }: GroupProps) {
  const { variant, effect } = useContext(ToolbarContext)
  const [uncontrolled, setUncontrolled] = useState<string | string[] | undefined>(defaultValue)
  const pressed = toPressed(value ?? uncontrolled)
  // Only one thing can be chosen, so only a single group has one highlight to slide. Several would have to split.
  const context = useMemo(() => ({ shared: effect === "spring" && type === "single", pressed }), [effect, type, pressed])
  const shared = {
    "data-slot": "toolbar-toggle-group",
    className: cn("flex shrink-0 items-center gap-1", variant === "vertical" && "flex-col", className),
  }
  const report = (next: string | string[]) => {
    setUncontrolled(next)
    ;(onValueChange as ((value: string | string[]) => void) | undefined)?.(next)
  }
  return (
    <ToggleGroupContext.Provider value={context}>
      {type === "multiple" ? (
        // Radix gives this group the toolbar role, which would announce a toolbar inside the toolbar.
        <ToolbarPrimitive.ToggleGroup {...(props as object)} {...shared} role="group" type="multiple" value={pressed as string[]} onValueChange={report} />
      ) : (
        <ToolbarPrimitive.ToggleGroup {...(props as object)} {...shared} type="single" value={pressed[0] ?? ""} onValueChange={report} />
      )}
    </ToggleGroupContext.Provider>
  )
}

function ToolbarToggleItem({ className, children, value, ...props }: React.ComponentProps<typeof ToolbarPrimitive.ToggleItem>) {
  const { variant } = useContext(ToolbarContext)
  const { shared, pressed } = useContext(ToggleGroupContext)
  const reduceMotion = useReducedMotion() ?? false
  return (
    <ToolbarPrimitive.ToggleItem
      data-slot="toolbar-toggle-item"
      value={value}
      className={cn(ITEM_BASE_CLASS, ITEM_SHAPE_CLASS[variant], IDLE_CLASS, "hover:bg-accent", shared ? PRESSED_SPRING_CLASS : PRESSED_CLASS, className)}
      {...props}
    >
      {shared && pressed.includes(value) ? (
        <motion.span
          aria-hidden="true"
          data-slot="toolbar-highlight"
          data-reduced={reduceMotion ? "true" : "false"}
          layoutId={reduceMotion ? undefined : "toolbar-highlight"}
          transition={SPRING_DEFAULT}
          className={cn("absolute inset-0 -z-10 bg-mise-soft", ITEM_SHAPE_CLASS[variant])}
        />
      ) : null}
      {children}
    </ToolbarPrimitive.ToggleItem>
  )
}

export {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarButton,
  ToolbarLink,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  type ToolbarProps,
  type ToolbarVariant,
  type ToolbarEffect,
  type ToolbarOverflow,
}
