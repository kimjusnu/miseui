# Liquid Metal

A WebGL metal surface behind a button or chip, with reflections that drift so the control reads as a real, premium material.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/liquid-metal.json
```

## Why it looks like this

**Material honesty · premium cue.** Light that moves across a surface is how we tell real metal from a grey rectangle, and the hand reaches for things that look real. The reflections here come from a noise field that drifts slowly and brightens at the edges, the way a bevel catches a room; nothing flashes. Without WebGL2 the children render plain, so the control never depends on the effect.

**Don't.** One per screen, on the one control that matters most. Never behind body text or as a page background: a moving surface under reading content is noise, not material.

## Usage

```tsx
import { LiquidMetal } from "@/components/ui/liquid-metal"

// Children need a transparent background; the metal is painted behind them.
<LiquidMetal className="rounded-full">
  <button className="h-11 px-6 text-mise-foreground">Continue</button>
</LiquidMetal>
<LiquidMetal tint="mise" intensity={0.9} speed={0.6} className="rounded-md">
  <span className="px-3 text-sm text-mise-foreground">Pro</span>
</LiquidMetal>
```

Exports: `LiquidMetal`
