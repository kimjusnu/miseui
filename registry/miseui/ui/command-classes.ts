type CommandVariant = "dialog" | "inline" | "compact" | "spotlight"
type CommandEffect = "materialize"

const SURFACE_CLASS: Record<CommandVariant, string> = {
  dialog: "rounded-xl border bg-popover text-popover-foreground shadow-lg",
  inline: "rounded-lg border bg-card text-card-foreground",
  compact: "rounded-md border bg-popover text-popover-foreground",
  spotlight: "rounded-2xl border bg-popover text-popover-foreground shadow-2xl",
}
const MODAL_POSITION_CLASS: Partial<Record<CommandVariant, string>> = {
  dialog: "top-[12%] max-w-[min(32rem,calc(100%-2rem))]",
  spotlight: "top-[18%] max-w-[min(36rem,calc(100%-2rem))]",
}
const INPUT_ROW_CLASS: Record<CommandVariant, string> = {
  dialog: "h-12 gap-2 px-4",
  inline: "h-10 gap-2 px-3",
  compact: "h-8 gap-2 px-2 pointer-coarse:h-10",
  spotlight: "h-16 gap-3 px-5",
}
const INPUT_TEXT_CLASS: Record<CommandVariant, string> = {
  dialog: "text-base md:text-sm",
  inline: "text-base md:text-sm",
  // Under 16 px iOS zooms the page on focus, so the small size waits for a pointer that cannot trigger it.
  compact: "text-base md:text-[13px]",
  spotlight: "text-xl tracking-tight",
}
const LIST_HEIGHT_CLASS: Record<CommandVariant, string> = {
  dialog: "max-h-80",
  inline: "max-h-64",
  compact: "max-h-56",
  spotlight: "max-h-96",
}

/** The enter and exit values stay unqualified so the media overrides below win on source order. */
const MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "fade-in-0 zoom-in-95 blur-in-sm fade-out-0 zoom-out-95 blur-out-sm",
  "motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]
const PLAIN_MOTION_CLASS = [
  "duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
]

const OVERLAY_CLASS =
  "fixed inset-0 z-50 bg-background/60 backdrop-blur-sm duration-(--duration-base) ease-(--ease-mise) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"

export {
  INPUT_ROW_CLASS,
  INPUT_TEXT_CLASS,
  LIST_HEIGHT_CLASS,
  MATERIALIZE_CLASS,
  MODAL_POSITION_CLASS,
  OVERLAY_CLASS,
  PLAIN_MOTION_CLASS,
  SURFACE_CLASS,
  type CommandEffect,
  type CommandVariant,
}
