type TagVariant = "soft" | "outline" | "solid" | "dot"
type TagTone = "neutral" | "accent" | "success" | "warning" | "error"

const ROOT_CLASS: Record<TagVariant, string> = {
  soft: "inline-flex h-6 max-w-full min-w-0 items-center rounded-md px-2 text-[13px] font-medium",
  outline: "inline-flex h-6 max-w-full min-w-0 items-center rounded-full border px-3 text-[13px]",
  solid: "inline-flex h-6 max-w-full min-w-0 items-center rounded-sm px-2 text-[13px] font-semibold",
  dot: "inline-flex h-6 max-w-full min-w-0 items-center text-[13px] text-foreground",
}

/** Fixed hues for status, because the accent may itself be amber or red. Only `accent` follows the theme. */
const TONE_CLASS: Record<TagVariant, Record<TagTone, string>> = {
  soft: {
    neutral: "bg-muted text-foreground",
    accent: "bg-mise-soft text-foreground",
    success: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    warning: "bg-amber-400/20 text-amber-800 dark:text-amber-300",
    error: "bg-destructive/10 text-destructive dark:bg-destructive/15",
  },
  outline: {
    neutral: "border-border text-foreground",
    accent: "border-mise text-foreground",
    success: "border-emerald-500/60 text-emerald-800 dark:text-emerald-300",
    warning: "border-amber-500/70 text-amber-800 dark:text-amber-300",
    error: "border-destructive/60 text-destructive",
  },
  solid: {
    neutral: "bg-foreground text-background",
    accent: "bg-mise text-mise-foreground",
    success: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
    warning: "bg-amber-400 text-amber-950",
    // The dark theme lightens the error colour past what white text can sit on.
    error: "bg-destructive text-white dark:text-background",
  },
  dot: { neutral: "", accent: "", success: "", warning: "", error: "" },
}

const DOT_TONE_CLASS: Record<TagTone, string> = {
  neutral: "bg-muted-foreground",
  accent: "bg-mise",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-destructive",
}

const BODY_CLASS = "inline-flex min-w-0 items-center gap-2"

/** The tag stays 24 px on a phone; this invisible square is what reaches 40 px, centred on the control. */
const HIT_AREA_CLASS =
  "relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-10 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2"

export { BODY_CLASS, DOT_TONE_CLASS, HIT_AREA_CLASS, ROOT_CLASS, TONE_CLASS, type TagTone, type TagVariant }
