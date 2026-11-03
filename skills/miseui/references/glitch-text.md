# Glitch Text

A short stepped burst that ends in clean text, for the one line that should feel like something just happened.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/glitch-text.json
```

## Why it looks like this

**Abrupt onset.** A sudden change captures attention before people decide to look, which suits the moment a state flips: back online, access granted. The burst is under a second and always ends in plain text, so the attention it earns is spent on reading the line, and stepped timing is the point: smoothing it would read as a slow animation and not as a fault.

**Don't.** Never loop it: a glitch that keeps going makes a page unreadable and can harm people sensitive to flicker. Use it once per view at most, not on body text or on error messages, where a fault look makes a real problem harder to trust.

## Designs

Pass one as the `variant` prop.

- `split` (Chromatic aberration): A display headline: red and cyan fringes pull apart and snap back, the most recognisable look with the text itself never moving.
- `slice` (Continuity break): A large line where a torn signal fits: horizontal bands shift sideways through clip paths and rejoin.
- `flicker` (Mental model): A sign or a status coming on: letters drop out and return like a tube starting, the quietest of the four and the one that suits small type.
- `skew` (Economy of motion): A short label in a tight spot: the whole line jumps in steps, with no extra layers on top of the text.

## Effects

Pass one as the `effect` prop.

- `hover` (Feedback): A link that answers when pointed at or focused and is otherwise plain. It has a one second cool-down, so running a pointer back and forth cannot make it flash.

## Usage

```tsx
import { GlitchText } from "@/components/ui/glitch-text"

<GlitchText as="h1" text="Connection restored" />

<GlitchText text="Signal recovered" variant="slice" trigger="mount" />

<a href="/status">
  <GlitchText text="See system status" variant="skew" effect="hover" />
</a>
```

Exports: `GlitchText`
