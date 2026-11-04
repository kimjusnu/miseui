import { cn } from "@/registry/miseui/lib/utils"
import { CtaActions, CtaButton, CtaHeading, CtaNote, DEFAULT_COPY, ROOT_CLASS, type CtaAction, type CtaSectionCopyProps } from "./cta-section-parts"
import { CtaSectionSplit, type CtaSectionSplitProps } from "./cta-section-split"

type CtaSectionVariant = "plate" | "split" | "banner"

interface CtaSectionProps extends CtaSectionSplitProps {
  /** `plate` the last thing on a page, `split` beside a piece of the product, `banner` a slim row inside a long page. Anything else is `plate`. */
  variant?: CtaSectionVariant
}

function CtaSectionPlate({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  description = DEFAULT_COPY.description,
  primaryAction = DEFAULT_COPY.primaryAction,
  secondaryAction = DEFAULT_COPY.secondaryAction,
  note = DEFAULT_COPY.note,
  className,
  ...props
}: CtaSectionCopyProps) {
  return (
    <section data-slot="cta-section" data-variant="plate" className={cn(ROOT_CLASS, className)} {...props}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 @2xl:px-8 @2xl:py-16">
        <div data-slot="cta-section-plate" className="flex flex-col items-start gap-6 rounded-3xl border bg-background px-6 py-12 dark:bg-card @2xl:items-center @2xl:px-12 @2xl:py-20 @2xl:text-center">
          <CtaHeading headline={headline} quiet={headlineQuiet} className="max-w-2xl @2xl:text-4xl" />
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <CtaActions primary={primaryAction} secondary={secondaryAction} className="@2xl:justify-center" />
          <CtaNote note={note} />
        </div>
      </div>
    </section>
  )
}

/** One thing to do and no description: a soft row people can pass, unlike the plate, which asks them to stop. */
function CtaSectionBanner({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  primaryAction = DEFAULT_COPY.primaryAction,
  className,
  ...props
}: Omit<CtaSectionCopyProps, "description" | "secondaryAction" | "note">) {
  return (
    <section data-slot="cta-section" data-variant="banner" className={cn(ROOT_CLASS, className)} {...props}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 @2xl:px-8">
        {/* Stacks instead of truncating: a clipped sentence beside a button says nothing. */}
        <div data-slot="cta-section-banner" className="flex flex-col items-start gap-3 rounded-2xl bg-mise-soft p-4 dark:border dark:bg-card @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-6 @2xl:py-3 @2xl:pr-3 @2xl:pl-6">
          <h2 className="min-w-0 text-[15px] leading-snug font-medium text-pretty">
            {headline} <span className="font-normal text-foreground/70">{headlineQuiet}</span>
          </h2>
          <CtaButton action={primaryAction} variant="default" className="h-10 px-4 text-sm" />
        </div>
      </div>
    </section>
  )
}

function CtaSection({ variant, fragment, description, secondaryAction, note, ...props }: CtaSectionProps) {
  switch (variant) {
    case "split":
      return <CtaSectionSplit fragment={fragment} description={description} secondaryAction={secondaryAction} note={note} {...props} />
    case "banner":
      return <CtaSectionBanner {...props} />
    default:
      return <CtaSectionPlate description={description} secondaryAction={secondaryAction} note={note} {...props} />
  }
}

export { CtaSection, type CtaAction, type CtaSectionProps, type CtaSectionVariant }
