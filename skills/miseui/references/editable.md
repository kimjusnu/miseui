# Editable

Text that turns into a field in place without moving the page: Enter commits, Escape reverts, leaving commits or reverts by prop, with validation and optional buttons.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/editable.json
```

## Why it looks like this

**Direct manipulation.** People change a thing by acting on the thing itself, with no trip to a settings screen and no form to find. The read view and the field share one box, so the text stays exactly under the eye, and the page does not move when editing starts.

**Don't.** Do not use it where the value needs review before saving, or for many fields that change together; a form states that better. Do not make it the only way to discover that something can be edited on touch, where there is no hover.

## Designs

Pass one as the `variant` prop.

- `text` (Figure and ground): For a short value inside other content, such as a name in a table row. Long values truncate to keep the row height.
- `heading` (Direct manipulation): For the title of a page or a document, where the title itself is the control. Long titles wrap rather than truncate.
- `area` (Error prevention): For a description or a note. Enter makes a new line, so saving is an explicit button or Mod+Enter.
- `field` (Signifiers): On a settings page, where the hover box and the pencil say the row is editable before anyone tries it.

## Effects

Pass one as the `effect` prop.

- `materialize` (Attention through motion): When the action buttons should draw the eye as they appear, so that saving is obvious the first time.

## Usage

```tsx
import { Editable } from "@/components/ui/editable"

<Editable label="Project name" defaultValue="Spring launch" onValueChange={save} />

<Editable label="Page title" variant="heading" value={title} onValueChange={setTitle} />

<Editable
  label="Description"
  variant="area"
  effect="materialize"
  blurAction="revert"
  validate={(value) => (value.length > 280 ? "Keep it under 280 characters." : undefined)}
/>
```

Exports: `Editable`
