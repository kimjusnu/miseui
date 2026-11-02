import { CodeBlock } from "@/src/components/code-block"
import { installCommand } from "@/src/lib/site"

const STEPS = [
  {
    title: "Copy the command.",
    body: "Every component page has one. It is a shadcn registry item, so the source lands in your project and you own it.",
    code: installCommand("thinking-orb"),
    language: "bash",
  },
  {
    title: "Paste it to your agent.",
    body: "Claude Code, Cursor or Codex runs it, installs the dependencies and reads the skill that says when to use what.",
    code: "npx skills add kimjusnu/miseui",
    language: "bash",
  },
  {
    title: "Keep the reason.",
    body: "Each piece carries its principle and its Don't, so your design review has an argument instead of a vibe.",
    code: `references/thinking-orb.md
Ambient status · labor illusion
Don't: one orb per screen.`,
    language: "md",
  },
] as const

export function Steps() {
  return (
    <section aria-labelledby="steps-heading" className="mx-auto w-full max-w-6xl px-4 py-24 md:px-6">
      <h2 id="steps-heading" className="text-display max-w-2xl text-4xl text-balance md:text-5xl">
        Copy the command. Paste it to your agent.
      </h2>
      <ol className="mt-12 grid gap-10 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex min-w-0 flex-col gap-3">
            <span className="text-title text-2xl text-muted-foreground">{index + 1}</span>
            <h3 className="text-title text-xl">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            <CodeBlock code={step.code} language={step.language} className="mt-auto" />
          </li>
        ))}
      </ol>
    </section>
  )
}
