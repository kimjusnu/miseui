import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "intelligence-glow",
  title: "Intelligence Glow",
  category: "effects",
  description:
    "A slow light around the screen edge while the assistant listens or thinks, visible from anywhere on the page.",
  why: {
    principle: "Global status visibility",
    explanation:
      "While the assistant is listening or thinking the user may be looking at any part of the screen. A light that lives on the screen edge is in peripheral vision wherever they look, so nobody has to find the status indicator. It fades in and out on a spring instead of switching, and turns slowly enough to register as alive rather than as motion.",
    avoid:
      "Switch it off the moment the assistant stops; a glow that outlives the work trains people to ignore it. Keep the intensity low enough that body text next to the edge stays readable.",
  },
  usage: `import { IntelligenceGlow } from "@/components/ui/intelligence-glow"

// Whole screen, fixed to the viewport edges
<IntelligenceGlow active={isListening} />

// Inside a positioned panel
<div className="relative rounded-2xl">
  <IntelligenceGlow active={isThinking} inset intensity={0.4} />
  …
</div>`,
  exports: ["IntelligenceGlow"],
}
