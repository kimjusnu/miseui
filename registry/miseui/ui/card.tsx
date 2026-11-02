import type * as React from "react"
import { CARD_EFFECT_ROOTS, type CardEffect } from "@/registry/miseui/ui/card-effects"
import { cn } from "@/registry/miseui/lib/utils"

/** One horizontal inset for every slot, so edges line up and the region reads as a unit. */
const INSET_CLASS = "px-6"

const CARD_CLASS = "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-xs"

type CardProps = React.ComponentProps<"div"> & {
  /** A living treatment on the surface. Undefined is the plain card. */
  effect?: CardEffect
}

function Card({ className, effect, ...props }: CardProps) {
  if (!effect) return <div data-slot="card" className={cn(CARD_CLASS, className)} {...props} />
  const Root = CARD_EFFECT_ROOTS[effect]
  return <Root data-slot="card" data-effect={effect} className={cn(CARD_CLASS, className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1.5",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        INSET_CLASS,
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(INSET_CLASS, className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2", INSET_CLASS, className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, type CardProps, type CardEffect }
