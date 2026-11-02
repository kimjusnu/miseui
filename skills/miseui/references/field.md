# Field

Gives any control a label, description, error and required mark, and wires the ids and aria attributes so nobody has to remember them.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/field.json
```

## Why it looks like this

**Proximity.** A label, its hint and its error are read as one thing only when they sit close to the control and apart from the next one. Field fixes that spacing once, and connects each part to the control so a screen reader hears the same thing the eye sees. The description stays when an error appears, because the guidance is most useful at exactly that moment.

**Don't.** Do not wrap a lone checkbox with a sentence of its own or a button; they already name themselves. Do not use the error slot for a form-level failure such as a lost connection, which belongs in an alert near the submit button.

## Designs

Pass one as the `variant` prop.

- `stacked` (Single reading line): Use it as the default for forms that people fill in order, because a straight line down is the fastest layout to complete.
- `inline` (Alignment): Use it on a wide settings page people scan to find one value, where labels in a column are quick to run down; it stacks by itself when the column is narrow.
- `floating` (Space economy): Use it for short single-line forms where height is scarce, such as a sign-in card; the label stays visible after typing, unlike a placeholder.
- `card` (Common region): Use it for a settings row whose control is a switch or a small select, where the explanation deserves the room and the control sits at the edge.

## Effects

Pass one as the `effect` prop.

- `shake-error` (Change blindness): Use it on a short form where one rejected value should catch the eye on submit; skip it for validation that runs while typing.
- `materialize` (Spatial continuity): Use it for errors that appear inline during editing, so the layout makes room smoothly and the fields below do not jump.

## Usage

```tsx
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

<Field label="Email" description="For receipts only." error={error} required>
  <Input type="email" />
</Field>

<Field variant="card" label="Weekly digest" description="Every Monday morning.">
  <Switch />
</Field>

// A control inside a wrapper that does not pass props along
<Field label="Timezone">
  <Select>
    <FieldControl>
      <SelectTrigger><SelectValue /></SelectTrigger>
    </FieldControl>
    <SelectContent>…</SelectContent>
  </Select>
</Field>
```

Exports: `Field`, `FieldControl`
