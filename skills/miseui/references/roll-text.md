# Roll Text

A label that rolls to a fresh copy of itself on hover or when its value changes, while assistive tech hears it once.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/roll-text.json
```

## Why it looks like this

**Feedback through continuity.** A link that answers the pointer feels alive, and the answer costs no extra colour or layout because the same word simply moves. The word never changes size, so nothing around it shifts while it rolls.

**Don't.** Do not use it on running text or on more than a few labels at once; a page where everything rolls loses the signal. Do not hide information in the second copy, since touch screens never hover.

## Designs

Pass one as the `variant` prop.

- `word` (Economy of motion): Navigation and footer links, where a quick single roll is enough and a wave would be fussy.
- `letters` (Common fate): One short call to action or display link that is allowed to be the moment on the page.
- `flip` (Spatial metaphor): A bold label on a button or a tile, where turning over suggests there is a back to it.

## Effects

Pass one as the `effect` prop.

- `change` (Change blindness): A label that reports state, such as Save to Saved: the movement makes sure the new word gets noticed.

## Usage

```tsx
import { RollText } from "@/components/ui/roll-text"

<a href="/pricing"><RollText text="Pricing" /></a>

// A whole row drives the label
<a href="/docs" className="group"><RollText text="Read the docs" variant="letters" trigger="parent" /></a>

// Rolls when the value changes
<RollText text={saved ? "Saved" : "Save"} effect="change" />
```

Exports: `RollText`, `letterDelay`
