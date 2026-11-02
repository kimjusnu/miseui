import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "reasoning-steps",
  title: "Reasoning Steps",
  category: "ai",
  description: "Collapsed timeline of the model's steps; the header names the current one, the body shows them all.",
  why: {
    principle: "Progressive disclosure",
    explanation:
      "Most of the time people want the answer, not the route to it, so the steps stay folded and the header alone says what is happening now. Anyone who wants to verify the work opens the timeline and sees every step with its outcome.",
    avoid:
      "Do not use it to narrate trivial work with a single step, and do not force it open on every message; the value is in choosing when to look.",
  },
  usage: `import { ReasoningSteps } from "@/components/ui/reasoning-steps"

<ReasoningSteps
  steps={[
    { id: "read", label: "Reading the question", status: "done" },
    { id: "search", label: "Searching docs", status: "active", detail: "3 sources so far" },
    { id: "write", label: "Writing the answer", status: "pending" },
  ]}
/>
<ReasoningSteps steps={steps} summary="How I got here" defaultOpen />`,
  exports: ["ReasoningSteps", "describeSteps"],
}
