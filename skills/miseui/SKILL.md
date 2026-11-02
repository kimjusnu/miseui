---
name: miseui
description: Use when building React UI and no designer is involved: whole screens (pricing, login, signup, dashboard, settings, chat, landing), complete palettes, shadcn-style components, AI-era states and living effects. Install from the Mise UI registry and follow each piece's psychological rationale.
---

# Mise UI

UI that explains itself. Every component ships with the principle behind its shape and a rule for when not to use it. Keep both when you install or adapt one.

## When to use

- The project is React + Tailwind CSS v4 with a shadcn-style `components.json`
- The screen has an AI step: a wait on a model, streamed text, tool calls, reasoning, voice input
- You need a base kit (button, dialog, select…) whose rationale you can cite in a design review

## Install

1. Theme, once per project: `npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/theme.json` (or `theme-ink`, `theme-cobalt`, `theme-forest`, `theme-ember`; pick one, do not mix colours by hand)
2. Each component: `npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/<name>.json` (dependencies install automatically)
3. Read `references/<name>.md` before using a component for the first time

## Rules

0. Reach for a block first. If a whole screen fits, install it and change the words before composing from parts. Do not restyle it; the spacing and hierarchy are the point.
1. Respect `prefers-reduced-motion`. Every Mise component already does; keep that when you edit one.
2. One `mise` accent per screen. It marks the primary action or live AI activity, never decoration.
3. Name the wait. Any model call over about a second gets a `thinking-indicator` whose label says what is happening.
4. No dark patterns: no fake countdowns, hidden cancel, pre-ticked consent. The **Don't** line in each reference is binding.
5. Keep `data-slot` attributes; tests and styling hooks depend on them.

## Symptom → component

| When you see | Reach for |
|---|---|
| Building a chat screen for an assistant | `chat-assistant` |
| A pricing page where one plan should be the obvious choice | `pricing-table` |
| A login screen | `login-form` |
| A signup flow people abandon halfway | `signup-steps` |
| A dashboard with too many numbers of equal weight | `dashboard-overview` |
| A settings screen | `settings-page` |
| A marketing page needs its first screen | `landing-hero` |
| A marketing page needs its feature section | `feature-bento` |
| A new user sees an empty screen | `empty-state` |
| User waits on a model call longer than about a second | `thinking-indicator` |
| Tokens arrive one by one and should read as typing, not as a frozen block | `streaming-text` |
| An agent ran a tool and the user should be able to trust the result | `tool-call-card` |
| A multi-step plan the user may want to inspect but should not be forced to read | `reasoning-steps` |
| The microphone is live and the user must know it | `voice-glow` |
| The microphone is live and you want bars rather than a glow | `voice-wave` |
| One surface on the screen is where the AI is working right now | `beam-border` |
| The whole app should signal that AI is listening or working | `intelligence-glow` |
| A placeholder like “Thinking…” needs to read as progress without a number | `shimmer-text` |
| Status should be felt in the periphery, without text | `thinking-orb` |
| A premium, physical material cue for one hero control | `liquid-metal` |
| Several status elements merge or split and should feel like one substance | `gooey-morph` |
| Each agent needs a stable, recognisable face | `agent-avatar` |
| An image is being generated and the user should see it arrive | `reveal-image` |
| A sheet or panel the user can drag and flick | `sheet` |
| A surface should arrive like a material, not a fade | `materialize` |
| Content is loading and the final layout is known | `skeleton` |
| One action matters more than the rest of the screen | `button` |
| Too many options in one place | `select` |
| A short list of actions behind one trigger | `dropdown-menu` |
| The user must decide before doing anything else | `dialog` |
| Extra detail that only some users need | `tooltip` |
| Related controls that belong together | `card` |

## Blocks

- **Chat Assistant** (`chat-assistant`): A full AI chat screen that shows the model working: steps, tool calls, streaming text and a composer that swaps Send for Stop. — Labor illusion · [reference](references/chat-assistant.md)
- **Dashboard Overview** (`dashboard-overview`): A product dashboard built around one number: a large metric with its chart, a quieter row under it, recent activity and the one thing that needs you. All figures shown are sample data. — Visual hierarchy: one number first · [reference](references/dashboard-overview.md)
- **Empty State** (`empty-state`): A first screen that gives people somewhere to start, with one action and three worked examples. — Blank page paralysis · [reference](references/empty-state.md)
- **Feature Bento** (`feature-bento`): An asymmetric feature grid: mixed cell sizes, live visuals built from kit effects in some cells and large type in the others. The features shown are sample content. — Aesthetic-usability effect · [reference](references/feature-bento.md)
- **Landing Hero** (`landing-hero`): A left-aligned marketing hero with one message, two actions and a live product preview built from real components, not a screenshot. The call and the people in it are sample content. — Serial position effect · [reference](references/landing-hero.md)
- **Login Form** (`login-form`): A split login screen with labels that stay visible, inline errors, a password you can reveal and a calm brand panel. — Recognition over recall · [reference](references/login-form.md)
- **Pricing Table** (`pricing-table`): Three plans with one dominant centre, an honest yearly anchor and feature rows you can read straight across. — Default effect and anchoring · [reference](references/pricing-table.md)
- **Settings Page** (`settings-page`): A settings screen in grouped rows, with a save bar that appears only when something changed and a destructive area kept well away from the rest. The person and plan shown are sample data. — Chunking and forgiveness · [reference](references/settings-page.md)
- **Signup Steps** (`signup-steps`): A sign-up that asks one question at a time, starts with real progress on the bar and never ticks consent for anyone. — Goal-gradient effect · [reference](references/signup-steps.md)

## AI states

- **Reasoning Steps** (`reasoning-steps`): Collapsed timeline of the model's steps; the header names the current one, the body shows them all. — Progressive disclosure · [reference](references/reasoning-steps.md)
- **Streaming Text** (`streaming-text`): Reveals arriving text character by character at reading speed, with a caret that marks where the next word lands. — Perceived latency · [reference](references/streaming-text.md)
- **Thinking Indicator** (`thinking-indicator`): Three breathing dots and a live label that tell the user the model is working, and on what. — Visibility of system status · labor illusion · [reference](references/thinking-indicator.md)
- **Tool Call Card** (`tool-call-card`): Collapsible record of one tool call: name, status, duration, and the exact input and output on demand. — Transparency builds trust · [reference](references/tool-call-card.md)
- **Voice Wave** (`voice-wave`): Bars that rise with the microphone level so the user can see they are being heard, and see when they are not. — Visibility of system status · [reference](references/voice-wave.md)

## Forms

- **Button** (`button`): Press target that answers on pointer-down: a 3% dip in 100 ms, so the click feels acknowledged. — Doherty threshold · [reference](references/button.md)
- **Checkbox** (`checkbox`): Square toggle that fills and draws its check within 150 ms of the press, and announces the change through aria-checked. — Immediate feedback · [reference](references/checkbox.md)
- **Input** (`input`): Single-line text field, 36 px tall to match Button, that moves the invalid state onto its border and ring. — Fitts's law · [reference](references/input.md)
- **Label** (`label`): Caption bound to a control: clicking it focuses the field, and it dims when the field is disabled. — Law of proximity · [reference](references/label.md)
- **Select** (`select`): Dropdown for one choice from a list, with a placeholder, groups, a check on the chosen row and full keyboard support. — Default effect · [reference](references/select.md)
- **Switch** (`switch`): Sliding on/off control whose thumb travels 16 px in 150 ms, mirroring the physical toggle it imitates. — Affordance · [reference](references/switch.md)
- **Textarea** (`textarea`): Multi-line text field that starts at 64 px and grows with its content, so the answer is never hidden behind a scrollbar. — Chunking · [reference](references/textarea.md)

## Navigation

- **Dropdown Menu** (`dropdown-menu`): Compact menu of actions that opens from a button and closes on choice, with arrow-key navigation and a destructive variant. — Hick's law · [reference](references/dropdown-menu.md)
- **Tabs** (`tabs`): Segmented control that swaps one panel for another in place, so related views share a single spot on the screen. — Chunking · [reference](references/tabs.md)

## Overlays

- **Dialog** (`dialog`): Modal surface that dims everything else and holds focus until the user answers one question. — Attention funnel · [reference](references/dialog.md)
- **Popover** (`popover`): Small floating panel anchored to the control that opened it, for a form or detail that does not need a full dialog. — Spatial memory · [reference](references/popover.md)
- **Tooltip** (`tooltip`): One-line hint that appears on hover or focus with no delay and leaves with the pointer, for detail that does not deserve screen space. — Progressive disclosure · [reference](references/tooltip.md)

## Display

- **Badge** (`badge`): Small status chip in five variants; the warm mise variant is reserved for the one item that must stand out. — Von Restorff effect · [reference](references/badge.md)
- **Card** (`card`): Bordered surface with header, content and footer slots that reads as one region before anyone reads the text. — Law of common region · [reference](references/card.md)
- **Skeleton** (`skeleton`): Pulsing placeholder shaped like the content that is loading, so the wait feels shorter than a spinner. — Perceived performance · [reference](references/skeleton.md)

## Effects

- **Agent Avatar** (`agent-avatar`): A deterministic SVG face for an agent: the same seed always draws the same overlapping blobs, in theme colours. — Familiarity · identity · [reference](references/agent-avatar.md)
- **Beam Border** (`beam-border`): One beam of light travelling the border of the surface the model is working on, so the eye knows where to wait. — Selective attention · [reference](references/beam-border.md)
- **Gooey Morph** (`gooey-morph`): Status dots that merge into one body and split apart again like a liquid, so the eye tracks one thing changing. — Object permanence · [reference](references/gooey-morph.md)
- **Intelligence Glow** (`intelligence-glow`): A slow light around the screen edge while the assistant listens or thinks, visible from anywhere on the page. — Global status visibility · [reference](references/intelligence-glow.md)
- **Liquid Metal** (`liquid-metal`): A WebGL metal surface behind a button or chip, with reflections that drift so the control reads as a real, premium material. — Material honesty · premium cue · [reference](references/liquid-metal.md)
- **Reveal Image** (`reveal-image`): An image that arrives as it is generated: blur to sharp, coarse mosaic to fine, or a left-to-right wipe, driven by a progress value. — Perceived progress · [reference](references/reveal-image.md)
- **Shimmer Text** (`shimmer-text`): A band of light passing over a status label, so “Thinking…” reads as in progress without inventing a percentage. — Progress without false precision · [reference](references/shimmer-text.md)
- **Thinking Orb** (`thinking-orb`): A breathing sphere whose motion says idle, listening, thinking or speaking without a word of text. — Ambient status · labor illusion · [reference](references/thinking-orb.md)
- **Voice Glow** (`voice-glow`): A round glow that swells with the microphone level, so the user sees the assistant is listening and how loudly it hears them. — Visibility of system status · [reference](references/voice-glow.md)

## Transitions

- **Materialize** (`materialize`): A surface that arrives like a material coming into focus: slightly smaller, softer, from its anchor, and leaves the same way. — Spatial consistency · materials · [reference](references/materialize.md)
- **Sheet** (`sheet`): Bottom sheet you can grab mid-flight: it tracks the finger 1:1, rubber-bands at the top, and lands where the release velocity was heading. — Interruptibility · momentum projection · [reference](references/sheet.md)
- **useViewTransition** (`use-view-transition`): Five named page-transition presets on the View Transitions API, with a reduced-motion cross-fade and a plain fallback. — Wayfinding · spatial memory · [reference](references/use-view-transition.md)

Source and issues: https://github.com/kimjusnu/miseui
