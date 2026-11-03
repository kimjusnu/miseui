# QR Code

A QR code encoder written from scratch and drawn as crisp SVG with a quiet zone, in square, dotted, framed and logo forms, always dark on light so it scans.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/qr-code.json
```

## Why it looks like this

**Reducing interaction cost.** Typing a URL from one screen into a phone is slow and error-prone. A code turns that into one glance through a camera, and the error correction means a smudge or a small logo does not break it. Everything that keeps it scanning, the quiet zone and the dark-on-light contrast, is fixed so a theme cannot take it away.

**Don't.** Do not make someone already on a phone scan their own screen; give them a link as well. Do not encode long text, since denser symbols need a bigger print and a steadier hand.

## Designs

Pass one as the `variant` prop.

- `plain` (Signal over decoration): When reliability is all that matters: tickets, printed labels, small sizes.
- `rounded` (Aesthetic-usability effect): On a marketing page or a menu, where the code should feel part of the design. Keep it at 120 px or more.
- `framed` (Law of common region): When people need to know what they get before scanning: the caption and the code read as one object.
- `logo` (Recognition over recall): When a familiar mark gives people the confidence to scan. It forces level H, which makes the symbol denser, so give it more room.

## Effects

Pass one as the `effect` prop.

- `reveal` (Attention through motion): When the code appears as a result, such as after pressing Share. The clip is removed as soon as it ends, so a camera never sees it.

## Usage

```tsx
import { QrCode } from "@/components/ui/qr-code"

<QrCode value="https://example.com/menu" label="Open the menu" />

<QrCode value="https://example.com/menu" variant="framed" caption="Scan for the menu" effect="reveal" size={160} />

<QrCode value="https://example.com/menu" variant="logo" logo={<Coffee />} />
```

Exports: `QrCode`
