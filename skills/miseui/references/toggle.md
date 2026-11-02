# Toggle

A button that stays pressed, for turning a view or format on and off without leaving the page.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/toggle.json
```

## Why it looks like this

**Visibility of system status.** A pressed button shows its state at rest, so nobody has to remember whether bold or the filter is on. One click undoes it, which makes trying an option cheap and keeps people exploring.

**Don't.** For a setting that saves and takes effect somewhere else, use Switch. When exactly one option must be chosen, use a radio group. Never change the label when pressed: the state already says it.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): In a toolbar, where buttons sit in a row and only the ones switched on should stand out.
- `outline` (Affordance): Standing alone in a form or page header, where the border says this can be pressed before anyone tries.
- `pill` (Recognition over recall): For filter chips above a list: the check and solid fill make every active filter readable at a glance.
- `icon` (Von Restorff effect): For one well-known action such as favourite or mute, where a single accent square marks it as on.

## Effects

Pass one as the `effect` prop.

- `pop` (Feedback): When the moment deserves a small reward, such as a favourite: the content grows into place on switching on, and switching off simply stops.

## Usage

```tsx
import { Toggle } from "@/components/ui/toggle"

<Toggle variant="outline" defaultPressed>Show archived</Toggle>
<Toggle variant="pill" pressed={remote} onPressedChange={setRemote}>Remote</Toggle>
<Toggle variant="icon" effect="pop" aria-label="Favourite"><Star /></Toggle>
```

Exports: `Toggle`
