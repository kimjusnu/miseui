# Spinner

Says work is running when nobody knows how long it will take, in four shapes, with a pulse instead of movement for people who turned motion off.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/spinner.json
```

## Why it looks like this

**Visibility of system status.** A screen that does nothing after a click looks broken, and people click again. A small moving mark answers the only question they have: is it still working? It promises nothing about how long, which is honest when you do not know.

**Don't.** Do not show one for waits under about 300 ms, where the flash is worse than nothing. If you know how far along the work is, use Progress. If you know the shape of the page coming, use Skeleton.

## Designs

Pass one as the `variant` prop.

- `ring` (Familiarity): The default, inside buttons and beside text, where the shape needs no explaining.
- `dots` (Rhythm): In conversation and inline text, where a soft sequence reads as someone composing a reply.
- `bars` (Jakob's law): In native-feeling apps: eight bars around a centre are what phones have shown for years.
- `orbit` (Figure and ground): On a quiet empty panel, where a thin circle and one moving dot hold the eye without adding weight.

## Usage

```tsx
import { Spinner } from "@/components/ui/spinner"

<Spinner />
<Spinner variant="dots" size="sm" label="Writing a reply" />
<Spinner variant="orbit" size="lg" label="Loading invoices" showLabel />
```

Exports: `Spinner`
