import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "switch",
  title: "Switch",
  category: "forms",
  description:
    "Sliding on/off control whose thumb travels 16 px in 150 ms, mirroring the physical toggle it imitates.",
  why: {
    principle: "Affordance",
    explanation:
      "A thumb sitting on a track looks like something you slide, so people know it toggles before they touch it. Switch moves its thumb 16 px in 150 ms and recolors the track at the same time, which is how a physical toggle behaves and why the state is readable at a glance.",
    avoid:
      "Do not use a Switch for a choice that waits on a Save button; a switch promises instant effect. Use Checkbox when the value is collected and submitted with a form.",
  },
  effects: [
    {
      name: "gooey",
      principle: "Squash and stretch",
      use: "Use it for one playful, prominent setting; a long list of stretching thumbs turns a settings page into noise.",
    },
    {
      name: "haptic",
      principle: "Direct manipulation",
      use: "Use it wherever a switch has to feel physical without being loud, since the thumb answers the finger before the state changes.",
    },
  ],
  usage: `import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="flex items-center gap-2">
  <Switch id="wifi" defaultChecked />
  <Label htmlFor="wifi">Wi-Fi</Label>
</div>

// effect="gooey" stretches the thumb like a drop as it travels; effect="haptic" dips it the instant it is pressed.`,
  exports: ["Switch"],
}
