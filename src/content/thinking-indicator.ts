import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "thinking-indicator",
  title: "Thinking Indicator",
  category: "ai",
  description: "Three breathing dots and a live label that tell the user the model is working, and on what.",
  why: {
    principle: "Visibility of system status · labor illusion",
    explanation:
      "Silence during a 2–8 second model call reads as failure. Three breathing dots plus a label that names the work (“Searching…”) make the wait legible, and people rate a result higher when they saw effort go into it.",
    avoid:
      "Never leave it on after the answer arrives, and never render it without a label; the dots are hidden from screen readers, the label is what they hear.",
  },
  usage: `import { ThinkingIndicator } from "@/components/ui/thinking-indicator"

<ThinkingIndicator state="searching" />
<ThinkingIndicator state="writing" label="Drafting reply…" />
<ThinkingIndicator state="done" />`,
  exports: ["ThinkingIndicator"],
}
