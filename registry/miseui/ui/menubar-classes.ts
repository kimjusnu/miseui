type MenubarVariant = "plain" | "ghost" | "pill" | "app"
type MenubarEffect = "materialize"

const BAR_CLASS: Record<MenubarVariant, string> = {
  plain: "flex flex-wrap items-center gap-1 rounded-md border bg-background p-1 shadow-xs",
  ghost: "flex flex-wrap items-center gap-1",
  pill: "flex flex-wrap items-center gap-1 rounded-[20px] bg-muted p-1",
  app: "flex flex-wrap items-center gap-1 px-1",
}

const TRIGGER_BASE_CLASS = [
  "inline-flex h-8 items-center gap-1 px-3 text-sm font-medium outline-none select-none pointer-coarse:h-10",
  "transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
]

const TRIGGER_CLASS: Record<MenubarVariant, string> = {
  plain: "rounded-sm hover:bg-accent focus:bg-accent data-[state=open]:bg-accent",
  // Nothing is drawn until a menu opens, so the words alone have to say they can be pressed.
  ghost: "rounded-sm text-muted-foreground hover:text-foreground focus:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground",
  pill: "rounded-full text-muted-foreground hover:text-foreground focus:text-foreground data-[state=open]:bg-background data-[state=open]:text-foreground data-[state=open]:shadow-xs",
  app: "h-7 rounded-sm px-2 text-[13px] font-normal hover:bg-accent focus:bg-accent data-[state=open]:bg-accent pointer-coarse:h-10",
}

/**
 * Menus only animate in. While one is still animating out, Radix closes the next menu that the arrow keys
 * just opened, and moving along the bar stops working in a real browser. jsdom has no animations and passes.
 */
const PLAIN_MOTION_CLASS = [
  "duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
]

/** The enter values stay unqualified so the media overrides below win on source order. */
const MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in",
  "fade-in-0 zoom-in-90 blur-in-sm",
  "motion-reduce:zoom-in-100 motion-reduce:blur-in-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0",
]

const PANEL_CLASS = [
  "z-50 min-w-48 max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
  "max-h-(--radix-menubar-content-available-height) origin-(--radix-menubar-content-transform-origin)",
]

const ITEM_CLASS = [
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none pointer-coarse:py-2.5",
  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise)",
  "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
]

const DESTRUCTIVE_ITEM_CLASS = "text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20"

/** Check and radio rows keep a fixed slot on the left, so labels line up whether or not they are selected. */
const INDICATOR_ITEM_CLASS = "pl-8"

export {
  BAR_CLASS,
  DESTRUCTIVE_ITEM_CLASS,
  INDICATOR_ITEM_CLASS,
  ITEM_CLASS,
  MATERIALIZE_CLASS,
  PANEL_CLASS,
  PLAIN_MOTION_CLASS,
  TRIGGER_BASE_CLASS,
  TRIGGER_CLASS,
  type MenubarEffect,
  type MenubarVariant,
}
