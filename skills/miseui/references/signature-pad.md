# Signature Pad

Sign with a finger, pen or mouse in smooth strokes, with undo and SVG or PNG export, and a typed name for anyone using a keyboard.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/signature-pad.json
```

## Why it looks like this

**Accessibility as equivalence.** Signing by hand feels like agreeing to something, which is the point. But a hand-drawn line is out of reach for many people, so typing a name is offered as an equal path, not a fallback buried in settings. Strokes are smoothed, so a shaky fingertip on a small pad still looks like a signature.

**Don't.** Do not ask for a signature when a checkbox would carry the same meaning: it is a slow step and it costs people on phones. This draws a mark; it does not make a contract binding. If that matters, pair it with identity checks and an audit trail on the server.

## Designs

Pass one as the `variant` prop.

- `plain` (Affordance): Forms where the pad is one field among others: a bordered box reads at once as a place to write in.
- `line` (Mental model): Documents and receipts: a single rule and an x are what people have signed on all their lives, with no box in sight.
- `card` (Law of common region): A signing step on its own, with a heading and one line saying what is being agreed to, right beside the place to sign.
- `compact` (Progressive disclosure): Tight rows such as delivery confirmation: one short strip with controls that only appear once they can do something.

## Usage

```tsx
import { SignaturePad, type SignaturePadHandle } from "@/components/ui/signature-pad"

const pad = useRef<SignaturePadHandle>(null)

<SignaturePad
  ref={pad}
  variant="card"
  title="Sign the lease"
  description="You agree to the terms above."
  name="signature"
  onChange={(value) => setCanSubmit(!value.empty)}
/>

// When saving. Exports in dark ink, even in dark mode.
const png = pad.current?.toPng({ background: "#ffffff" })
const svg = pad.current?.toSvg()
```

Exports: `SignaturePad`, `signatureToPng`, `signatureToSvg`
