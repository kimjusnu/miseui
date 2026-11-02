# Thinking Orb

A breathing sphere whose motion says idle, listening, thinking or speaking without a word of text.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/thinking-orb.json
```

## Why it looks like this

**Ambient status · labor illusion.** People read an assistant's state from the corner of their eye, the way they read whether someone is listening from their face. A slow breath means idle, a halo spreading outward means it hears you, two pools of light turning against each other mean it is working, and a rhythmic pulse means it is talking. Seeing the work happen also makes the answer feel more considered.

**Don't.** One orb per screen. Do not pair it with a thinking indicator for the same job; two signals for one state read as two things happening.

## Usage

```tsx
import { ThinkingOrb } from "@/components/ui/thinking-orb"

<ThinkingOrb state="listening" />
<ThinkingOrb state="thinking" size={72} label="Assistant is working" />
<ThinkingOrb state="speaking" />
```

Exports: `ThinkingOrb`
