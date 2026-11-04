import type * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button, type ButtonProps } from "@/registry/miseui/ui/button"

interface LandingHeroAction {
  label: string
  /** Renders a real link, so it can be opened in a new tab and read by crawlers. */
  href?: string
  onClick?: () => void
}

interface LandingHeroCopyProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** With headlineQuiet, two lines at most: around 50 characters. A third line pushes the buttons down and the message apart. */
  headline?: string
  /** Continues the headline in the same size, one tone quieter. */
  headlineQuiet?: string
  /** One sentence, under 20 words. */
  description?: string
  primaryAction?: LandingHeroAction
  /** Null leaves one button, for a page with a single thing to do. */
  secondaryAction?: LandingHeroAction | null
}

const DEFAULT_COPY = {
  headline: "Calls that end in a plan.",
  headlineQuiet: "Written before you leave.",
  description: "It listens to the call, writes down who owns what, and sends it to everyone who was there.",
  primaryAction: { label: "Try it on your next call" },
  secondaryAction: { label: "See a sample summary" },
} as const

function HeroAction({ action, variant, children }: { action: LandingHeroAction; variant: ButtonProps["variant"]; children?: React.ReactNode }) {
  if (action.href) {
    return (
      <Button asChild size="lg" variant={variant}>
        <a href={action.href} onClick={action.onClick}>
          {action.label}
          {children}
        </a>
      </Button>
    )
  }
  return (
    <Button size="lg" variant={variant} onClick={action.onClick}>
      {action.label}
      {children}
    </Button>
  )
}

function HeroActions({ primary, secondary, className }: { primary: LandingHeroAction; secondary: LandingHeroAction | null; className?: string }) {
  return (
    <div className={cn("mt-2 flex flex-wrap gap-3", className)}>
      <HeroAction action={primary} variant="default">
        <ArrowRight />
      </HeroAction>
      {secondary ? <HeroAction action={secondary} variant="ghost" /> : null}
    </div>
  )
}

function HeroHeading({ headline, quiet, className }: { headline: string; quiet?: string; className?: string }) {
  return (
    <h1 className={cn("text-display text-3xl text-balance", className)}>
      {headline} {quiet ? <span className="text-muted-foreground">{quiet}</span> : null}
    </h1>
  )
}

export { DEFAULT_COPY, HeroActions, HeroHeading, type LandingHeroAction, type LandingHeroCopyProps }
