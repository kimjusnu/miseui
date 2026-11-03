# Scramble Text

Noise that settles into the real sentence, with every letter holding its final width so nothing on the page moves.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/scramble-text.json
```

## Why it looks like this

**Von Restorff effect.** The one thing changing on a still page is the thing people look at, so a short settle points the eye at a line without enlarging or colouring it. Each letter sits in a cell sized by its final glyph, which keeps the neighbours and the line breaks where they will end up, and screen readers get the sentence once instead of the noise.

**Don't.** Use it on one short line per view, such as a label or a headline. Do not scramble body text, prices, or anything people must read at once, and do not use it for text that is actually loading: a scramble promises nothing about progress.

## Designs

Pass one as the `variant` prop.

- `letters` (Similarity): A headline in the page's own face: same-case noise keeps the shape of the line, so it reads as the text arriving and not as a different element.
- `mono` (Signal and noise): A technical label or status line: symbols in a monospace face, muted until each letter resolves in full contrast, so the finished part is the part that stands out.
- `center` (Symmetry): A centred headline: it settles from where the eye already is and spreads to both edges.
- `ticker` (Continuity): Codes, times and departures: each letter walks the alphabet in order like a split-flap board, so the change has a direction instead of being random.

## Effects

Pass one as the `effect` prop.

- `hover` (Feedback): A text link that answers when pointed at or focused, resting as plain text the rest of the time. It listens on the link around it, so keyboard users get the same answer.

## Usage

```tsx
import { ScrambleText } from "@/components/ui/scramble-text"

<ScrambleText as="h1" text="Ship the quiet version" trigger="mount" />

<ScrambleText text="Deploy finished in 42s" variant="mono" />

<ScrambleText text="Gate B12 boards at 19:40" variant="ticker" />

<a href="/changelog">
  <ScrambleText text="Read the changelog" effect="hover" />
</a>
```

Exports: `ScrambleText`
