# Sheet

Bottom sheet you can grab mid-flight: it tracks the finger 1:1, rubber-bands at the top, and lands where the release velocity was heading.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/sheet.json
```

## Why it looks like this

**Interruptibility · momentum projection.** A sheet that must finish closing before it can be reopened feels like a machine; one you can catch and reverse feels like an object. The panel follows the pointer exactly, resists past its top like a real edge, and on release projects the flick (Apple's decay curve) to decide whether it was a dismissal, then hands that velocity to the spring so there is no seam.

**Don't.** Do not put long forms in a sheet, and do not stack sheets. Keep a visible way out (scrim, Escape, drag) and never trap focus without one.

## Usage

```tsx
import { Sheet } from "@/components/ui/sheet"

<Sheet open={open} onOpenChange={setOpen} title="Share">
  <p>Drag me down or flick to dismiss.</p>
</Sheet>
```

Exports: `Sheet`, `resolveSheetRest`
