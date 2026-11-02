import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"

interface SectionHeadingProps extends React.ComponentProps<"h2"> {
  /** The statement. */
  lead: string
  /** The second sentence, same size and quieter: hierarchy by tone, not by shouting. */
  quiet?: string
}

export function SectionHeading({ lead, quiet, className, ...props }: SectionHeadingProps) {
  return (
    <h2 className={cn("text-title max-w-2xl text-3xl leading-[1.15] text-balance md:text-4xl", className)} {...props}>
      {lead}
      {quiet ? <span className="text-muted-foreground"> {quiet}</span> : null}
    </h2>
  )
}
