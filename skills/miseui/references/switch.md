# Switch

Sliding on/off control whose thumb travels 16 px in 150 ms, mirroring the physical toggle it imitates.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/switch.json
```

## Why it looks like this

**Affordance.** A thumb sitting on a track looks like something you slide, so people know it toggles before they touch it. Switch moves its thumb 16 px in 150 ms and recolors the track at the same time, which is how a physical toggle behaves and why the state is readable at a glance.

**Don't.** Do not use a Switch for a choice that waits on a Save button; a switch promises instant effect. Use Checkbox when the value is collected and submitted with a form.

## Usage

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="flex items-center gap-2">
  <Switch id="wifi" defaultChecked />
  <Label htmlFor="wifi">Wi-Fi</Label>
</div>
```

Exports: `Switch`
