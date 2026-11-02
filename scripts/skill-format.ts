import type { Category, ComponentMeta } from "../src/content/types"

const SKILL_NAME = "miseui"
const SKILL_DESCRIPTION =
  "Use when building React UI with shadcn-style components and AI-era states (thinking, searching, streaming, tool calls, voice). Install from the Mise UI registry and follow each component's psychological rationale."
const GITHUB_URL = "https://github.com/kimjusnu/miseui"

/** AI first: it is the differentiator an agent should see before the base kit. */
const CATEGORY_ORDER: readonly Category[] = ["ai", "core"]
const CATEGORY_HEADINGS: Record<Category, string> = { ai: "AI states", core: "Core" }

/** Symptom → component map. Rows whose component is not in the registry are dropped at build time. */
const SYMPTOMS: ReadonlyArray<readonly [symptom: string, component: string]> = [
  ["User waits on a model call longer than about a second", "thinking-indicator"],
  ["Tokens arrive one by one and should read as typing, not as a frozen block", "streaming-text"],
  ["An agent ran a tool and the user should be able to trust the result", "tool-call-card"],
  ["A multi-step plan the user may want to inspect but should not be forced to read", "reasoning-steps"],
  ["The microphone is live and the user must know it", "voice-wave"],
  ["Content is loading and the final layout is known", "skeleton"],
  ["One action matters more than the rest of the screen", "button"],
  ["Too many options in one place", "select"],
  ["A short list of actions behind one trigger", "dropdown-menu"],
  ["The user must decide before doing anything else", "dialog"],
  ["Extra detail that only some users need", "tooltip"],
  ["Related controls that belong together", "card"],
]

const installCommand = (site: string, name: string) => `npx shadcn@latest add ${site}/r/${name}.json`

const codeFence = (language: string, body: string) => `\`\`\`${language}\n${body}\n\`\`\``

export function formatReference(meta: ComponentMeta, site: string): string {
  const exportsList = meta.exports.map((name) => `\`${name}\``).join(", ")
  return [
    `# ${meta.title}`,
    "",
    meta.description,
    "",
    "## Install",
    "",
    codeFence("bash", installCommand(site, meta.name)),
    "",
    "## Why it looks like this",
    "",
    `**${meta.why.principle}.** ${meta.why.explanation}`,
    "",
    `**Don't.** ${meta.why.avoid}`,
    "",
    "## Usage",
    "",
    codeFence("tsx", meta.usage),
    "",
    `Exports: ${exportsList}`,
    "",
  ].join("\n")
}

function componentLine(meta: ComponentMeta): string {
  return `- **${meta.title}** (\`${meta.name}\`): ${meta.description} — ${meta.why.principle} · [reference](references/${meta.name}.md)`
}

function categorySections(components: readonly ComponentMeta[], line: (meta: ComponentMeta) => string): string[] {
  return CATEGORY_ORDER.flatMap((category) => {
    const items = components.filter((meta) => meta.category === category)
    if (items.length === 0) return []
    return [`## ${CATEGORY_HEADINGS[category]}`, "", ...items.map(line), ""]
  })
}

function symptomTable(components: readonly ComponentMeta[]): string[] {
  const names = new Set(components.map((meta) => meta.name))
  const rows = SYMPTOMS.filter(([, component]) => names.has(component))
  if (rows.length === 0) return []
  return [
    "## Symptom → component",
    "",
    "| When you see | Reach for |",
    "|---|---|",
    ...rows.map(([symptom, component]) => `| ${symptom} | \`${component}\` |`),
    "",
  ]
}

export function formatSkill(components: readonly ComponentMeta[], site: string): string {
  return [
    "---",
    `name: ${SKILL_NAME}`,
    `description: ${SKILL_DESCRIPTION}`,
    "---",
    "",
    "# Mise UI",
    "",
    "UI that explains itself. Every component ships with the principle behind its shape and a rule for when not to use it. Keep both when you install or adapt one.",
    "",
    "## When to use",
    "",
    "- The project is React + Tailwind CSS v4 with a shadcn-style `components.json`",
    "- The screen has an AI step: a wait on a model, streamed text, tool calls, reasoning, voice input",
    "- You need a base kit (button, dialog, select…) whose rationale you can cite in a design review",
    "",
    "## Install",
    "",
    `1. Theme, once per project: \`${installCommand(site, "theme")}\``,
    `2. Each component: \`${installCommand(site, "<name>")}\` (dependencies install automatically)`,
    "3. Read `references/<name>.md` before using a component for the first time",
    "",
    "## Rules",
    "",
    "1. Respect `prefers-reduced-motion`. Every Mise component already does; keep that when you edit one.",
    "2. One `mise` accent per screen. It marks the primary action or live AI activity, never decoration.",
    "3. Name the wait. Any model call over about a second gets a `thinking-indicator` whose label says what is happening.",
    "4. No dark patterns: no fake countdowns, hidden cancel, pre-ticked consent. The **Don't** line in each reference is binding.",
    "5. Keep `data-slot` attributes; tests and styling hooks depend on them.",
    "",
    ...symptomTable(components),
    ...categorySections(components, componentLine),
    `Source and issues: ${GITHUB_URL}`,
    "",
  ].join("\n")
}

export function formatLlmsTxt(components: readonly ComponentMeta[], site: string): string {
  const line = (meta: ComponentMeta) =>
    `- [${meta.title}](${site}/components/${meta.name}): ${meta.description} — ${meta.why.principle}. Install: ${site}/r/${meta.name}.json`
  return [
    "# Mise UI",
    "",
    "> UI that explains itself. shadcn-registry React components and AI-era states, each with the psychology behind it and an agent skill.",
    "",
    `Site: ${site}`,
    `Registry: ${site}/r/<name>.json (theme first: ${site}/r/theme.json)`,
    `Agent skill: ${GITHUB_URL}/tree/main/skills/miseui`,
    `Getting started: ${site}/docs`,
    "",
    ...categorySections(components, line),
  ].join("\n")
}
