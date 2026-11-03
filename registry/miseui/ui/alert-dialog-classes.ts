import { cn } from "@/registry/miseui/lib/utils"

type AlertDialogVariant = "plain" | "destructive" | "typed" | "compact"
type AlertDialogEffect = "materialize"
type AlertDialogTone = "neutral" | "destructive"

/**
 * Below sm the surface is a sheet on the bottom edge, where a thumb can reach the answer. It has no drag handle:
 * this question has to be answered, so it must not be swipeable away.
 */
const SHELL_CLASS = cn(
  "fixed inset-x-0 bottom-0 z-50 grid max-h-[85dvh] overflow-y-auto rounded-t-xl border-t bg-background shadow-lg outline-none",
  "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border",
)

const VARIANT_SHELL_CLASS: Record<AlertDialogVariant, string> = {
  plain: "gap-4 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-md sm:pb-6",
  destructive: "gap-4 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-md sm:pb-6",
  typed: "gap-4 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-md sm:pb-6",
  compact: "pb-[env(safe-area-inset-bottom)] sm:max-w-xs sm:pb-0",
}

const PLAIN_MOTION_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=closed]:animate-out fade-in-0 fade-out-0",
  "max-sm:slide-in-from-bottom max-sm:slide-out-to-bottom sm:zoom-in-95 sm:zoom-out-95",
  "max-sm:motion-reduce:slide-in-from-bottom-0 max-sm:motion-reduce:slide-out-to-bottom-0 motion-reduce:zoom-in-100 motion-reduce:zoom-out-100",
]

/** Radix exposes no origin for a dialog, since it has no anchor. The enter and exit values stay unqualified so the media overrides win on source order. */
const MATERIALIZE_CLASS = [
  "duration-(--duration-slow) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-(--duration-base)",
  "fade-in-0 fade-out-0 blur-in-md blur-out-md",
  "max-sm:slide-in-from-bottom max-sm:slide-out-to-bottom sm:zoom-in-90 sm:zoom-out-90",
  "max-sm:motion-reduce:slide-in-from-bottom-0 max-sm:motion-reduce:slide-out-to-bottom-0 motion-reduce:zoom-in-100 motion-reduce:zoom-out-100",
  "motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]

const OVERLAY_CLASS = cn(
  "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
  "duration-(--duration-base) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
)

const HEADER_CLASS: Record<AlertDialogVariant, string> = {
  plain: "grid gap-2",
  destructive: "flex items-start gap-4",
  typed: "grid gap-2",
  compact: "grid gap-1 p-6 text-center",
}

const FOOTER_CLASS: Record<AlertDialogVariant, string> = {
  plain: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
  destructive: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
  typed: "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
  compact: "grid grid-cols-2 divide-x border-t",
}

const BUTTON_FIT_CLASS = "max-sm:h-10 max-sm:w-full pointer-coarse:h-10"

const COMPACT_BUTTON_CLASS = cn(
  "h-12 w-full text-[15px] outline-none select-none",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent active:bg-accent/70 active:duration-0",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
  "disabled:pointer-events-none disabled:opacity-50",
)

const COMPACT_ACTION_TONE: Record<AlertDialogTone, string> = {
  neutral: "font-semibold text-foreground",
  destructive: "font-semibold text-destructive",
}

/** Only the outer spaces go: a pasted word often brings them along. Case stays strict, as this is deliberate friction. */
function matchesConfirmation(typed: string, word: string) {
  return typed.trim() === word.trim() && word.trim() !== ""
}

export {
  BUTTON_FIT_CLASS,
  COMPACT_ACTION_TONE,
  COMPACT_BUTTON_CLASS,
  FOOTER_CLASS,
  HEADER_CLASS,
  MATERIALIZE_CLASS,
  OVERLAY_CLASS,
  PLAIN_MOTION_CLASS,
  SHELL_CLASS,
  VARIANT_SHELL_CLASS,
  matchesConfirmation,
  type AlertDialogEffect,
  type AlertDialogTone,
  type AlertDialogVariant,
}
