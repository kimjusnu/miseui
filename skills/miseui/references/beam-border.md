# Beam Border

One beam of light travelling the border of the surface the model is working on, so the eye knows where to wait.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/beam-border.json
```

## Why it looks like this

**Selective attention.** A page with several cards gives no clue which one the model is filling. A single beam circling one border pulls attention to that surface and nowhere else, and its steady lap says the work is still going. The rest of the border stays the ordinary border colour so the card keeps its shape.

**Don't.** Never run it on two surfaces at once; two beams cancel the signal. Do not use it as decoration on a static card, and switch it off the moment the content lands.

## Usage

```tsx
import { BeamBorder } from "@/components/ui/beam-border"

<BeamBorder active={isGenerating} className="rounded-xl">
  <Card>…</Card>
</BeamBorder>

<BeamBorder duration={6} size={160} color="foreground" className="rounded-2xl">
  <Card>…</Card>
</BeamBorder>
```

Exports: `BeamBorder`
