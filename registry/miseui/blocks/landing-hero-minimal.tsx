import { cn } from "@/registry/miseui/lib/utils"
import { HeroActions, HeroHeading, type LandingHeroAction, type LandingHeroCopyProps } from "./landing-hero-copy"

const EARLY_ACCESS: LandingHeroAction = { label: "Get early access" }

/** The sample copy is in the future tense: this variant is for a product that cannot be tried yet. */
function LandingHeroMinimal({
  headline = "Calls that end in a plan.",
  headlineQuiet = "We are building it now.",
  description = "It will listen to the call, write down who owns what, and send it to everyone who was there.",
  primaryAction = EARLY_ACCESS,
  secondaryAction = null,
  className,
  ...props
}: LandingHeroCopyProps) {
  return (
    <section data-slot="landing-hero" data-variant="minimal" className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 @2xl:gap-12 @2xl:py-24 @5xl:px-8">
        <HeroHeading headline={headline} quiet={headlineQuiet} className="max-w-4xl text-4xl @2xl:text-5xl @5xl:text-6xl" />
        <div className="flex flex-col gap-6 border-t pt-6 @3xl:flex-row @3xl:items-start @3xl:justify-between @3xl:gap-12">
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <HeroActions primary={primaryAction} secondary={secondaryAction} className="mt-0 shrink-0" />
        </div>
      </div>
    </section>
  )
}

export { LandingHeroMinimal }
