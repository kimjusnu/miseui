import { cn } from "@/registry/miseui/lib/utils"
import { SectionTitle, type BentoFeature, type FeatureBentoSectionProps } from "./feature-bento-grid"
import { PanelPlate, ROW_FEATURES } from "./feature-bento-panels"

function FeatureRow({ feature, flipped }: { feature: BentoFeature; flipped: boolean }) {
  return (
    <li data-slot="feature-bento-row" className="grid grid-cols-[minmax(0,1fr)] items-center gap-6 @3xl:grid-cols-2 @3xl:gap-12">
      {/* Inline, so one tone-split sentence reads as a single thought while the heading stays a real heading. */}
      <div data-testid="feature-bento-copy" className={cn("text-display min-w-0 max-w-md text-2xl leading-[1.12]! text-pretty @4xl:text-3xl", !feature.visual && "@3xl:col-span-2")}>
        <h3 className="inline">{feature.title}</h3> <p className="inline text-muted-foreground">{feature.description}</p>
      </div>
      {feature.visual ? (
        // The order flips only side by side: stacked, text comes first on every row, so the eye keeps one path down the page.
        <PanelPlate className={cn(flipped && "@3xl:order-first")}>{feature.visual}</PanelPlate>
      ) : null}
    </li>
  )
}

function FeatureBentoRows({
  title = "After you hang up.",
  titleQuiet = "The notes take care of themselves.",
  features = ROW_FEATURES,
  className,
  ...props
}: FeatureBentoSectionProps) {
  return (
    <section data-slot="feature-bento" data-variant="rows" className={cn("@container w-full bg-background pointer-coarse:[&_input]:h-10", className)} {...props}>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 @2xl:px-8">
        <SectionTitle title={title} quiet={titleQuiet} />
        {features.length > 0 ? (
          <ul className="flex flex-col gap-12">
            {features.map((feature, index) => (
              <FeatureRow key={feature.id} feature={feature} flipped={index % 2 === 1} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export { FeatureBentoRows }
