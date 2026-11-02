import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { CodeBlock } from "@/src/components/code-block"
import { Showcase } from "@/src/components/showcase"
import { byCategory } from "@/src/content"
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/src/content/types"
import { installCommand } from "@/src/lib/site"

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

export function Home() {
  return (
    <div className="flex flex-col gap-20">
      <section className="flex flex-col items-start gap-6 pt-6 md:pt-14">
        <h1 className="text-display text-[2.75rem] text-balance md:text-7xl">
          UI that explains itself.
          <br />
          Built for the AI era.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground md:text-xl">
          Living components, effects and transitions for interfaces that think. Each one ships with the psychology
          behind it and an agent skill, so people and models both know why it looks the way it does.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="mise" size="lg" asChild>
            <Link to="/docs">
              Get started <ArrowRight />
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link to="/components/thinking-orb">See it move</Link>
          </Button>
        </div>
        <CodeBlock code={installCommand("thinking-orb")} language="bash" className="w-full max-w-xl" />
      </section>

      <Showcase />

      <section className="grid gap-x-10 gap-y-10 md:grid-cols-2">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col gap-2">
            <h2 className="text-title text-2xl">{pillar.title}</h2>
            <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">{pillar.body}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="all-components" className="flex flex-col gap-8 border-t pt-12">
        <h2 id="all-components" className="text-title text-3xl">
          Everything in the kit.
        </h2>
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
      </section>
    </div>
  )
}
