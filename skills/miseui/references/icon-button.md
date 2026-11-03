# Icon Button

A glyph-only button that cannot be shipped without a name, with four surfaces, a pending state that keeps focus and a 40 px hit area on touch.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/icon-button.json
```

## Why it looks like this

**Fitts's law.** A small target is slow and easy to miss, so the hit area reaches 40 px on touch while the glyph stays the size the layout wants. The name is a required prop because an icon means nothing to a screen reader, and a missing label is the most common accessibility bug in icon buttons.

**Don't.** Do not use a glyph for an action people have to guess; if the icon needs a tooltip to be understood every time, write the word on a Button instead. Do not make a toolbar of solid buttons: the accent is for one action.

## Designs

Pass one as the `variant` prop.

- `ghost` (Figure and ground): In dense rows and table cells, where a surface on every button would become a pattern of boxes.
- `outline` (Affordance): Standing alone on a busy surface, where the hairline says this is pressable before anyone hovers.
- `solid` (Von Restorff effect): The single main action of a screen, such as add or compose. One per view, or it stops standing out.
- `soft` (Visual hierarchy): Secondary actions next to a solid one, present without competing with it.

## Effects

Pass one as the `effect` prop.

- `press` (Doherty threshold): On controls hit many times in a row, such as a like or a stepper: the dip lands on the first frame, so every tap is felt.

## Usage

```tsx
import { IconButton } from "@/components/ui/icon-button"
import { Heart } from "lucide-react"

<IconButton label="Add to favourites" tooltip>
  <Heart />
</IconButton>

<IconButton label="Save" pendingLabel="Saving" pending={saving} variant="solid" effect="press">
  <Heart />
</IconButton>
```

Exports: `IconButton`
