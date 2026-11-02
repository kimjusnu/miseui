import type * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button, type ButtonProps } from "@/registry/miseui/ui/button"
import { LandingHeroPreview } from "./landing-hero-parts"

interface LandingHeroAction {
  label: string
  /** Renders a real link, so it can be opened in a new tab and read by crawlers. */
  href?: string
  onClick?: () => void
}

interface LandingHeroProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** With headlineQuiet, two lines at most: around 50 characters. A third line pushes the buttons down and the message apart. */
  headline?: string
  /** Continues the headline in the same size, one tone quieter. */
  headlineQuiet?: string
  /** One sentence, under 20 words. */
  description?: string
  primaryAction?: LandingHeroAction
  secondaryAction?: LandingHeroAction
  /** Your product, live, built from real components. Null collapses the hero to one column. */
  preview?: React.ReactNode
}

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

const DEFAULT_PRIMARY: LandingHeroAction = { label: "Try it on your next call" }
const DEFAULT_SECONDARY: LandingHeroAction = { label: "See a sample summary" }

function LandingHero({
  headline = "Calls that end in a plan.",
  headlineQuiet = "Written before you leave.",
  description = "It listens to the call, writes down who owns what, and sends it to everyone who was there.",
  primaryAction = DEFAULT_PRIMARY,
  secondaryAction = DEFAULT_SECONDARY,
  preview = <LandingHeroPreview />,
  className,
  ...props
}: LandingHeroProps) {
  const hasPreview = preview !== null
  return (
    <section data-slot="landing-hero" className={cn("@container w-full bg-muted", className)} {...props}>
      <div
        className={cn(
          "mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 @5xl:px-8",
          hasPreview && "@4xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] @5xl:gap-16",
        )}
      >
        <div className="flex min-w-0 flex-col items-start gap-6">
          <h1 className="text-display text-3xl text-balance @md:text-4xl @6xl:text-5xl">
            {headline} {headlineQuiet ? <span className="text-muted-foreground">{headlineQuiet}</span> : null}
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <HeroAction action={primaryAction} variant="default">
              <ArrowRight />
            </HeroAction>
            <HeroAction action={secondaryAction} variant="ghost" />
          </div>
        </div>
        {hasPreview ? <div className="min-w-0">{preview}</div> : null}
      </div>
    </section>
  )
}

export { LandingHero, LandingHeroPreview, type LandingHeroAction, type LandingHeroProps }
