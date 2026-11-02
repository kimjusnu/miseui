import type * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { BeamFrame, GlowFrame, GooeyCount, LiveDot, type BadgeEffect } from "@/registry/miseui/ui/badge-effects"
import { cn } from "@/registry/miseui/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
    "transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white focus-visible:ring-destructive/30",
        outline: "text-foreground",
        mise: "border-transparent bg-mise text-mise-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    /** A living treatment on top of the variant. `count` needs text or number children and no asChild; otherwise it renders plain. */
    effect?: BadgeEffect
  }

/**
 * Slottable lets the dot join a child element under asChild, where Slot expects exactly one child.
 * An array, not a fragment: Slot looks through arrays, but would pour its props onto a fragment.
 */
function badgeContent(effect: BadgeEffect | undefined, asChild: boolean, variant: BadgeProps["variant"], children: React.ReactNode) {
  if (effect === "live") {
    return [<LiveDot key="dot" variant={variant} />, <Slot.Slottable key="label">{children}</Slot.Slottable>]
  }
  if (effect === "count" && !asChild && (typeof children === "number" || typeof children === "string")) {
    return <GooeyCount value={String(children)} />
  }
  return children
}

function Badge({ className, variant, asChild = false, effect, children, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"
  const badge = (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "default"}
      data-effect={effect}
      className={cn(badgeVariants({ variant }), effect === "glow" && "border-mise/60", className)}
      {...props}
    >
      {badgeContent(effect, asChild, variant, children)}
    </Comp>
  )
  if (effect === "glow") return <GlowFrame className={className}>{badge}</GlowFrame>
  if (effect === "beam") return <BeamFrame variant={variant} className={className}>{badge}</BeamFrame>
  return badge
}

export { Badge, badgeVariants, type BadgeProps, type BadgeEffect }
