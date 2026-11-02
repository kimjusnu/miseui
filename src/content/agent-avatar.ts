import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "agent-avatar",
  title: "Agent Avatar",
  category: "effects",
  description:
    "A deterministic SVG face for an agent: the same seed always draws the same overlapping blobs, in theme colours.",
  why: {
    principle: "Familiarity · identity",
    explanation:
      "In a thread with several agents, people need to know who said what before they read it. A face that is always the same for the same agent does that in a glance, and seeing it again builds trust the way a familiar byline does. The shapes are abstract blobs in the theme's own colours, so they sit beside real people's photos without pretending to be one.",
    avoid:
      "Do not make it look like a human photo, and never derive the seed from anything that changes between renders (a timestamp, a message id); a face that keeps changing is worse than no face.",
  },
  usage: `import { AgentAvatar } from "@/components/ui/agent-avatar"

<AgentAvatar seed={agent.id} />
<AgentAvatar seed="researcher" size={56} label="Research agent" />`,
  exports: ["AgentAvatar"],
}
