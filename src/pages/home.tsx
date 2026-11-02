import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { ThinkingIndicator } from "@/registry/miseui/ui/thinking-indicator"
import { CodeBlock } from "@/src/components/code-block"
import { components } from "@/src/content"
import { CATEGORY_LABELS } from "@/src/content/types"
import { installCommand } from "@/src/lib/site"

const PILLARS = [
  {
    title: "It explains itself",
    body: "Every component names the principle behind its shape, and the situation where you should not use it.",
  },
  {
    title: "Built for AI states",
    body: "Thinking, searching, streaming, tool calls. The waits and hand-offs that ordinary kits never designed for.",
  },
  {
    title: "Agent-native",
    body: "A shadcn registry plus an agent skill, so Claude Code or Cursor installs the right piece and keeps the rationale.",
  },
] as const

export function Home() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6 pt-4">
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
          UI that <em className="text-mise">explains itself.</em>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Components and effects for the AI era. Each one ships with the psychology behind it and an agent skill,
          so people and models both know why it looks the way it does.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="mise" size="lg" asChild>
            <Link to="/docs">
              Get started <ArrowRight />
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link to="/components/thinking-indicator">See a component</Link>
          </Button>
        </div>
        <CodeBlock code={installCommand("thinking-indicator")} language="bash" className="max-w-xl" />
      </section>

      <section aria-label="Live example" className="flex items-center gap-6 rounded-xl border bg-card p-8">
        <ThinkingIndicator state="searching" size="lg" label="Searching 12 sources…" />
        <p className="text-sm text-muted-foreground">
          Visibility of system status. The wait is named, so it never reads as a freeze.
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col gap-2">
            <h2 className="font-display text-2xl italic">{pillar.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="all-components" className="flex flex-col gap-4 border-t pt-10">
        <h2 id="all-components" className="text-lg font-semibold">
          Components
        </h2>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {components.map((component) => (
            <li key={component.name}>
              <Link
                to={`/components/${component.name}`}
                className="group flex items-baseline justify-between gap-4 rounded-md py-1.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="text-sm font-medium group-hover:underline group-hover:underline-offset-4">
                  {component.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[component.category]} · {component.why.principle}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
