import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { Bento } from "@/src/components/landing/bento"
import { BlockGallery } from "@/src/components/landing/block-gallery"
import { EffectPlayground } from "@/src/components/landing/effect-playground"
import { Faq } from "@/src/components/landing/faq"
import { Footer } from "@/src/components/landing/footer"
import { Hero } from "@/src/components/landing/hero"
import { SectionHeading } from "@/src/components/landing/section-heading"
import { Steps } from "@/src/components/landing/steps"
import { Story } from "@/src/components/landing/story"
import { WhyPanel } from "@/src/components/why-panel"
import { byCategory, findComponent } from "@/src/content"
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/src/content/types"

const WHY_EXAMPLE = "thinking-indicator"
const BLOCK_PREVIEW_COUNT = 6

function BlocksSection() {
  return (
    <section aria-labelledby="blocks-heading" className="rounded-[28px] bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-10 md:py-20">
        <SectionHeading id="blocks-heading" lead="Whole screens, not parts." quiet="Pick one, copy it, change the words." />
        <div className="mt-10">
          <BlockGallery limit={BLOCK_PREVIEW_COUNT} />
        </div>
        <Link to="/blocks" className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline">
          See every block <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}

function WhySection() {
  const example = findComponent(WHY_EXAMPLE)
  if (!example) return null

  return (
    <section aria-labelledby="why-heading-home" className="rounded-[28px] bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-10 md:py-20">
        <div>
          <SectionHeading id="why-heading-home" lead="Every piece comes with its reason." quiet="So your design review has an argument." />
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            The same metadata renders this panel, the agent skill and llms.txt, so people and models read one truth.
          </p>
          <Link
            to={`/components/${example.name}`}
            className="mt-6 inline-block text-[15px] font-medium underline underline-offset-4"
          >
            See {example.title}
          </Link>
        </div>
        <WhyPanel why={example.why} />
      </div>
    </section>
  )
}

function KitIndex() {
  return (
    <section aria-labelledby="all-components" className="mx-auto w-full max-w-7xl px-4 py-16 md:px-10 md:py-20">
      <SectionHeading id="all-components" lead="Everything in the kit." quiet="Install one piece or all of them." />
      <div className="mt-10 flex flex-col gap-8">
        {CATEGORY_ORDER.map((category) => {
          const items = byCategory(category)
          if (items.length === 0) return null
          return (
            <div key={category} className="grid gap-4 md:grid-cols-[180px_1fr]">
              <h3 className="text-sm font-medium text-muted-foreground">{CATEGORY_LABELS[category]}</h3>
              <ul className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                {items.map((component) => (
                  <li key={component.name} className="min-w-0">
                    <Link
                      to={`/components/${component.name}`}
                      className="group flex items-baseline justify-between gap-4 rounded-md py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <span className="shrink-0 text-[15px] font-medium group-hover:underline group-hover:underline-offset-4">
                        {component.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{component.why.principle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function Home() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <Hero />
      <BlocksSection />
      <Story />
      <Bento />
      <EffectPlayground />
      <WhySection />
      <div className="rounded-[28px] bg-background">
        <Steps />
        <KitIndex />
        <Faq />
        <Footer />
      </div>
    </div>
  )
}
