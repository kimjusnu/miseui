# Split Text

A headline that arrives letter by letter or word by word, with the real sentence kept for assistive tech.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/split-text.json
```

## Why it looks like this

**Staging.** A single short arrival tells the eye where to start on a new screen, and the left-to-right wave moves in the direction people read. Screen readers skip the letters and get the whole sentence, so the effect costs them nothing.

**Don't.** Use it once per view, on one headline. Do not split body text, buttons or anything people read twice, and do not hold important content behind the delay.

## Designs

Pass one as the `variant` prop.

- `rise` (Occlusion): A display headline: letters coming out from behind a line feel set in place, like type on a press.
- `fade` (Economy of motion): A heading in a product or a longer sentence, split by word, where movement would be too much.
- `blur` (Depth of field): A hero over an image or a large gradient, where coming into focus matches the depth already there.

## Effects

Pass one as the `effect` prop.

- `center` (Symmetry): A centred headline: the wave starts from where the eye already is and spreads to both edges.

## Usage

```tsx
import { SplitText } from "@/components/ui/split-text"

<SplitText as="h1" text="Ship the quiet version" trigger="mount" />

<SplitText as="h2" text="Every sentence earns its place" variant="fade" by="words" />

<SplitText as="h1" text="Fewer screens" variant="blur" effect="center" delay={0.2} />
```

Exports: `SplitText`, `SPLIT_PRESETS`, `splitText`, `pieceDelay`
