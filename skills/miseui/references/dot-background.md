# Dot Background

Small marks behind your content: an even dot field, a fading one, plus marks or a halftone growing toward one corner, with an optional colour around the pointer.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/dot-background.json
```

## Why it looks like this

**Figure and ground.** Dots carry less ink than lines, so they texture a panel while staying further behind the text. Sparse marks suggest a working surface, like graph paper, and the sentence on top keeps every bit of attention.

**Don't.** Do not use small marks behind small text in a tight space, because a dot and a full stop look alike. Change the spacing before raising the contrast, and do not stack it with another background.

## Designs

Pass one as the `variant` prop.

- `dots` (Law of similarity): Behind empty states and canvases, where an even field reads as a surface ready for work.
- `fade` (Focal point): Behind a centred message, where the field dissolves toward the edges and leaves no hard box.
- `plus` (Signal over noise): On technical or editorial pages, where small registration marks feel more deliberate than dots.
- `halftone` (Gradient of size): In a section with text on the left: dot size carries the eye toward the top right and is gone by the far corner.

## Effects

Pass one as the `effect` prop.

- `pointer` (Direct manipulation): On a hero people move across, where marks taking the accent colour under the pointer show the surface is live. It stays off on touch.

## Usage

```tsx
import { DotBackground } from "@/components/ui/dot-background"

<DotBackground variant="fade" className="rounded-xl border py-24">
  <h2>Nothing on this board yet</h2>
</DotBackground>

// Spacing of dots and fade comes from a custom property.
<DotBackground effect="pointer" className="[--mise-dot-cell:24px]">…</DotBackground>
```

Exports: `DotBackground`, `halftoneBuckets`
