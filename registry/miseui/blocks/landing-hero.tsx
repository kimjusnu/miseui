import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { LandingHeroCentered } from "./landing-hero-centered"
import { DEFAULT_COPY, HeroActions, HeroHeading, type LandingHeroAction, type LandingHeroCopyProps } from "./landing-hero-copy"
import { LandingHeroMinimal } from "./landing-hero-minimal"
import { LandingHeroOverlap } from "./landing-hero-overlap"
import { LandingHeroPreview } from "./landing-hero-parts"

type LandingHeroVariant = "split" | "centered" | "overlap" | "minimal"

interface LandingHeroProps extends LandingHeroCopyProps {
  /** `split` text beside a live preview, `centered` a claim over a wide product plate, `overlap` two fragments beside the text, `minimal` type only. */
  variant?: LandingHeroVariant
  /** Your product, live, built from real components, on `split` and `centered`. Null collapses it to the text alone. */
  preview?: React.ReactNode
  /** Two pieces of your product on `overlap`: the one behind, then the one in front. */
  fragments?: readonly [React.ReactNode, React.ReactNode]
}

function LandingHeroSplit({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  description = DEFAULT_COPY.description,
  primaryAction = DEFAULT_COPY.primaryAction,
  secondaryAction = DEFAULT_COPY.secondaryAction,
  preview = <LandingHeroPreview />,
  className,
  ...props
}: LandingHeroCopyProps & { preview?: React.ReactNode }) {
  const hasPreview = preview !== null
  return (
    <section data-slot="landing-hero" data-variant="split" className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div
        className={cn(
          "mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 @5xl:px-8",
          hasPreview && "@4xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] @5xl:gap-16",
        )}
      >
        <div className="flex min-w-0 flex-col items-start gap-6">
          <HeroHeading headline={headline} quiet={headlineQuiet} className="@md:text-4xl @6xl:text-5xl" />
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <HeroActions primary={primaryAction} secondary={secondaryAction} />
        </div>
        {hasPreview ? <div className="min-w-0">{preview}</div> : null}
      </div>
    </section>
  )
}

function LandingHero({ variant, preview, fragments, ...props }: LandingHeroProps) {
  switch (variant) {
    case "centered":
      return <LandingHeroCentered preview={preview} {...props} />
    case "overlap":
      return <LandingHeroOverlap fragments={fragments} {...props} />
    case "minimal":
      return <LandingHeroMinimal {...props} />
    default:
      return <LandingHeroSplit preview={preview} {...props} />
  }
}

export { LandingHero, LandingHeroPreview, type LandingHeroAction, type LandingHeroProps, type LandingHeroVariant }
