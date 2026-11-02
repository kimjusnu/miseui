import type * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"

type SeparatorVariant = "line" | "dashed" | "label" | "gradient"
type SeparatorAlign = "start" | "center" | "end"
type SeparatorOrientation = "horizontal" | "vertical"

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  /** `line` a hairline, `dashed` a lesser break, `label` names what follows, `gradient` fades out at both ends. */
  variant?: SeparatorVariant
  /** Where the text sits in `label`. */
  align?: SeparatorAlign
}

/** Vertical rules stretch with a flex parent; the minimum keeps them visible when there is none. */
const RULE_CLASS: Record<Exclude<SeparatorVariant, "label">, Record<SeparatorOrientation, string>> = {
  line: {
    horizontal: "h-px w-full bg-border",
    vertical: "min-h-4 w-px self-stretch bg-border",
  },
  dashed: {
    horizontal: "h-0 w-full border-t border-dashed",
    vertical: "min-h-4 w-0 self-stretch border-l border-dashed",
  },
  gradient: {
    horizontal: "h-px w-full bg-linear-to-r from-transparent via-border to-transparent",
    vertical: "min-h-4 w-px self-stretch bg-linear-to-b from-transparent via-border to-transparent",
  },
}

const LABEL_CLASS: Record<SeparatorOrientation, string> = {
  horizontal: "flex w-full items-center gap-3",
  vertical: "flex min-h-16 flex-col items-center gap-2 self-stretch",
}

const LABEL_RULE_CLASS: Record<SeparatorOrientation, string> = {
  horizontal: "h-px flex-1 bg-border",
  vertical: "w-px flex-1 bg-border",
}

function Separator({
  variant = "line",
  align = "center",
  orientation = "horizontal",
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: SeparatorProps) {
  const shared = { "data-slot": "separator", "data-variant": variant, orientation, ...props }
  if (variant !== "label") {
    return (
      <SeparatorPrimitive.Root
        {...shared}
        aria-label={ariaLabel}
        className={cn("shrink-0", RULE_CLASS[variant][orientation], className)}
      />
    )
  }
  // A separator's children are presentational in ARIA, so the text only reaches a screen reader as its name.
  const name = ariaLabel ?? (typeof children === "string" ? children : undefined)
  return (
    <SeparatorPrimitive.Root
      {...shared}
      aria-label={name}
      className={cn("text-[13px] text-muted-foreground", LABEL_CLASS[orientation], className)}
    >
      {align === "start" ? null : <span data-part="rule" className={LABEL_RULE_CLASS[orientation]} />}
      <span data-part="label" className="shrink-0">
        {children}
      </span>
      {align === "end" ? null : <span data-part="rule" className={LABEL_RULE_CLASS[orientation]} />}
    </SeparatorPrimitive.Root>
  )
}

export { Separator, type SeparatorProps, type SeparatorVariant, type SeparatorAlign }
