import { Check, CircleAlert, Loader2, X } from "lucide-react"
import type { ToastRecord, ToastType } from "@/registry/miseui/ui/toast-store"
import { cn } from "@/registry/miseui/lib/utils"

export type ToastVariant = "stack" | "list" | "pill" | "bar"

export const SURFACE_CLASS: Record<ToastVariant, string> = {
  stack: "rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
  list: "rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
  pill: "rounded-full bg-foreground text-background shadow-lg",
  bar: "w-full",
}

export const BAR_TONE_CLASS: Record<ToastType, string> = {
  neutral: "bg-foreground text-background",
  loading: "bg-foreground text-background",
  success: "bg-mise text-mise-foreground",
  error: "bg-destructive text-white",
}

export const ROW_CLASS: Record<ToastVariant, string> = {
  stack: "flex items-start gap-3 p-3",
  list: "flex items-start gap-3 p-3",
  pill: "flex min-h-10 items-center gap-2 py-1 pr-1 pl-4",
  bar: "mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-2",
}

const FOCUS_CLASS =
  "outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px] focus-visible:ring-ring/50"

/** `pill` and `bar` carry their own colour, so their controls inherit it instead of sitting on a popover. */
const isOnSurface = (variant: ToastVariant) => variant === "stack" || variant === "list"

function TypeIcon({ type, variant }: { type: ToastType; variant: ToastVariant }) {
  if (type === "neutral") return null
  if (type === "loading") {
    return <Loader2 aria-hidden="true" className="size-5 shrink-0 animate-spin motion-reduce:animate-none" />
  }
  const Icon = type === "success" ? Check : CircleAlert
  const tone = type === "success" ? "bg-mise text-mise-foreground" : "bg-destructive text-white"
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full", isOnSurface(variant) && tone)}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

function ActionButton({ record, variant, onDismiss }: ToastRowProps) {
  if (!record.action) return null
  const { label, onClick } = record.action
  return (
    <button
      type="button"
      onClick={() => {
        onClick()
        onDismiss(record.id)
      }}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-md px-3 text-[13px] font-medium whitespace-nowrap pointer-fine:h-8",
        FOCUS_CLASS,
        isOnSurface(variant) ? "border border-border hover:bg-accent" : "underline underline-offset-2 hover:opacity-80",
      )}
    >
      {label}
    </button>
  )
}

interface ToastRowProps {
  record: ToastRecord
  variant: ToastVariant
  onDismiss: (id: string) => void
}

export function ToastRowContent({ record, variant, onDismiss }: ToastRowProps) {
  const descriptionTone = isOnSurface(variant) ? "text-muted-foreground" : "opacity-80"
  return (
    <>
      <TypeIcon type={record.type} variant={variant} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", variant === "pill" && "truncate")}>{record.title}</p>
        {record.description && variant !== "pill" && (
          <p className={cn("text-[13px]/5", descriptionTone, variant !== "bar" && "mt-1")}>{record.description}</p>
        )}
      </div>
      <ActionButton record={record} variant={variant} onDismiss={onDismiss} />
      <button
        type="button"
        aria-label={`Dismiss: ${record.title}`}
        onClick={() => onDismiss(record.id)}
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-md pointer-fine:size-7",
          FOCUS_CLASS,
          isOnSurface(variant) ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground" : "hover:opacity-70",
          variant === "pill" && "rounded-full",
        )}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </>
  )
}
