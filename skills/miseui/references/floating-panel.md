# Floating Panel

A movable, resizable window that stays on screen, for tools people keep open beside their work.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/floating-panel.json
```

## Why it looks like this

**User control and freedom.** When a tool has to stay open beside the work, only the person using it knows what it must not cover. Letting them move, shrink and tuck it away means the interface never has to guess, and clamping to the edges means it can never be lost off screen.

**Don't.** Do not use it for a decision that needs an answer before anything else can happen; that is a dialog. On a phone there is rarely room to float anything, so prefer a drawer there.

## Designs

Pass one as the `variant` prop.

- `panel` (Familiarity): The default for an inspector or a preview: a titled window people already know how to handle.
- `compact` (Signal to noise ratio): For small readouts such as a colour value or a log, where chrome should not outweigh the few lines inside.
- `docked` (Fitts's law): When the panel should hold an edge at full height instead of covering the middle. Drag it across and it takes the nearer side.
- `tool` (Proximity): For a palette of icon tools that belongs next to the canvas: a grip and the tools, with no title taking up room.

## Effects

Pass one as the `effect` prop.

- `momentum` (Momentum projection): On large canvases where people throw panels out of the way: it travels on from a flick and comes to rest inside the edges.

## Usage

```tsx
import { FloatingPanel } from "@/components/ui/floating-panel"

// Floats over the viewport.
<FloatingPanel title="Layers" defaultPosition={{ x: 24, y: 24 }}>…</FloatingPanel>

// Stays inside a positioned element.
const stage = useRef(null)
<div ref={stage} className="relative h-96">
  <FloatingPanel title="Tools" variant="tool" boundary={stage} effect="momentum">…</FloatingPanel>
</div>
```

Exports: `FloatingPanel`
