# Hover Card

A preview that appears over a link when the pointer rests on it, laid out for free content, a person, a page or a number.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/hover-card.json
```

## Why it looks like this

**Progressive disclosure.** A name or a link often raises one small question: who is this, where does it go. A preview answers it where the pointer already is, with no page change, and it waits a moment so that a cursor passing by does not set it off.

**Don't.** Hover must never be the only way to reach something. Touch screens have no hover and keyboard users cannot tab into the card, so the trigger has to be a real link to the full page, and the card must hold no action of its own. For anything interactive, use a popover.

## Designs

Pass one as the `variant` prop.

- `plain` (Law of proximity): For a sentence or two of extra detail on a term or a label.
- `profile` (Recognition over recall): On a name in a comment or an activity feed, where a face and a role answer who this is.
- `link-preview` (Information scent): On a link inside text, where seeing the title and the domain helps people decide whether to follow it.
- `stat` (Glanceability): On a number in a table or a dashboard, where the trend behind it is what the reader wants next.

## Effects

Pass one as the `effect` prop.

- `materialize` (Spatial continuity): When the card should feel attached to the link: it grows out of the side it is anchored to and comes into focus.

## Usage

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

<HoverCard>
  <HoverCardTrigger href="/people/priya">Priya Raman</HoverCardTrigger>
  <HoverCardContent
    variant="profile"
    effect="materialize"
    name="Priya Raman"
    handle="@priya"
    avatar={<Avatar name="Priya Raman" />}
    bio="Staff designer in Lisbon."
    facts={[{ label: "Followers", value: "1,204" }]}
  />
</HoverCard>
```

Exports: `HoverCard`, `HoverCardTrigger`, `HoverCardContent`, `sparklinePoints`
