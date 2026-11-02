import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { BeamVisual, MergeVisual, OrbVisual, SendVisual } from "./feature-bento-parts"

type BentoSpan = 2 | 3 | 4 | 6

interface BentoFeature {
  id: string
  /** Written as a sentence: the description runs straight on from it, one tone quieter. */
  title: string
  description: string
  /** A live visual. Without one the cell is all type, set larger so it holds its share of the grid. */
  visual?: React.ReactNode
  /** Columns out of 6. Each row should add up to 6, or the grid leaves a hole. */
  span?: BentoSpan
  /** "dark" flips the theme's tokens inside the cell. One or two per grid set a rhythm; more just reads as a dark page. */
  tone?: "default" | "dark"
}

/** Written out so the class names exist for the Tailwind scanner. */
const SPAN_CLASS: Record<BentoSpan, string> = {
  2: "@2xl:col-span-2",
  3: "@2xl:col-span-3",
  4: "@2xl:col-span-4",
  6: "@2xl:col-span-6",
}

const DEFAULT_SPAN: BentoSpan = 3
/** Tinted from the ink, and off in dark mode, where a light-tinted shadow would read as a glow. */
const SOFT_SHADOW_CLASS =
  "shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:shadow-none"

const SAMPLE_FEATURES: readonly BentoFeature[] = [
  {
    id: "after-the-call",
    title: "Keeps working after you hang up.",
    description: "The summary is finished by the time you are back at your desk, with no tab left open.",
    span: 4,
    visual: <BeamVisual />,
  },
  {
    id: "ask",
    title: "Ask the call anything.",
    description: "You get the quote and the minute it was said.",
    span: 2,
    tone: "dark",
    visual: <OrbVisual />,
  },
  {
    id: "no-bot",
    title: "No bot in the call.",
    description: "It records from your own device.",
    span: 2,
  },
  {
    id: "threads",
    title: "Five voices, one page.",
    description: "Everyone's points merge into one record, and split back by speaker when you need to check who said it.",
    span: 4,
    visual: <MergeVisual />,
  },
  {
    id: "send",
    title: "Goes where the team already reads.",
    description: "Email, chat or your tracker, whichever people actually open.",
    span: 6,
    tone: "dark",
    visual: <SendVisual />,
  },
]

function BentoCell({ feature }: { feature: BentoFeature }) {
  const { title, description, visual, span = DEFAULT_SPAN, tone = "default" } = feature
  const dark = tone === "dark"
  const wide = span === 6
  return (
    <li
      data-slot="feature-bento-cell"
      data-span={span}
      className={cn(
        "flex min-w-0 flex-col justify-between gap-6 rounded-2xl border p-6 @4xl:p-8",
        // The dark class flips the tokens on this element, but colour inherits as a value, so it has to be restated.
        dark ? "dark bg-card text-card-foreground" : ["bg-background text-foreground", SOFT_SHADOW_CLASS],
        wide && "@2xl:flex-row @2xl:items-center",
        SPAN_CLASS[span],
      )}
    >
      {visual ? (
        <div data-testid="feature-bento-visual" className={cn("flex min-w-0 flex-1 items-center justify-center", wide && "@2xl:order-last")}>
          {visual}
        </div>
      ) : null}
      {/* Inline, so one tone-split sentence reads as a single thought while the heading stays a real heading. */}
      <div
        data-testid="feature-bento-copy"
        className={cn("min-w-0 text-pretty", visual ? "text-[15px] leading-relaxed" : "text-display text-2xl @4xl:text-3xl", wide && "@2xl:flex-1")}
      >
        <h3 className={cn("inline", visual && "font-medium")}>{title}</h3> <p className="inline text-muted-foreground">{description}</p>
      </div>
    </li>
  )
}

interface FeatureBentoProps extends Omit<React.ComponentProps<"section">, "title"> {
  title?: string
  /** Continues the title in the same size, one tone quieter. */
  titleQuiet?: string
  /** One cell per feature, in order. */
  features?: readonly BentoFeature[]
}

function FeatureBento({
  title = "After you hang up.",
  titleQuiet = "The notes take care of themselves.",
  features = SAMPLE_FEATURES,
  className,
  ...props
}: FeatureBentoProps) {
  return (
    <section data-slot="feature-bento" className={cn("@container w-full bg-muted", className)} {...props}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 @2xl:gap-12 @2xl:px-8">
        <h2 className="max-w-2xl text-display text-3xl text-balance @2xl:text-4xl">
          {title} {titleQuiet ? <span className="text-muted-foreground">{titleQuiet}</span> : null}
        </h2>
        {features.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 @2xl:grid-cols-6">
            {features.map((feature) => (
              <BentoCell key={feature.id} feature={feature} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export { FeatureBento, type BentoFeature, type BentoSpan, type FeatureBentoProps }
