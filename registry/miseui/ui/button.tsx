import type * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ButtonEffectFrame,
  EFFECT_SURFACE_CLASS,
  shimmerLabel,
  type ButtonEffect,
} from "@/registry/miseui/ui/button-effects"
import { cn } from "@/registry/miseui/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "transition-[color,background-color,border-color,box-shadow,scale] duration-(--duration-fast) ease-(--ease-mise)",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] active:duration-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        mise: "bg-mise text-mise-foreground shadow-xs hover:bg-mise/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-full px-6 text-[15px] has-[>svg]:px-5",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** A living treatment on top of the variant. Undefined is the plain button. */
    effect?: ButtonEffect
  }

function Button({ className, variant, size, asChild = false, effect, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  const isShimmer = effect === "shimmer"
  const button = (
    <Comp
      data-slot="button"
      data-variant={variant ?? "default"}
      data-effect={effect}
      aria-busy={isShimmer ? true : undefined}
      className={cn(buttonVariants({ variant, size }), effect && EFFECT_SURFACE_CLASS[effect], className)}
      {...props}
    >
      {isShimmer ? shimmerLabel(children, asChild, variant) : children}
    </Comp>
  )
  if (!effect || effect === "shimmer") return button
  return (
    <ButtonEffectFrame
      effect={effect}
      variant={variant}
      size={size}
      className={className}
      disabled={Boolean(props.disabled)}
    >
      {button}
    </ButtonEffectFrame>
  )
}

export { Button, buttonVariants, type ButtonProps, type ButtonEffect }
