# Indicator

A small count, dot, ring or word pinned to the corner of what it describes, gone at zero and spelled out for screen readers.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/indicator.json
```

## Why it looks like this

**Law of proximity.** A mark on the corner of an icon is read as a fact about that icon, with no sentence needed. It disappears at zero, so its presence is always the news, and a required label gives a screen reader the noun that the number leaves out.

**Don't.** Do not pin marks to everything; three on one screen and none of them means anything. If the mark sits on a button, also put the count in the name of the button, because the mark ignores the pointer and is not part of it.

## Designs

Pass one as the `variant` prop.

- `dot` (Signal to noise): When something is new but the amount does not matter, such as an unread channel.
- `count` (Recognition over recall): When the amount changes what someone does next, such as items in a cart or requests awaiting review.
- `ring` (Common fate): Around an avatar or a tile, when the whole thing is the news, such as a person who is speaking.
- `label` (Plain language): With a short word on a nav item or a card, when a new thing needs a name rather than a number, such as Beta.

## Effects

Pass one as the `effect` prop.

- `pop` (Change blindness): When the value changes while someone is looking elsewhere on the screen, so the small movement catches the eye. Never on first paint.

## Usage

```tsx
import { Indicator } from "@/components/ui/indicator"

<Indicator count={unread} max={99} label={`${unread} unread messages`} effect="pop">
  <Button aria-label={`Inbox, ${unread} unread`} size="icon"><Inbox /></Button>
</Indicator>

<Indicator variant="dot" shape="circle" corner="bottom-right" tone="success" label="Online">
  <Avatar />
</Indicator>
```

Exports: `Indicator`, `formatIndicatorCount`, `isIndicatorVisible`
