import { cn } from "@/registry/miseui/lib/utils"

type NavigationMenuVariant = "bar" | "mega" | "pill" | "underline"
type NavigationMenuEffect = "materialize"

const FOCUS_CLASS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

/** `pill` and `underline` slide an indicator that measures one row only, so those two must not wrap. */
const LIST_CLASS: Record<NavigationMenuVariant, string> = {
  bar: "flex flex-wrap items-center gap-1",
  mega: "flex flex-wrap items-center gap-1",
  pill: "flex w-fit items-center rounded-full bg-muted p-1",
  underline: "flex items-center border-b",
}

const ITEM_CLASS: Record<NavigationMenuVariant, string> = {
  bar: "h-9 rounded-md px-3 hover:bg-accent data-[state=open]:bg-accent data-active:font-medium pointer-coarse:h-10",
  mega: "h-9 rounded-md px-3 font-medium hover:bg-accent data-[state=open]:bg-accent pointer-coarse:h-10",
  // The moving pill behind them is the indicator; z-10 keeps the words above it.
  pill: "relative z-10 h-8 rounded-full px-3 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground data-active:bg-background data-active:text-foreground data-active:shadow-xs pointer-coarse:h-10",
  underline:
    "relative z-10 -mb-px h-10 border-b-2 border-transparent px-3 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground data-active:border-foreground data-active:text-foreground",
}

const ITEM_BASE_CLASS = cn(
  "group/trigger inline-flex items-center justify-center gap-1 text-sm whitespace-nowrap",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
  FOCUS_CLASS,
)

const INDICATOR_BASE_CLASS = "transition-[width,transform] duration-(--duration-base) ease-(--ease-mise-out) motion-reduce:transition-none"
const INDICATOR_CLASS: Partial<Record<NavigationMenuVariant, string>> = {
  pill: "top-1 z-0 h-[calc(100%-8px)] rounded-full bg-background shadow-xs",
  underline: "bottom-0 z-20 h-0.5 bg-foreground",
}

const PANEL_ENTER_CLASS = cn(
  "duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
)
/** The enter and exit values stay unqualified so the media overrides below win on source order. */
const PANEL_MATERIALIZE_CLASS = cn(
  "transition-[width,height,left] duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "fade-in-0 zoom-in-90 blur-in-sm fade-out-0 zoom-out-90 blur-out-sm",
  "motion-reduce:transition-none motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
)

const CONTENT_MATERIALIZE_CLASS = cn(
  "duration-(--duration-base) ease-(--ease-mise-out)",
  "data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in-0 data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out-0",
  "data-[motion=from-end]:slide-in-from-right-4 data-[motion=from-start]:slide-in-from-left-4",
  "data-[motion=to-end]:slide-out-to-right-4 data-[motion=to-start]:slide-out-to-left-4",
  "motion-reduce:animate-none",
)

/** Widths in cqw of the root, which is the container: a narrow column gets a narrow panel and nothing overflows the page. */
const CONTENT_WIDTH_CLASS: Record<NavigationMenuVariant, string> = {
  bar: "w-[min(20rem,100cqw)]",
  mega: "w-full",
  pill: "w-[min(20rem,100cqw)]",
  underline: "w-[min(20rem,100cqw)]",
}

const CONTENT_LAYOUT_CLASS: Record<NavigationMenuVariant, string> = {
  bar: "grid gap-1 p-2",
  mega: "grid gap-4 p-4 @md:grid-cols-2 @2xl:grid-cols-3",
  pill: "grid gap-1 p-2",
  underline: "grid gap-1 p-2",
}

/**
 * Follows the open trigger but stops at the right edge. `left` and not a transform, so the percentage
 * means the width of the root; the Radix variable holds the panel's own measured width.
 */
const VIEWPORT_LEFT = "max(0px, min(var(--navigation-menu-left, 0px), calc(100% - var(--radix-navigation-menu-viewport-width, 0px))))"

const PANEL_LINK_CLASS = cn(
  "flex min-h-10 gap-3 rounded-md p-2 text-left",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent data-active:bg-accent",
  FOCUS_CLASS,
)

export {
  CONTENT_LAYOUT_CLASS,
  CONTENT_MATERIALIZE_CLASS,
  CONTENT_WIDTH_CLASS,
  INDICATOR_BASE_CLASS,
  INDICATOR_CLASS,
  ITEM_BASE_CLASS,
  ITEM_CLASS,
  LIST_CLASS,
  PANEL_ENTER_CLASS,
  PANEL_LINK_CLASS,
  PANEL_MATERIALIZE_CLASS,
  VIEWPORT_LEFT,
  type NavigationMenuEffect,
  type NavigationMenuVariant,
}
