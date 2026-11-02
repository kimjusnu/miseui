# Mise UI

**Design decisions, already made.** Whole screens, palettes and living effects for developers who would rather not open Figma, distributed as a [shadcn](https://ui.shadcn.com) registry. Every piece ships with the psychology behind its shape, the situation where you should *not* use it, and an agent skill so Claude Code, Cursor and friends install the right piece and keep the rationale.

Site and docs: **https://miseui.junsu4621.workers.dev** · For agents: [`/llms.txt`](https://miseui.junsu4621.workers.dev/llms.txt) · [`skills/miseui`](skills/miseui)

> *Mise* (/miːz/) as in *mise en place*: everything in the place it belongs, for a reason.

## Why

- **Made for people who do not design.** Copy a whole screen and change the words. Spacing, type, colour and motion are already decided.
- **It explains itself.** Each component names the principle behind it (Doherty threshold, visibility of system status, Hick's law…) and a `Don't` rule. Reviewers get an argument, not a vibe.
- **Built for AI states.** Thinking, searching, streaming text, tool calls, reasoning steps, voice input. The waits and hand-offs ordinary kits never designed for.
- **Alive, not decorated.** Beam borders, liquid metal, gooey morphs, fluid transitions. Each effect marks a real state and names when not to use it.
- **Agent-native.** A shadcn registry plus a skill with a symptom → component table. The metadata that renders the docs is the same metadata the skill is generated from.

## Install

Mise UI copies source into your project; there is nothing to uninstall later.

```bash
# 1. a shadcn project (React + Tailwind CSS v4)
npx shadcn@latest init

# 2. pick one palette: theme (amber), theme-ink, theme-cobalt, theme-forest, theme-ember
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/theme.json

# 3. a whole screen, or any single piece
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/pricing-table.json
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/thinking-orb.json
```

Give your coding agent the skill:

```bash
npx skills add kimjusnu/miseui
# or copy skills/miseui into .claude/skills/
```

## Components

**Blocks** — `chat-assistant`, `dashboard-overview`, `empty-state`, `feature-bento`, `landing-hero`, `login-form`, `pricing-table`, `settings-page`, `signup-steps`

**AI states** — `thinking-indicator`, `streaming-text`, `tool-call-card`, `reasoning-steps`, `voice-wave`

**Effects** — `beam-border`, `intelligence-glow`, `shimmer-text`, `thinking-orb`, `gooey-morph`, `liquid-metal`, `voice-glow`, `agent-avatar`, `reveal-image`

**Transitions** — `materialize`, `sheet`, `use-view-transition` (presets: `fade-through`, `shared-axis-x`, `shared-axis-y`, `scale-up`, `blur-in`)

**Core** — `button`, `badge`, `card`, `input`, `textarea`, `label`, `checkbox`, `switch`, `tabs`, `tooltip`, `dialog`, `dropdown-menu`, `popover`, `select`, `skeleton`

Each one has a page with a live demo, its principle and install command: https://miseui.junsu4621.workers.dev/components/thinking-orb

### Plain by default, alive on demand

Core components render the plain version until you pass an `effect`:

| Component | `effect` |
|---|---|
| `button` | `liquid`, `beam`, `shimmer`, `magnetic` |
| `badge` | `glow`, `beam`, `count`, `live` |
| `card` | `beam`, `spotlight`, `tilt`, `materialize` |
| `input`, `textarea` | `glow`, `ai` |
| `skeleton` | `pulse`, `wave`, `gooey` |
| `tabs` | `spring`, `pill` |
| `switch` | `gooey`, `haptic` |
| `tooltip`, `popover` | `materialize` |
| `dialog` | `materialize`, `scrim-blur` |
| `select`, `dropdown-menu` | `materialize`, `spring` |
| `checkbox` | `draw` |

Each effect names its own principle on the component page. A component with effects installs the effect source it uses, so delete what you never pass.

## Principles

1. **Every motion respects `prefers-reduced-motion`.** Easing and durations come from four tokens (`--ease-mise`, `--duration-fast|base|slow`), nothing else.
2. **One accent per screen.** `mise` marks the primary action or live AI activity, never decoration.
3. **Name the wait.** Anything that takes longer than about a second gets a label that says what is happening.
4. **No dark patterns.** No fake countdowns, hidden cancel, pre-ticked consent. Where a pattern is tempting, the docs show it as a `Don't`.

## Development

```bash
pnpm install
pnpm dev              # site + registry at http://localhost:5173
pnpm test             # vitest + Testing Library
pnpm build            # registry → skill → typecheck → site
```

Component source lives in `registry/miseui/ui/<name>.tsx` with its test beside it. Its registry entry is `registry/items/<name>.json`, its docs metadata `src/content/<name>.ts`, its demo `src/demos/<name>.tsx`. `pnpm registry:build` merges the items into `registry.json` and emits `public/r/*.json`; `pnpm skill:build` regenerates `skills/miseui` and `public/llms.txt` from the metadata.

## License

[MIT](LICENSE) © 2026 Junsu Kim
