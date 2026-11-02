# Rating

A score picked with a click or the arrow keys, as stars, hearts, a joined number scale or a row of segments, with half steps and a read-only form.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/rating.json
```

## Why it looks like this

**Mental models.** Everyone has learned that five stars means best, so nobody has to read an explanation to use it. Hovering fills the marks up to the pointer before anything is chosen, which shows what a click will do. Underneath it is a radio group, so a screen reader hears each value and the arrow keys move through them.

**Don't.** Do not ask for a score when you need a reason; a text box gets you more. Do not show an average in the interactive form, since people read it as their own choice: use readOnly for averages. Half steps are harder to hit on a phone, so keep them to places with a mouse or a large mark.

## Designs

Pass one as the `variant` prop.

- `stars` (Familiarity): For reviews of products, courses or places, where the score sits beside the marks and can be read at a glance.
- `hearts` (Affect heuristic): When the question is how much someone liked it rather than how good it is, such as a recipe or a playlist.
- `numeric` (Anchoring): For surveys and satisfaction scores, where each number is an exact answer and a mark would feel too casual.
- `bar` (Law of continuity): In a dense form or a table row, where a filled length shows the amount without five separate icons.

## Effects

Pass one as the `effect` prop.

- `pop` (Feedback): When the score is a small moment of expression: the picked mark springs into place, and it never replays while the pointer is only passing over.

## Usage

```tsx
import { Rating } from "@/components/ui/rating"

<Rating aria-label="Rate this course" name="score" step={0.5} effect="pop" onValueChange={save} />

<Rating aria-label="Average" readOnly value={4.5} />
<Rating variant="numeric" max={10} aria-label="How likely are you to recommend us?" />
```

Exports: `Rating`, `ratingSteps`, `glyphFill`
