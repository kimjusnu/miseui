# Marquee

An endless CSS-driven row that stops when someone reaches for it, and turns into a still, scrollable row for people who turned motion off.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/marquee.json
```

## Why it looks like this

**Peripheral motion.** Slow, steady movement says there is more here without asking anyone to read it, which suits a long list where no single item matters most. It holds still on hover and focus, because nobody can read or click a moving target. The compositor runs the animation, so a busy page does not make it stutter.

**Don't.** Do not put anything essential in it: pricing, errors, the only link to a page. Moving content is hard to read and easy to miss. On touch there is no hover, so give a pause button through the paused prop if the row runs for long. Never fill it with logos of customers you do not have.

## Designs

Pass one as the `variant` prop.

- `plain` (Economy of attention): For a quiet line of updates in a footer or a header strip, where it should stay in the background.
- `fade` (Closure): On an open page with no container around it: the masked edges imply the row goes on instead of being cut off.
- `cards` (Law of common region): For quotes or short case notes, where each item needs its own surface and a few lines of text.
- `logos` (Social proof): For tools you really integrate with or customers who agreed to be named, set as text so nothing leans on a borrowed logo file.

## Usage

```tsx
import { Marquee, MarqueeItem } from "@/components/ui/marquee"

<Marquee variant="fade" aria-label="Recent releases" duration={40}>
  <MarqueeItem>Dark mode</MarqueeItem>
  <MarqueeItem>Faster search</MarqueeItem>
</Marquee>

<Marquee variant="cards" vertical reverse className="h-64">…</Marquee>
```

Exports: `Marquee`, `MarqueeItem`
