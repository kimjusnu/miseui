import type * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
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
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "default"}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants, type BadgeProps }
