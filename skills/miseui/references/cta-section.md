# CTA Section

One clear thing to do, in three decisions: a plate that ends the page, text beside a piece of the product, or a slim row inside a long page. The copy and the summary are sample content.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/cta-section.json
```

## Why it looks like this

**Fogg behaviour model.** People act when they are willing, able and prompted at the same moment. Someone who read to the end of a page is as willing as they will get, so this is where the prompt belongs. The line under the buttons removes the last small fear, and the accent lands on the one button so there is nothing else to weigh.

**Don't.** Do not put it after every section, since a prompt that repeats turns into wallpaper. Do not promise no card or free cancelling unless both are true. Fill the note with what really holds for your product, or pass null.

## Designs

Pass one as the `variant` prop.

- `plate` (Isolation effect): The last thing on a landing page: a bounded surface on grey makes people stop, with nothing competing beside it.
- `split` (Picture superiority effect): The result is the argument: a piece of the finished product next to the button shows what pressing it gets you.
- `banner` (Hick's law): Inside a long article or between sections: one sentence and one button, soft enough for people to read past without losing their place.

## Usage

```tsx
import { CtaSection } from "@/components/cta-section"

<CtaSection
  headline="Your next call can end in a plan."
  headlineQuiet="Invite it once and see."
  description="One sentence on what happens next."
  primaryAction={{ label: "Start free", href: "/signup" }}
  secondaryAction={{ label: "Talk to us", href: "/contact" }}
  note="No card needed."
/>

// A piece of your real product beside the text
<CtaSection variant="split" fragment={<YourResult />} />

// One sentence, one button
<CtaSection variant="banner" primaryAction={{ label: "Read the guide", href: "/guide" }} />
```

Exports: `CtaSection`
