import type * as React from "react"
import { Slot } from "radix-ui"
import { Check, Info, TriangleAlert, X } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"

type AlertVariant = "soft" | "outline" | "banner" | "side"
type AlertTone = "neutral" | "success" | "warning" | "error"

const ROOT_CLASS: Record<AlertVariant, string> = {
  soft: "flex items-start gap-3 rounded-lg p-4",
  outline: "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border bg-background p-4",
  banner: "flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2",
  side: "relative flex items-start gap-3 rounded-md bg-card py-3 pr-3 pl-6",
}

const TONE_CLASS: Record<AlertVariant, Record<AlertTone, string>> = {
  soft: {
    neutral: "bg-muted",
    // Fixed hues, not the accent: with an amber accent a success in `mise` would read as a warning.
    success: "bg-emerald-500/10",
    warning: "bg-amber-400/15",
    error: "bg-destructive/10 dark:bg-destructive/15",
  },
  outline: {
    neutral: "",
    success: "border-emerald-500/50",
    warning: "border-amber-500/60",
    error: "border-destructive/50",
  },
  banner: {
    neutral: "bg-secondary text-secondary-foreground",
    success: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
    warning: "bg-amber-400 text-amber-950",
    // The dark theme lightens the error colour past what white text can sit on.
    error: "bg-destructive text-white dark:text-background",
  },
  side: { neutral: "", success: "", warning: "", error: "" },
}

const CHIP_TONE_CLASS: Record<AlertTone, string> = {
  neutral: "bg-foreground/10 text-foreground",
  success: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
  warning: "bg-amber-400 text-amber-950",
  error: "bg-destructive text-white dark:text-background",
}

const RAIL_TONE_CLASS: Record<AlertTone, string> = {
  neutral: "bg-foreground/20",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  error: "bg-destructive",
}

/** CircleAlert would draw a circle inside the chip, so the error glyph is only its exclamation mark. */
function ExclamationMark(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <path d="M12 6v8" />
      <path d="M12 18h.01" />
    </svg>
  )
}

const TONE_GLYPH: Record<AlertTone, React.ComponentType<{ className?: string }>> = {
  neutral: Info,
  success: Check,
  warning: TriangleAlert,
  error: ExclamationMark,
}

function ToneChip({ tone, size }: { tone: AlertTone; size: "sm" | "lg" }) {
  const Glyph = TONE_GLYPH[tone]
  return (
    <span
      aria-hidden="true"
      data-part="chip"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "size-5" : "size-8",
        CHIP_TONE_CLASS[tone],
      )}
    >
      <Glyph className={size === "sm" ? "size-3" : "size-4"} />
    </span>
  )
}

function ToneGlyph({ tone }: { tone: AlertTone }) {
  const Glyph = tone === "error" ? TriangleAlert : TONE_GLYPH[tone]
  return <Glyph aria-hidden="true" data-part="glyph" className="size-4 shrink-0" />
}

function ToneRail({ tone }: { tone: AlertTone }) {
  return (
    <span
      aria-hidden="true"
      data-part="rail"
      className={cn("absolute inset-y-2 left-2 w-1 rounded-full", RAIL_TONE_CLASS[tone])}
    />
  )
}

/** Pinned on the layouts that wrap, or a narrow screen would drop it to the next row, away from the corner. */
const DISMISS_PLACEMENT_CLASS: Record<AlertVariant, string> = {
  soft: "-m-1",
  outline: "absolute top-2 right-2",
  banner: "absolute top-0.5 right-2 pointer-coarse:top-0",
  side: "-m-1",
}

/** Keeps the text clear of a pinned close button. */
const DISMISS_ROOM_CLASS: Record<AlertVariant, string> = {
  soft: "",
  outline: "relative pr-12",
  banner: "relative pr-12",
  side: "",
}

interface DismissButtonProps {
  label: string
  variant: AlertVariant
  onClick: () => void
}

function DismissButton({ label, variant, onClick }: DismissButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-slot="alert-dismiss"
      onClick={onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-sm outline-none pointer-coarse:size-10",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px]",
        DISMISS_PLACEMENT_CLASS[variant],
        variant === "banner"
          ? "text-current hover:bg-current/10 focus-visible:ring-current/50"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/50",
      )}
    >
      <X aria-hidden="true" className="size-4" />
    </button>
  )
}

type AlertActionProps = React.ComponentProps<"button"> & {
  /** Renders your own link or router link instead of a button. */
  asChild?: boolean
}

/** A text action that takes its colour from the alert, so it holds up on every surface including the solid banner. */
function AlertAction({ asChild = false, className, ...props }: AlertActionProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="alert-action"
      type={asChild ? undefined : "button"}
      className={cn(
        "inline-flex h-8 items-center rounded-sm text-sm font-medium underline decoration-current/40 underline-offset-4 outline-none pointer-coarse:h-10",
        "transition-[text-decoration-color] duration-(--duration-fast) ease-(--ease-mise) hover:decoration-current",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export {
  AlertAction,
  DismissButton,
  DISMISS_ROOM_CLASS,
  ROOT_CLASS,
  ToneChip,
  ToneGlyph,
  ToneRail,
  TONE_CLASS,
  type AlertActionProps,
  type AlertTone,
  type AlertVariant,
}
