type CascaderVariant = "plain" | "inline" | "compact" | "multiple"
type CascaderEffect = "slide"
type CascaderLayout = "auto" | "columns" | "steps"

const TRIGGER_CLASS: Record<Exclude<CascaderVariant, "inline">, string> = {
  plain: "h-9 px-3 text-sm pointer-coarse:h-10",
  compact: "h-8 px-2 text-[13px] pointer-coarse:h-10",
  multiple: "h-9 px-3 text-sm pointer-coarse:h-10",
}

const TRIGGER_BASE_CLASS = [
  "flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent text-left shadow-xs",
  "transition-[color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50",
]

/** Fixed widths, so a column keeps its place while the one beside it opens. They share nothing: the panel scrolls sideways if it must. */
const COLUMN_WIDTH_CLASS: Record<CascaderVariant, string> = {
  plain: "w-40",
  inline: "w-40",
  compact: "w-32",
  multiple: "w-44",
}

const ROW_BASE_CLASS = [
  "relative flex cursor-default items-center gap-2 rounded-sm outline-none select-none",
  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise)",
  "hover:bg-accent/60 focus-visible:ring-[2px] focus-visible:ring-inset focus-visible:ring-ring/60 data-[active=true]:bg-accent",
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
]

const ROW_CLASS: Record<CascaderVariant, string> = {
  plain: "px-2 py-1.5 text-sm pointer-coarse:py-2.5",
  inline: "px-2 py-1.5 text-sm pointer-coarse:py-2.5",
  compact: "px-2 py-1 text-[13px] pointer-coarse:py-2.5",
  multiple: "px-2 py-1.5 text-sm pointer-coarse:py-2.5",
}

/** Tall enough to show that a list scrolls, short enough to stay on a small laptop screen. */
const LIST_HEIGHT_CLASS = "max-h-72 overflow-y-auto"

const INLINE_FRAME_CLASS = "grid min-w-0 grid-cols-[minmax(0,1fr)] rounded-md border bg-background"

export {
  COLUMN_WIDTH_CLASS,
  INLINE_FRAME_CLASS,
  LIST_HEIGHT_CLASS,
  ROW_BASE_CLASS,
  ROW_CLASS,
  TRIGGER_BASE_CLASS,
  TRIGGER_CLASS,
  type CascaderEffect,
  type CascaderLayout,
  type CascaderVariant,
}
