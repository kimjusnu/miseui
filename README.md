# Mise UI

**UI that explains itself.** React components and effects for the AI era, distributed as a [shadcn](https://ui.shadcn.com) registry. Every component ships with the psychology behind its shape, the situation where you should *not* use it, and an agent skill so Claude Code, Cursor and friends install the right piece and keep the rationale.

Site and docs: **https://miseui.pages.dev** · For agents: [`/llms.txt`](https://miseui.pages.dev/llms.txt) · [`skills/miseui`](skills/miseui)

> *Mise* (/miːz/) as in *mise en place*: everything in the place it belongs, for a reason.

## Why

- **It explains itself.** Each component names the principle behind it (Doherty threshold, visibility of system status, Hick's law…) and a `Don't` rule. Reviewers get an argument, not a vibe.
- **Built for AI states.** Thinking, searching, streaming text, tool calls, reasoning steps, voice input. The waits and hand-offs ordinary kits never designed for.
- **Agent-native.** A shadcn registry plus a skill with a symptom → component table. The metadata that renders the docs is the same metadata the skill is generated from.

## Install

Mise UI copies source into your project; there is nothing to uninstall later.

```bash
# 1. a shadcn project (React + Tailwind CSS v4)
npx shadcn@latest init

# 2. tokens: warm neutrals, one accent (mise), motion tokens
npx shadcn@latest add https://miseui.pages.dev/r/theme.json

# 3. components
npx shadcn@latest add https://miseui.pages.dev/r/thinking-indicator.json
npx shadcn@latest add https://miseui.pages.dev/r/button.json
```

Give your coding agent the skill:

```bash
npx skills add kimjusnu/miseui
# or copy skills/miseui into .claude/skills/
```

## Components

**AI states** — `thinking-indicator`, `streaming-text`, `tool-call-card`, `reasoning-steps`, `voice-wave`

**Core** — `button`, `badge`, `card`, `input`, `textarea`, `label`, `checkbox`, `switch`, `tabs`, `tooltip`, `dialog`, `dropdown-menu`, `popover`, `select`, `skeleton`

Each one has a page with a live demo, its principle and install command: https://miseui.pages.dev/components/thinking-indicator

## Principles

1. **Every motion respects `prefers-reduced-motion`.** Easing and durations come from four tokens (`--ease-mise`, `--duration-fast|base|slow`), nothing else.
2. **One accent per screen.** `mise` marks the primary action or live AI activity, never decoration.
3. **Name the wait.** Anything that takes longer than about a second gets a label that says what is happening.
4. **No dark patterns.** No fake countdowns, hidden cancel, pre-ticked consent. Where a pattern is tempting, the docs show it as a `Don't`.

## Development

```bash
pnpm install
pnpm dev              # docs site + registry at http://localhost:5173
pnpm test             # vitest + Testing Library
pnpm build            # registry → skill → typecheck → site
```

Component source lives in `registry/miseui/ui/<name>.tsx` with its test beside it. Its registry entry is `registry/items/<name>.json`, its docs metadata `src/content/<name>.ts`, its demo `src/demos/<name>.tsx`. `pnpm registry:build` merges the items into `registry.json` and emits `public/r/*.json`; `pnpm skill:build` regenerates `skills/miseui` and `public/llms.txt` from the metadata.

## License

[MIT](LICENSE) © 2026 Junsu Kim
