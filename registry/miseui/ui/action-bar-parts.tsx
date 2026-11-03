import type * as React from "react"
import { createContext, useContext } from "react"
import { Toolbar as ToolbarPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"

type ActionBarVariant = "floating" | "docked" | "inline" | "compact"
type ActionBarPosition = "fixed" | "inline"
type ActionBarActionTone = "neutral" | "destructive"

const DEFAULT_POSITION: Record<ActionBarVariant, ActionBarPosition> = {
  floating: "fixed",
  docked: "fixed",
  inline: "inline",
  compact: "inline",
}

const SURFACE_CLASS: Record<ActionBarVariant, string> = {
  floating: "flex max-w-full flex-wrap items-center justify-center gap-1 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg",
  docked: "flex w-full flex-wrap items-center gap-2 border-t bg-background px-4 py-2 text-foreground",
  inline: "flex w-full min-w-0 flex-wrap items-center gap-2 rounded-md bg-mise-soft px-3 py-1 text-foreground",
  compact: "inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-3xl bg-foreground p-1 text-background shadow-md",
}

/**
 * The strip spans the viewport so the island can centre itself, and must not swallow clicks on the page beside it.
 * Every positioner is a container: labels fold into the buttons' names below 448 px, because a bar that wraps to two rows covers more of the list.
 */
const FIXED_ISLAND_CLASS =
  "pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 @container *:pointer-events-auto"

const FIXED_POSITIONER_CLASS: Record<ActionBarVariant, string> = {
  floating: FIXED_ISLAND_CLASS,
  docked: "fixed inset-x-0 bottom-0 z-40 bg-background pb-[env(safe-area-inset-bottom)] @container",
  inline: FIXED_ISLAND_CLASS,
  compact: FIXED_ISLAND_CLASS,
}

const INLINE_POSITIONER_CLASS: Record<ActionBarVariant, string> = {
  floating: "flex w-full min-w-0 justify-center @container",
  docked: "w-full min-w-0 @container",
  inline: "w-full min-w-0 @container",
  compact: "flex w-full min-w-0 justify-center @container",
}

const ActionBarVariantContext = createContext<ActionBarVariant>("floating")

const CONTROL_CLASS = cn(
  "relative inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap outline-none select-none",
  "transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "active:scale-[0.97] active:duration-0 motion-reduce:active:scale-100",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
)

const WIDE_CONTROL_CLASS = "h-9 min-w-9 rounded-md px-2 text-sm hover:bg-foreground/[0.07] active:bg-foreground/10 pointer-coarse:h-10 pointer-coarse:min-w-10"
const COMPACT_CONTROL_CLASS = "size-8 rounded-full hover:bg-background/15 active:bg-background/25 pointer-coarse:size-10"

/** The compact surface is inverted, so the error colour needs the opposite lightness to stay readable on it. */
const DESTRUCTIVE_CLASS: Record<"wide" | "compact", string> = {
  wide: "text-destructive hover:bg-destructive/10 active:bg-destructive/15",
  compact: "text-red-400 dark:text-red-600",
}

type ActionBarActionProps = Omit<React.ComponentProps<typeof ToolbarPrimitive.Button>, "children"> & {
  /** Required: this text is the button's name even when the bar has only room for the glyph. */
  children: string
  icon?: React.ReactNode
  tone?: ActionBarActionTone
}

function ActionBarAction({ children, icon, tone = "neutral", className, title, ...props }: ActionBarActionProps) {
  const variant = useContext(ActionBarVariantContext)
  const compact = variant === "compact"
  const canFold = Boolean(icon)
  return (
    <ToolbarPrimitive.Button
      data-slot="action-bar-action"
      data-tone={tone}
      title={title ?? (compact ? children : undefined)}
      className={cn(
        CONTROL_CLASS,
        compact ? COMPACT_CONTROL_CLASS : WIDE_CONTROL_CLASS,
        tone === "destructive" && DESTRUCTIVE_CLASS[compact ? "compact" : "wide"],
        compact && !canFold && "w-auto px-3 pointer-coarse:w-auto",
        className,
      )}
      {...props}
    >
      {icon}
      <span className={canFold ? (compact ? "sr-only" : "sr-only @md:not-sr-only") : undefined}>{children}</span>
    </ToolbarPrimitive.Button>
  )
}

function ActionBarClear({ label, wide, onClick }: { label: string; wide: boolean; onClick: () => void }) {
  const variant = useContext(ActionBarVariantContext)
  const compact = variant === "compact"
  return (
    <ToolbarPrimitive.Button
      data-slot="action-bar-clear"
      aria-label={label}
      onClick={onClick}
      className={cn(CONTROL_CLASS, compact ? COMPACT_CONTROL_CLASS : WIDE_CONTROL_CLASS, !compact && "text-muted-foreground")}
    >
      {wide ? "Clear" : <X aria-hidden="true" />}
    </ToolbarPrimitive.Button>
  )
}

function ActionBarSeparator() {
  return <ToolbarPrimitive.Separator data-slot="action-bar-separator" className="mx-1 h-4 w-px bg-border" />
}

export {
  ActionBarAction,
  ActionBarClear,
  ActionBarSeparator,
  ActionBarVariantContext,
  DEFAULT_POSITION,
  FIXED_POSITIONER_CLASS,
  INLINE_POSITIONER_CLASS,
  SURFACE_CLASS,
  type ActionBarActionProps,
  type ActionBarActionTone,
  type ActionBarPosition,
  type ActionBarVariant,
}
