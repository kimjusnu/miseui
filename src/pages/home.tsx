import { Link } from "react-router"
import { Bento } from "@/src/components/landing/bento"
import { EffectPlayground } from "@/src/components/landing/effect-playground"
import { Faq } from "@/src/components/landing/faq"
import { Footer } from "@/src/components/landing/footer"
import { Hero } from "@/src/components/landing/hero"
import { Steps } from "@/src/components/landing/steps"
import { Story } from "@/src/components/landing/story"
import { WhyPanel } from "@/src/components/why-panel"
import { byCategory, findComponent } from "@/src/content"
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/src/content/types"

const WHY_EXAMPLE = "thinking-indicator"

function WhySection() {
  const example = findComponent(WHY_EXAMPLE)
  if (!example) return null

  return (
    <section aria-labelledby="why-heading-home" className="bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-24 md:grid-cols-2 md:items-center md:px-6">
        <div>
          <h2 id="why-heading-home" className="text-display text-4xl text-balance md:text-5xl">
            Every piece comes with its reason.
          </h2>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            The same metadata renders this panel, the agent skill and llms.txt, so people and models read one truth.
          </p>
          <Link
            to={`/components/${example.name}`}
            className="mt-6 inline-block text-[15px] font-medium underline underline-offset-4"
          >
            See {example.title}
          </Link>
        </div>
        <div className="rounded-2xl bg-background p-2 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.25)]">
          <WhyPanel why={example.why} />
        </div>
      </div>
    </section>
  )
}

function KitIndex() {
  return (
    <section aria-labelledby="all-components" className="mx-auto w-full max-w-6xl border-t px-4 py-24 md:px-6">
      <h2 id="all-components" className="text-display text-4xl md:text-5xl">
        Everything in the kit.
      </h2>
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
    <div className="flex flex-col">
      <Hero />
      <Story />
      <Bento />
      <EffectPlayground />
      <WhySection />
      <Steps />
      <KitIndex />
      <Faq />
      <Footer />
    </div>
  )
}
