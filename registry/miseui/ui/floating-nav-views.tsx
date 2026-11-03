import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import type { FloatingNavItem } from "@/registry/miseui/ui/floating-nav-state"
import { cn } from "@/registry/miseui/lib/utils"

export interface NavViewProps {
  label: string
  items: readonly FloatingNavItem[]
  current: string | undefined
  onSelect: (value: string) => void
  brand?: React.ReactNode
  actions?: React.ReactNode
}

/** Solid for people who ask for less transparency, and a page's text never shows through it. */
export const GLASS_CLASS = [
  "bg-background/85 backdrop-blur-lg backdrop-saturate-150",
  "[@media(prefers-reduced-transparency:reduce)]:bg-background [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
].join(" ")

/** Inset, because the rows sit in scrollers and clipped capsules that would cut an outer ring. */
export const LINK_BASE_CLASS = [
  "outline-none select-none whitespace-nowrap",
  "transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset",
  "active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
].join(" ")

const SCROLL_ROW_CLASS = "flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

interface NavLinkProps {
  item: FloatingNavItem
  active: boolean
  onSelect: (value: string) => void
  className?: string
  children: React.ReactNode
}

export function NavLink({ item, active, onSelect, className, children }: NavLinkProps) {
  const shared = {
    "data-slot": "floating-nav-link",
    "data-active": active ? "true" : undefined,
    "aria-current": active ? ("page" as const) : undefined,
    className: cn(LINK_BASE_CLASS, className),
  }
  if (item.href) {
    return (
      <a {...shared} href={item.href} onClick={() => onSelect(item.value)}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" {...shared} onClick={() => onSelect(item.value)}>
      {children}
    </button>
  )
}

function Highlight({ className }: { className: string }) {
  const reduceMotion = useReducedMotion() ?? false
  return (
    <motion.span
      aria-hidden="true"
      data-slot="floating-nav-highlight"
      layoutId={reduceMotion ? undefined : "floating-nav-highlight"}
      className={cn("absolute -z-10", className)}
    />
  )
}

export function PillView({ items, current, onSelect }: NavViewProps) {
  return (
    <div data-slot="floating-nav-pill" className={cn("pointer-events-auto flex max-w-full min-w-0 rounded-full p-1 shadow-md ring-1 shadow-black/5 ring-foreground/10 dark:shadow-black/40", GLASS_CLASS)}>
      {/* A scroller, so the row itself is not rounded: only the bar around it is. */}
      <ul className={SCROLL_ROW_CLASS}>
        {items.map((item) => (
          <li key={item.value} className="shrink-0">
            <NavLink
              item={item}
              active={current === item.value}
              onSelect={onSelect}
              className={cn(
                "relative isolate inline-flex h-8 items-center gap-2 rounded-full px-3 text-[13px] font-medium pointer-coarse:h-10",
                current === item.value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {current === item.value ? <Highlight className="inset-0 rounded-full bg-mise-soft" /> : null}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BarLinks({ items, current, onSelect }: Pick<NavViewProps, "items" | "current" | "onSelect">) {
  return items.map((item) => {
    const active = current === item.value
    return (
      // Margin instead of justify-end, which would push overflow off the start where it cannot be scrolled to.
      <li key={item.value} className="shrink-0 first:ms-auto">
        <NavLink
          item={item}
          active={active}
          onSelect={onSelect}
          className={cn(
            "relative inline-flex h-10 items-center rounded-md px-2 text-[13px] font-medium",
            active ? "text-foreground after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-mise" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </NavLink>
      </li>
    )
  })
}

const BAR_SHAPE_CLASS = {
  compact: "mt-2 h-11 w-fit max-w-[calc(100%-16px)] px-2 shadow-md ring-1 shadow-black/5 ring-foreground/10 dark:shadow-black/40",
  full: "h-14 w-full px-3 shadow-[0_1px_0_var(--border)]",
}

export function BarView({ items, current, onSelect, brand, actions, compact }: NavViewProps & { compact: boolean }) {
  const reduceMotion = useReducedMotion() ?? false
  const layout = reduceMotion ? false : "position"
  return (
    // Holds the full height at all times: the page below never moves when the bar shrinks.
    <div data-slot="floating-nav-bar-slot" className="flex h-14 w-full min-w-0 justify-center">
      <motion.div
        layout={!reduceMotion}
        data-slot="floating-nav-bar"
        data-compact={compact ? "true" : "false"}
        initial={false}
        animate={{ borderRadius: compact ? 22 : 0 }}
        className={cn("pointer-events-auto flex min-w-0 items-center gap-2 transition-shadow duration-(--duration-base) ease-(--ease-mise)", GLASS_CLASS, compact ? BAR_SHAPE_CLASS.compact : BAR_SHAPE_CLASS.full)}
      >
        {brand ? (
          <motion.div layout={layout} className="flex shrink-0 items-center gap-2 text-[15px] font-medium text-foreground">
            {brand}
          </motion.div>
        ) : null}
        <motion.ul layout={layout} className={cn(SCROLL_ROW_CLASS, !compact && "flex-1")}>
          <BarLinks items={items} current={current} onSelect={onSelect} />
        </motion.ul>
        {actions ? (
          <motion.div layout={layout} className="flex shrink-0 items-center gap-1">
            {actions}
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  )
}

export function TabsView({ items, current, onSelect }: NavViewProps) {
  return (
    <div data-slot="floating-nav-tabs" className={cn("pointer-events-auto w-full min-w-0 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--border)]", GLASS_CLASS)}>
      {/* Items share the width, so a tab bar never scrolls and each column stays a large target. */}
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = current === item.value
          return (
            <li key={item.value} className="min-w-0">
              <NavLink
                item={item}
                active={active}
                onSelect={onSelect}
                className={cn("flex h-14 w-full flex-col items-center justify-center gap-1 text-xs", active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <span aria-hidden="true" className="relative isolate flex h-7 w-12 items-center justify-center">
                  {active ? <Highlight className="inset-0 rounded-full bg-mise-soft" /> : null}
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
