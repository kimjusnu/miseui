# Motion Reveal

One wrapper that lets its content arrive when it comes into view, once, as a block or child by child.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/motion-reveal.json
```

## Why it looks like this

**Staging.** A small arrival tells the eye where new content landed while scrolling, and playing only once means reading something again never costs a wait. People who turned motion off get the content at once, with no observer at work.

**Don't.** Do not wrap everything: when each block on a page moves, none of them says anything. Keep it off interface people work in every day, and off anything above the fold that should already be there.

## Designs

Pass one as the `variant` prop.

- `rise` (Direction of reading): Sections of a landing page, where moving up matches the way the page itself is moving.
- `fade` (Economy of motion): Inside a product or close to text being read, where any movement would pull too hard.
- `clip` (Occlusion): Images and panels: being uncovered reads as already there, instead of something sliding in.

## Effects

Pass one as the `effect` prop.

- `stagger` (Common fate): A short list or a row of cards, where arriving one after another shows they are separate items.

## Usage

```tsx
import { MotionReveal } from "@/components/ui/motion-reveal"

<MotionReveal as="section">
  <h2>Results</h2>
</MotionReveal>

<MotionReveal as="ul" effect="stagger" variant="fade">
  <span>First row</span>
  <span>Second row</span>
</MotionReveal>
```

Exports: `MotionReveal`, `staggerDelay`
