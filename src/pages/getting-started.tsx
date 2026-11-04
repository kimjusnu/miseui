import { CodeBlock } from "@/src/components/code-block"
import { GITHUB_URL, SITE_URL, installCommand } from "@/src/lib/site"

const STEPS = [
  {
    title: "Start from a shadcn project",
    body: "Mise UI is a shadcn registry. Any React + Tailwind v4 project initialised with the shadcn CLI can install from it.",
    code: "npx shadcn@latest init",
  },
  {
    title: "Add the Mise theme",
    body: "Warm neutral colour tokens, one accent (mise), and the motion tokens every component animates with.",
    code: installCommand("theme"),
  },
  {
    title: "Add components",
    body: "Each component copies its source into components/ui so you own and can edit it.",
    code: `${installCommand("button")}\n${installCommand("thinking-indicator")}`,
  },
  {
    title: "Give your agent the skill",
    body: "The skill tells Claude Code, Cursor and other agents when to reach for which component and the rationale to respect.",
    code: `npx skills add kimjusnu/miseui\n# or copy skills/miseui into .claude/skills/`,
  },
] as const

const NAMESPACE_CONFIG = `{
  "registries": {
    "@miseui": "${SITE_URL}/r/{name}.json"
  }
}`

const MCP_COMMANDS = `npx shadcn@latest mcp init --client claude
# the same namespace also works by hand
npx shadcn@latest add @miseui/pricing-table`

export function GettingStarted() {
  return (
    <article className="flex flex-col gap-10">
      <header>
        <h1 className="text-display text-4xl">Getting started</h1>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Four commands. Nothing to configure, nothing to uninstall later: the code lands in your project.
        </p>
      </header>
      <ol className="flex flex-col gap-8">
        {STEPS.map((step, index) => (
          <li key={step.title} className="grid gap-3 md:grid-cols-[2rem_1fr]">
            <span className="text-title text-2xl text-muted-foreground">{index + 1}</span>
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{step.title}</h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              <CodeBlock code={step.code} language="bash" />
            </div>
          </li>
        ))}
      </ol>
      <section aria-labelledby="mcp-heading" className="flex min-w-0 flex-col gap-3 border-t pt-8">
        <h2 id="mcp-heading" className="text-lg font-semibold">
          Let your agent search and install
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          The shadcn MCP server lets Claude Code, Cursor and other MCP clients browse this registry and install from it. Add the namespace to components.json, connect the server, then ask for what you need, such as a pricing page from miseui.
        </p>
        <CodeBlock code={NAMESPACE_CONFIG} language="json" />
        <CodeBlock code={MCP_COMMANDS} language="bash" />
      </section>
      <section className="flex flex-col gap-3 border-t pt-8">
        <h2 className="text-lg font-semibold">For agents and search</h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Every component page, its principle and its install command are summarised in{" "}
          <a className="underline underline-offset-4" href={`${SITE_URL}/llms.txt`}>
            /llms.txt
          </a>
          . Source, issues and the skill live on{" "}
          <a className="underline underline-offset-4" href={GITHUB_URL}>
            GitHub
          </a>
          .
        </p>
      </section>
    </article>
  )
}
