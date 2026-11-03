# Scrub Text

A paragraph that arrives word by word as you scroll, so the pace of reading stays in the reader's hand.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/scrub-text.json
```

## Why it looks like this

**Direct manipulation.** The text is tied to the scroll instead of a timer, so it can never run ahead of the reader and it reverses when they scroll back. Lighting up word by word also slows the eye down for the one statement that deserves it.

**Don't.** Keep it to one short statement per page; long passages under this effect are tiring and a dimmed paragraph reads as disabled. Never use it for anything people must read to continue, such as terms or errors.

## Designs

Pass one as the `variant` prop.

- `words` (Figure and ground): A manifesto line on a landing page: the unread words sit back and the read ones come forward.
- `marker` (Von Restorff effect): When the text must stay readable the whole time and the sweep only points at it, such as a key finding in an article.
- `rise` (Staging): An opening statement on dark or plain space, where words appearing out of nothing is the event.

## Effects

Pass one as the `effect` prop.

- `smooth` (Perceived continuity): When most visitors use a mouse wheel: a wheel moves in steps, and easing hides them at the price of a small delay behind the hand.

## Usage

```tsx
import { ScrubText } from "@/components/ui/scrub-text"

<ScrubText text="We read every note before we write a line." />

// In a scrolling panel, which needs position: relative
<ScrubText text="..." variant="marker" effect="smooth" scrollRef={panelRef} />
```

Exports: `ScrubText`, `wordRange`, `splitWords`, `settledProgress`
