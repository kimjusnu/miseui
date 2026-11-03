import type * as React from "react"
import { createContext, useContext, useMemo, useRef } from "react"
import { Toolbar as ToolbarPrimitive } from "radix-ui"
import { useReducedMotion } from "motion/react"
import { hopOnce, useDockMagnify } from "@/registry/miseui/ui/dock-magnify"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/miseui/ui/tooltip"
import { cn } from "@/registry/miseui/lib/utils"

type DockVariant = "glass" | "plain" | "vertical" | "labeled"
type DockEffect = "magnify" | "bounce"

/** Concentric with the 8 px of padding around a tile. */
const BAR_RADIUS = "rounded-[calc(var(--radius)+4px)]"

const SURFACE_CLASS: Record<DockVariant, string> = {
  glass: cn(
    BAR_RADIUS,
    "bg-background/70 shadow-lg ring-1 shadow-black/5 ring-foreground/10 backdrop-blur-xl backdrop-saturate-150 dark:bg-card/70 dark:shadow-black/40",
    "[@media(prefers-reduced-transparency:reduce)]:bg-background [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
  ),
  plain: "hidden",
  vertical: cn(BAR_RADIUS, "bg-card ring-1 ring-border"),
  labeled: cn(BAR_RADIUS, "bg-card ring-1 ring-border"),
}

const LIST_CLASS: Record<DockVariant, string> = {
  glass: "flex gap-1 p-2",
  plain: "flex gap-2 p-1",
  vertical: "flex flex-col gap-1 p-2",
  labeled: "flex gap-1 p-2",
}

const TILE_BASE_CLASS = [
  "relative inline-flex items-center justify-center rounded-md outline-none select-none",
  "transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  "active:scale-95 active:duration-100 motion-reduce:active:scale-100",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
]

/** The icon-only rows stay at 40 px on every input, so a finger needs no special case. */
const TILE_CLASS: Record<DockVariant, { shape: string; idle: string; active: string }> = {
  glass: {
    shape: "size-10 origin-bottom",
    idle: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
    active: "text-foreground",
  },
  plain: {
    shape: "size-10 origin-bottom shadow-xs ring-1",
    idle: "bg-card text-muted-foreground ring-border hover:text-foreground",
    active: "bg-mise text-mise-foreground ring-transparent",
  },
  vertical: {
    shape: "size-10 origin-left",
    idle: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
    active: "bg-mise-soft text-foreground",
  },
  labeled: {
    shape: "h-14 w-full origin-bottom flex-col gap-1 text-xs",
    idle: "text-muted-foreground hover:text-foreground",
    active: "font-medium text-foreground",
  },
}

/** Each mark sits where that layout has room: under the icon, on the rail's edge, behind the icon. A filled tile needs none. */
const MARK_CLASS: Record<DockVariant, string | null> = {
  glass: "absolute bottom-0.5 left-1/2 h-[3px] w-3 -translate-x-1/2 rounded-full bg-mise",
  plain: null,
  vertical: "absolute top-1/2 -left-2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-mise",
  labeled: "absolute top-1.5 left-1/2 -z-10 h-7 w-10 -translate-x-1/2 rounded-full bg-mise-soft",
}

interface DockContextValue {
  variant: DockVariant
  effect?: DockEffect
}

const DockContext = createContext<DockContextValue>({ variant: "glass" })

type DockProps = Omit<React.ComponentProps<"nav">, "aria-label"> & {
  /** Names the landmark and the toolbar inside it. */
  label: string
  /** `glass` a translucent bar, `plain` tiles with no bar, `vertical` a side rail, `labeled` words under every icon. */
  variant?: DockVariant
  /** `magnify` swells items near the pointer or keyboard focus. `bounce` hops an item marked `opens` when it is pressed. */
  effect?: DockEffect
}

function Dock({ label, variant = "glass", effect, className, children, ...props }: DockProps) {
  const vertical = variant === "vertical"
  const { rootRef, listRef, surfaceRef, fits, handlers } = useDockMagnify({ enabled: effect === "magnify", vertical })
  const context = useMemo(() => ({ variant, effect }), [variant, effect])
  return (
    <DockContext.Provider value={context}>
      <nav data-slot="dock" data-variant={variant} data-effect={effect} data-fits={fits ? "true" : "false"} aria-label={label} className={cn("inline-grid max-w-full min-w-0 grid-cols-[minmax(0,1fr)]", className)} {...props}>
        {/* Does not move, so the pointer is measured against something steady. Reserves what a magnified tile rises into. */}
        <div ref={rootRef} data-slot="dock-frame" className={cn("relative isolate grid min-w-0 grid-cols-[minmax(0,1fr)]", effect === "magnify" && (vertical ? "pr-4" : "pt-4"))} {...handlers}>
          <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)]">
            <span ref={surfaceRef} aria-hidden="true" data-slot="dock-surface" className={cn("pointer-events-none absolute inset-0 -z-10", SURFACE_CLASS[variant])} />
            <ToolbarPrimitive.Root
              ref={listRef}
              data-slot="dock-list"
              aria-label={label}
              orientation={vertical ? "vertical" : "horizontal"}
              className={cn(
                LIST_CLASS[variant],
                // A scroller clips in both directions, so it is only one when the row really cannot fit.
                !fits && (vertical ? "overflow-y-auto" : "overflow-x-auto"),
                !fits && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              )}
            >
              {children}
            </ToolbarPrimitive.Root>
          </div>
        </div>
      </nav>
    </DockContext.Provider>
  )
}

type DockItemProps = Omit<React.ComponentProps<"button">, "children" | "ref"> & {
  /** The accessible name, and the tooltip or the visible word depending on the variant. */
  label: string
  /** The current page or app: sets aria-current and draws the variant's mark. */
  active?: boolean
  /** This item opens something, so `bounce` may answer it. Items that only switch a view stay still. */
  opens?: boolean
  /** Renders a link instead of a button. */
  href?: string
  children: React.ReactNode
}

function DockItem({ label, active = false, opens = false, href, className, children, onClick, disabled, ...props }: DockItemProps) {
  const { variant, effect } = useContext(DockContext)
  const reduceMotion = useReducedMotion() ?? false
  const iconRef = useRef<HTMLSpanElement>(null)
  const tile = TILE_CLASS[variant]
  const labeled = variant === "labeled"
  const shared = {
    "data-slot": "dock-item",
    "aria-current": active ? ("page" as const) : undefined,
    "aria-label": labeled ? undefined : label,
    className: cn(TILE_BASE_CLASS, tile.shape, active ? tile.active : tile.idle, className),
  }
  const press: React.MouseEventHandler<HTMLElement> = (event) => {
    onClick?.(event as React.MouseEvent<HTMLButtonElement>)
    if (effect === "bounce" && opens && !reduceMotion) hopOnce(iconRef.current, variant === "vertical")
  }
  const body = (
    <>
      {active && MARK_CLASS[variant] ? <span aria-hidden="true" data-slot="dock-mark" className={MARK_CLASS[variant] as string} /> : null}
      <span ref={iconRef} aria-hidden="true" data-slot="dock-icon" className={cn("inline-flex", labeled && "h-7 items-center")}>
        {children}
      </span>
      {labeled ? <span data-slot="dock-label" className="leading-none whitespace-nowrap">{label}</span> : null}
    </>
  )
  const item = href ? (
    <ToolbarPrimitive.Link {...shared} href={href} onClick={press}>
      {body}
    </ToolbarPrimitive.Link>
  ) : (
    <ToolbarPrimitive.Button {...shared} {...props} type="button" disabled={disabled} onClick={press}>
      {body}
    </ToolbarPrimitive.Button>
  )
  return (
    <span data-slot="dock-slot" className={cn("relative flex shrink-0", labeled && "isolate w-16 min-w-11 shrink")}>
      {labeled ? (
        item
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{item}</TooltipTrigger>
          {/* Follows the tile each frame while open, since a magnified tile moves without any layout change. */}
          <TooltipContent side={variant === "vertical" ? "right" : "top"} sideOffset={8} updatePositionStrategy="always">
            {label}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  )
}

export { Dock, DockItem, type DockProps, type DockItemProps, type DockVariant, type DockEffect }
