import type * as React from "react"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import { cn } from "@/registry/miseui/lib/utils"

/** 36 px: the same height as Button, and comfortably above the 24 px minimum target. */
const INPUT_HEIGHT_CLASS = "h-9"

type InputEffect = "glow" | "ai"

type InputProps = React.ComponentProps<"input"> & {
  /** A living treatment on the field. Undefined is the plain input. */
  effect?: InputEffect
  /** With effect="ai": the placeholder shimmers while the model prepares a suggestion. */
  pending?: boolean
}

/** Box-shadow is in the base transition list, so ring and halo grow from nothing on focus. An error must not glow warm. */
const GLOW_CLASS = cn(
  "duration-(--duration-base) ease-(--ease-mise-out) motion-reduce:transition-none",
  "focus-visible:border-mise focus-visible:ring-4 focus-visible:ring-mise/35",
  "focus-visible:shadow-[0_0_28px_4px_color-mix(in_oklab,var(--mise)_45%,transparent)]",
  "[@media(prefers-reduced-transparency:reduce)]:focus-visible:shadow-none",
  "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/30 aria-invalid:focus-visible:shadow-none",
)
/** The native placeholder stays for assistive tech and for :placeholder-shown, which hides the overlay as soon as someone types. */
const PENDING_FIELD_CLASS = "border-mise/60 placeholder:text-transparent"
/** Shimmer's bright band in the accent: mise is the colour of AI activity. Re-declared in this scope only. */
const PENDING_BAND_STYLE = { "--foreground": "var(--mise)" } as React.CSSProperties

function Input({ className, type, effect, pending = false, ...props }: InputProps) {
  const isAi = effect === "ai"
  const shimmering = isAi && pending && Boolean(props.placeholder)
  const field = (
    <input
      type={type}
      data-slot="input"
      data-effect={effect}
      aria-busy={isAi && pending ? true : undefined}
      className={cn(
        INPUT_HEIGHT_CLASS,
        "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "transition-[color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
        "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        effect === "glow" && GLOW_CLASS,
        isAi && "peer",
        shimmering && PENDING_FIELD_CLASS,
        className,
      )}
      {...props}
    />
  )
  if (!isAi) return field
  return (
    // Stays mounted across `pending` so the field never remounts and keeps focus and typed text.
    <div data-slot="input-frame" className="relative w-full min-w-0">
      {field}
      {shimmering ? (
        <span
          aria-hidden="true"
          data-testid="input-shimmer"
          className="pointer-events-none absolute inset-y-0 right-[13px] left-[13px] hidden items-center overflow-hidden text-base whitespace-nowrap peer-placeholder-shown:flex md:text-sm"
        >
          <ShimmerText style={PENDING_BAND_STYLE}>{props.placeholder ?? ""}</ShimmerText>
        </span>
      ) : null}
    </div>
  )
}

export { Input, type InputProps, type InputEffect }
