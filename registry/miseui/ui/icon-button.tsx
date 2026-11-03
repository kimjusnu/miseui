import type * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/miseui/ui/tooltip"
import { cn } from "@/registry/miseui/lib/utils"

type IconButtonVariant = "ghost" | "outline" | "solid" | "soft"
type IconButtonSize = "sm" | "md" | "lg"
type IconButtonEffect = "press"

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  ghost: "rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground active:bg-foreground/10",
  outline: "rounded-md border bg-background text-foreground shadow-xs hover:bg-accent active:bg-accent/70",
  solid: "rounded-full bg-mise text-mise-foreground shadow-xs hover:bg-mise/90 active:bg-mise/80",
  soft: "rounded-lg bg-foreground/[0.06] text-foreground hover:bg-foreground/10 active:bg-foreground/[0.14]",
}

/** The glyph stays the same on a phone; only the invisible hit area below grows. */
const SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: "size-8 [&_svg]:size-4",
  md: "size-9 [&_svg]:size-4",
  lg: "size-10 [&_svg]:size-5",
}

const BASE_CLASS = cn(
  "relative inline-flex shrink-0 items-center justify-center outline-none select-none",
  "transition-[color,background-color,border-color,box-shadow,scale] duration-(--duration-base) ease-(--ease-mise-out)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-progress",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-10 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
)

/** Down lands on the first frame with no transition; only the release takes time, so a fast tap still feels the press. */
const PRESS_CLASS = "active:scale-[0.97] active:duration-0 motion-reduce:active:scale-100"
const DEEP_PRESS_CLASS = "active:scale-[0.88] active:duration-0 motion-reduce:active:scale-100"

function PendingGlyph() {
  return (
    <svg
      aria-hidden="true"
      data-slot="icon-button-spinner"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin [animation-duration:900ms] motion-reduce:animate-pulse motion-reduce:[animation-duration:2400ms]"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="14 57" />
    </svg>
  )
}

/** `aria-label` is replaced by the required `label`, so a nameless icon button does not compile. */
type IconButtonProps = Omit<React.ComponentProps<"button">, "aria-label" | "aria-labelledby" | "children"> & {
  /** The accessible name. A glyph alone tells a screen reader nothing. */
  label: string
  /** The glyph, usually one lucide icon. */
  children: React.ReactNode
  /** `ghost` no surface, `outline` a hairline, `solid` the one accent circle, `soft` a quiet fill. */
  variant?: IconButtonVariant
  /** 32, 36 or 40 px. On touch the hit area is 40 px whichever you pick. */
  size?: IconButtonSize
  /** `true` shows the label in a tooltip; anything else shows that content. */
  tooltip?: boolean | React.ReactNode
  /** Swaps the glyph for a spinner and ignores clicks, while keeping focus on the button. */
  pending?: boolean
  /** The name while pending, such as "Saving". Falls back to `label`. */
  pendingLabel?: string
  /** `press` dips the whole button further, for controls hit many times in a row. */
  effect?: IconButtonEffect
}

function IconButton({
  label,
  children,
  variant = "ghost",
  size = "md",
  tooltip,
  pending = false,
  pendingLabel,
  effect,
  type = "button",
  className,
  onClick,
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      data-slot="icon-button"
      data-variant={variant}
      data-size={size}
      data-effect={effect}
      data-pending={pending ? "true" : undefined}
      aria-label={pending && pendingLabel ? pendingLabel : label}
      aria-busy={pending ? true : undefined}
      // Not `disabled`: that would throw focus away the moment a keyboard user pressed the button.
      aria-disabled={pending ? true : undefined}
      onClick={pending ? (event) => event.preventDefault() : onClick}
      className={cn(BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], effect === "press" ? DEEP_PRESS_CLASS : PRESS_CLASS, className)}
      {...props}
    >
      {pending ? <PendingGlyph /> : children}
    </button>
  )
  if (!tooltip) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{tooltip === true ? label : tooltip}</TooltipContent>
    </Tooltip>
  )
}

export { IconButton, type IconButtonProps, type IconButtonVariant, type IconButtonSize, type IconButtonEffect }
