# Card Deck

One slide at a time for an argument told in order, moved by swipe, tap, arrow keys or a list of titles.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/card-deck.json
```

## Why it looks like this

**Chunking.** Working memory holds a few things at once, so a case laid out as one long page asks people to hold all of it. A deck hands over one idea, lets it land, and the count tells them how much is left, which is what makes them willing to keep going.

**Don't.** Do not use a deck for reference material people need to scan or search: that hides the thing they came for behind clicks. For a row of equal pictures with no order, use Carousel.

## Designs

Pass one as the `variant` prop.

- `slides` (Spatial consistency): For a case study or a report inside a page: slides stay in one strip, so forward and back are real directions.
- `stack` (Affordance): For a few short cards such as tips or a tour, where the pile edge shows there is more and invites a swipe.
- `story` (Fitts's law): On a phone-first page: the whole card is the control, with the larger zone going forward, and segments replace the buttons.
- `outline` (Recognition over recall): For a longer deck people return to: titles stay visible, so they jump to the part they remember without paging.

## Effects

Pass one as the `effect` prop.

- `rewind` (Reversibility): When someone may reach the end and start again: the deck runs back through what they passed in under a second, and any key press interrupts it.

## Usage

```tsx
import { CardDeck } from "@/components/ui/card-deck"

const slides = [
  { id: "why", kicker: "Context", title: "Why we rebuilt onboarding", body: "Half of new teams stopped at step two." },
  { id: "result", title: "What it did", stats: [{ label: "Activation", value: "58%" }] },
]

<CardDeck label="Quarterly review" slides={slides} />

<CardDeck label="Quarterly review" slides={slides} variant="outline" effect="rewind" />
```

Exports: `CardDeck`
