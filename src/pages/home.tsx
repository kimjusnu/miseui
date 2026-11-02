import { Link } from "react-router"
import { Hero } from "@/src/components/landing/hero"
import { Steps } from "@/src/components/landing/steps"
import { Faq } from "@/src/components/landing/faq"
import { Footer } from "@/src/components/landing/footer"
import { Showcase } from "@/src/components/showcase"
import { WhyPanel } from "@/src/components/why-panel"
import { byCategory, findComponent } from "@/src/content"
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/src/content/types"

const PILLARS = [
  {
    title: "It explains itself.",
    body: "Every component names the principle behind its shape, and the situation where you should not use it.",
  },
  {
    title: "Built for AI states.",
    body: "Thinking, listening, streaming, tool calls. The waits and hand-offs that ordinary kits never designed for.",
  },
  {
    title: "Alive, not decorated.",
    body: "Springs with no overshoot, feedback on press, materials with depth. Motion that behaves, never performs.",
  },
  {
    title: "Agent-native.",
    body: "A shadcn registry plus an agent skill, so Claude Code or Cursor installs the right piece and keeps the rationale.",
  },
] as const

const WHY_EXAMPLE = "thinking-indicator"

export function Home() {
  const example = findComponent(WHY_EXAMPLE)

  return (
    <div className="flex flex-col">
      <Hero />

      <section aria-labelledby="effects-heading" className="mx-auto w-full max-w-6xl px-6 py-24">
        <h2 id="effects-heading" className="text-display max-w-2xl text-4xl text-balance md:text-5xl">
          Effects that mean something.
        </h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Each one marks a real state: the AI is working, listening, arriving. Nothing glows for decoration.
        </p>
        <div className="mt-10">
          <Showcase />
        </div>
      </section>

      {example && (
        <section aria-labelledby="why-heading-home" className="bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:grid-cols-2 md:items-center">
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
      )}

      <Steps />

      <section className="mx-auto grid w-full max-w-6xl gap-x-10 gap-y-10 px-6 py-24 md:grid-cols-2">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col gap-2">
            <h2 className="text-title text-2xl">{pillar.title}</h2>
            <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">{pillar.body}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="all-components" className="mx-auto w-full max-w-6xl border-t px-6 py-24">
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
                    <li key={component.name}>
                      <Link
                        to={`/components/${component.name}`}
                        className="group flex items-baseline justify-between gap-4 rounded-md py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <span className="text-[15px] font-medium group-hover:underline group-hover:underline-offset-4">
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

      <Faq />
      <Footer />
    </div>
  )
}
