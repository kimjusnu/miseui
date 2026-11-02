---
name: miseui
description: Use when building React UI with shadcn-style components and AI-era states (thinking, searching, streaming, tool calls, voice). Install from the Mise UI registry and follow each component's psychological rationale.
---

# Mise UI

UI that explains itself. Every component ships with the principle behind its shape and a rule for when not to use it. Keep both when you install or adapt one.

## When to use

- The project is React + Tailwind CSS v4 with a shadcn-style `components.json`
- The screen has an AI step: a wait on a model, streamed text, tool calls, reasoning, voice input
- You need a base kit (button, dialog, select…) whose rationale you can cite in a design review

## Install

1. Theme, once per project: `npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/theme.json`
2. Each component: `npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/<name>.json` (dependencies install automatically)
3. Read `references/<name>.md` before using a component for the first time

## Rules

1. Respect `prefers-reduced-motion`. Every Mise component already does; keep that when you edit one.
2. One `mise` accent per screen. It marks the primary action or live AI activity, never decoration.
3. Name the wait. Any model call over about a second gets a `thinking-indicator` whose label says what is happening.
4. No dark patterns: no fake countdowns, hidden cancel, pre-ticked consent. The **Don't** line in each reference is binding.
5. Keep `data-slot` attributes; tests and styling hooks depend on them.

## Symptom → component

| When you see | Reach for |
|---|---|
| User waits on a model call longer than about a second | `thinking-indicator` |
| Tokens arrive one by one and should read as typing, not as a frozen block | `streaming-text` |
| An agent ran a tool and the user should be able to trust the result | `tool-call-card` |
| A multi-step plan the user may want to inspect but should not be forced to read | `reasoning-steps` |
| The microphone is live and the user must know it | `voice-wave` |
| Content is loading and the final layout is known | `skeleton` |
| One action matters more than the rest of the screen | `button` |
| Too many options in one place | `select` |
| A short list of actions behind one trigger | `dropdown-menu` |
| The user must decide before doing anything else | `dialog` |
| Extra detail that only some users need | `tooltip` |
| Related controls that belong together | `card` |

## AI states

- **Reasoning Steps** (`reasoning-steps`): Collapsed timeline of the model's steps; the header names the current one, the body shows them all. — Progressive disclosure · [reference](references/reasoning-steps.md)
- **Streaming Text** (`streaming-text`): Reveals arriving text character by character at reading speed, with a caret that marks where the next word lands. — Perceived latency · [reference](references/streaming-text.md)
- **Thinking Indicator** (`thinking-indicator`): Three breathing dots and a live label that tell the user the model is working, and on what. — Visibility of system status · labor illusion · [reference](references/thinking-indicator.md)
- **Tool Call Card** (`tool-call-card`): Collapsible record of one tool call: name, status, duration, and the exact input and output on demand. — Transparency builds trust · [reference](references/tool-call-card.md)
- **Voice Wave** (`voice-wave`): Bars that rise with the microphone level so the user can see they are being heard, and see when they are not. — Visibility of system status · [reference](references/voice-wave.md)

## Core

- **Badge** (`badge`): Small status chip in five variants; the warm mise variant is reserved for the one item that must stand out. — Von Restorff effect · [reference](references/badge.md)
- **Button** (`button`): Press target with a 150 ms settle and a 2% press-down so the click feels acknowledged. — Doherty threshold · [reference](references/button.md)
- **Card** (`card`): Bordered surface with header, content and footer slots that reads as one region before anyone reads the text. — Law of common region · [reference](references/card.md)
- **Checkbox** (`checkbox`): Square toggle that fills and draws its check within 150 ms of the press, and announces the change through aria-checked. — Immediate feedback · [reference](references/checkbox.md)
- **Dialog** (`dialog`): Modal surface that dims everything else and holds focus until the user answers one question. — Attention funnel · [reference](references/dialog.md)
- **Dropdown Menu** (`dropdown-menu`): Compact menu of actions that opens from a button and closes on choice, with arrow-key navigation and a destructive variant. — Hick's law · [reference](references/dropdown-menu.md)
- **Input** (`input`): Single-line text field, 36 px tall to match Button, that moves the invalid state onto its border and ring. — Fitts's law · [reference](references/input.md)
- **Label** (`label`): Caption bound to a control: clicking it focuses the field, and it dims when the field is disabled. — Law of proximity · [reference](references/label.md)
- **Popover** (`popover`): Small floating panel anchored to the control that opened it, for a form or detail that does not need a full dialog. — Spatial memory · [reference](references/popover.md)
- **Select** (`select`): Dropdown for one choice from a list, with a placeholder, groups, a check on the chosen row and full keyboard support. — Default effect · [reference](references/select.md)
- **Skeleton** (`skeleton`): Pulsing placeholder shaped like the content that is loading, so the wait feels shorter than a spinner. — Perceived performance · [reference](references/skeleton.md)
- **Switch** (`switch`): Sliding on/off control whose thumb travels 16 px in 150 ms, mirroring the physical toggle it imitates. — Affordance · [reference](references/switch.md)
- **Tabs** (`tabs`): Segmented control that swaps one panel for another in place, so related views share a single spot on the screen. — Chunking · [reference](references/tabs.md)
- **Textarea** (`textarea`): Multi-line text field that starts at 64 px and grows with its content, so the answer is never hidden behind a scrollbar. — Chunking · [reference](references/textarea.md)
- **Tooltip** (`tooltip`): One-line hint that appears on hover or focus with no delay and leaves with the pointer, for detail that does not deserve screen space. — Progressive disclosure · [reference](references/tooltip.md)

Source and issues: https://github.com/kimjusnu/miseui
