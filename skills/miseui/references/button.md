# Button

Press target that answers on pointer-down: a 3% dip in 100 ms, so the click feels acknowledged.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/button.json
```

## Why it looks like this

**Doherty threshold.** Feedback under 400 ms keeps the user in flow. The button answers on pointer-down, not on release: it dips 3% in 100 ms the instant it is pressed, so every click is acknowledged before the request even starts.

**Don't.** Do not add hover lift or glow to every button. Reserve the mise variant for the single primary action on a screen; more than one and nothing is primary. The same goes for effects: one beam or liquid button per screen.

## Effects

Pass one as the `effect` prop. The plain component stays the default.

- `liquid` (Aesthetic-usability effect): On the one hero control of a page, where a material cue should signal value before anyone reads the label.
- `beam` (Selective attention): When this button is the single next step on the screen, so the eye knows where to go without a louder colour.
- `shimmer` (Labor illusion): While the button's own request is running, so a frozen label reads as work in progress.
- `magnetic` (Direct manipulation): On a primary action reached with a mouse, where the button leaning toward the pointer makes it feel ready to be pressed.

## Usage

```tsx
import { Button } from "@/components/ui/button"

<Button variant="mise">Continue</Button>
<Button variant="outline">Cancel</Button>
<Button variant="mise" effect="beam">Generate</Button>
```

Exports: `Button`, `buttonVariants`
