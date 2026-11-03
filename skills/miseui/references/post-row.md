# Post Row

One writing entry as a single link: a title, a date that stays on its calendar day and quiet tags.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/post-row.json
```

## Why it looks like this

**Scanning patterns.** People read a list of articles down the left edge and stop on a title, so the title is the only strong thing in the row and the date keeps to one column. The whole row is one target, which is faster to hit than a small link inside it.

**Don't.** Do not put other links or buttons inside; a link cannot hold another link, so a row with actions needs a table or a card. For image-led writing, use a card.

## Designs

Pass one as the `variant` prop.

- `line` (Alignment): A compact list of many posts, such as a home page section, where dates line up down the right edge.
- `stacked` (Progressive disclosure): A blog index, where a summary helps people decide before they click.
- `ledger` (Chronological order): An archive or a changelog, where when it happened is how people find it.

## Effects

Pass one as the `effect` prop.

- `nudge` (Directional cue): When the row is the only call to action on the screen: a small move towards the arrow says this leads somewhere.

## Usage

```tsx
import { PostRow } from "@/components/ui/post-row"

<ul>
  <li>
    <PostRow href="/notes/empty-states" title="Empty states people read" date="2026-11-03" tags={["Design"]} />
  </li>
</ul>

<PostRow variant="stacked" effect="nudge" href="/notes/pricing" title="Pricing page" date="2026-10-20" excerpt="Five versions later." meta="6 min read" />

// With a router
<PostRow as={RouterLink} href="/notes/onboarding" title="Onboarding" date="2026-09-12" />
```

Exports: `PostRow`, `formatPostDate`
