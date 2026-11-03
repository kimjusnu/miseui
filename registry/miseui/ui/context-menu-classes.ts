type ContextMenuVariant = "plain" | "compact" | "grouped" | "icon"
type ContextMenuEffect = "materialize"

const TRIGGER_CLASS = [
  "rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  // Without this a long press on a phone selects the words under the finger before the menu opens.
  "pointer-coarse:select-none",
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
]

/**
 * Menus only animate in. A right-click somewhere else closes the menu and opens it again in the same gesture,
 * and a panel still fading out would be brought back at the old point before it moves.
 */
const PLAIN_MOTION_CLASS = [
  "duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:data-[state=open]:zoom-in-100",
]

/** The enter values stay unqualified so the media overrides below win on source order. */
const MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in",
  "fade-in-0 zoom-in-90 blur-in-sm",
  "motion-reduce:zoom-in-100 motion-reduce:blur-in-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0",
]

const PANEL_BASE_CLASS = [
  "z-50 max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto border bg-popover text-popover-foreground shadow-md",
  "max-h-(--radix-context-menu-content-available-height) origin-(--radix-context-menu-content-transform-origin)",
]

const PANEL_CLASS: Record<ContextMenuVariant, string> = {
  plain: "min-w-48 rounded-md p-1",
  compact: "min-w-40 rounded-sm p-1",
  // No panel padding: each group brings its own, so the dividers run from edge to edge.
  grouped: "min-w-56 rounded-lg",
  icon: "min-w-52 rounded-lg p-1",
}

const ITEM_BASE_CLASS = [
  "relative flex cursor-default items-center gap-2 rounded-sm outline-hidden select-none",
  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise)",
  "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
]

const ITEM_CLASS: Record<ContextMenuVariant, string> = {
  plain: "px-2 py-1.5 text-sm pointer-coarse:py-2.5",
  compact: "px-2 py-1 text-[13px] pointer-coarse:py-2.5",
  grouped: "px-2 py-1.5 text-sm pointer-coarse:py-2.5",
  icon: "px-2 py-2 text-sm pointer-coarse:py-2.5",
}

const DESTRUCTIVE_ITEM_CLASS = "text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20"

/** Check and radio rows keep a fixed slot on the left, the same width as an icon, so all labels line up. */
const INDICATOR_ITEM_CLASS = "pl-8"

const LABEL_CLASS: Record<ContextMenuVariant, string> = {
  plain: "px-2 py-1.5 text-[13px] text-muted-foreground",
  compact: "px-2 py-1 text-xs text-muted-foreground",
  grouped: "px-2 pt-1 pb-1 text-[13px] font-medium text-foreground",
  icon: "px-2 py-1.5 text-[13px] text-muted-foreground",
}

const GROUP_CLASS: Record<ContextMenuVariant, string> = {
  plain: "",
  compact: "",
  grouped: "border-t p-1 first:border-t-0",
  icon: "",
}

const QUICK_ITEM_CLASS = [
  "flex size-8 flex-1 cursor-default items-center justify-center rounded-sm text-muted-foreground outline-hidden select-none pointer-coarse:h-10",
  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise)",
  "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:size-4",
]

export {
  DESTRUCTIVE_ITEM_CLASS,
  GROUP_CLASS,
  INDICATOR_ITEM_CLASS,
  ITEM_BASE_CLASS,
  ITEM_CLASS,
  LABEL_CLASS,
  MATERIALIZE_CLASS,
  PANEL_BASE_CLASS,
  PANEL_CLASS,
  PLAIN_MOTION_CLASS,
  QUICK_ITEM_CLASS,
  TRIGGER_CLASS,
  type ContextMenuEffect,
  type ContextMenuVariant,
}
