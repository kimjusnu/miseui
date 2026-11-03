# Glass Core

A glass object for the centre of a hero section, drawn without WebGL and still until you ask it to move.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/glass-core.json
```

## Why it looks like this

**Aesthetic-usability effect.** A page that looks considered is forgiven more and trusted sooner, and one crafted object does that job at the first glance. Only the accent colour shows through, so it belongs to the theme and says nothing the headline has to compete with.

**Don't.** Do not place it beside a form or a dashboard, where it pulls the eye from the task. It carries no information, so leave it out when the page has to load fast on poor devices, and never use it twice on a page.

## Designs

Pass one as the `variant` prop.

- `knot` (Focal point): When the object is the page's one statement: a shaded tube whose strands cross over and under, drawn on a small canvas.
- `orb` (Simplicity): When it sits behind a mark or a number: plain CSS with a highlight and a band of refracted accent, and no script needed at rest.
- `panes` (Depth cues): For a product about layers, sync or stacks, where frosted sheets in perspective say the idea without words.

## Effects

Pass one as the `effect` prop.

- `follow` (Feedback): On a page where people move a mouse: the object leans toward the pointer, so it feels attentive. Touch does nothing.
- `drift` (Ambient motion): On a hero with nothing else moving: a slow turn as well as the lean, paused off screen. Use it once, and reduced motion keeps it still.

## Usage

```tsx
import { GlassCore } from "@/components/ui/glass-core"

<GlassCore />

<GlassCore variant="orb" effect="follow" label="Sync engine">
  <Logo className="size-8" />
</GlassCore>
```

Exports: `GlassCore`
