# Alert

An in-page message with a title, description, action and dismiss, in neutral, success, warning and error tones and four layouts.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/alert.json
```

## Why it looks like this

**Visibility of system status.** An alert states what happened and what to do next, in the place the person is already looking. Tone is carried by a glyph as well as colour, so a warning still reads as a warning for someone who cannot see the colour, and only errors interrupt a screen reader.

**Don't.** Do not use one for something that just happened and needs no follow-up; that is a toast. Do not stack several on a page, because the second one is already ignored. Never make the only copy of a critical message dismissible.

## Designs

Pass one as the `variant` prop.

- `soft` (Figure and ground): The default inside a form or a settings page, where a tinted block sits with the content without shouting.
- `outline` (Fitts's law): When there is one thing to do about it: the action sits at the far edge, large and easy to reach.
- `banner` (Salience): For a state of the whole account or page, such as a failed payment, stretched edge to edge across the top.
- `side` (Pre-attentive processing): In dense content such as docs or logs, where a coloured rail is seen before anything is read.

## Effects

Pass one as the `effect` prop.

- `materialize` (Object constancy): When an alert appears or leaves in the middle of a page: its height springs, so the content below moves instead of jumping.

## Usage

```tsx
import { Alert, AlertAction } from "@/components/ui/alert"

<Alert
  variant="outline"
  tone="warning"
  title="Storage almost full"
  description="You have 2 GB left. Uploads stop at the limit."
  action={<AlertAction onClick={openBilling}>Upgrade</AlertAction>}
  dismissible
  effect="materialize"
/>

<Alert variant="banner" tone="error" title="Payment failed." description="Update your card to keep access." />
```

Exports: `Alert`, `AlertAction`
