import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "streaming-text",
  title: "Streaming Text",
  category: "ai",
  description:
    "Reveals arriving text character by character at reading speed, with a caret that marks where the next word lands.",
  why: {
    principle: "Perceived latency",
    explanation:
      "A reply that starts appearing within the first second feels fast even when the whole answer takes ten. Text that arrives at roughly reading speed is also easier to follow than paragraphs that pop in whole, and the caret shows exactly where to keep reading.",
    avoid:
      "Do not stream text you already have in full; fake typing is a delay dressed up as progress, and people notice. Hand it the growing string from the model, not a finished one.",
  },
  usage: `import { StreamingText } from "@/components/ui/streaming-text"

// \`reply\` grows as tokens arrive from the model
<StreamingText text={reply} onDone={() => setStreaming(false)} />
<StreamingText text={reply} speed={90} cursor={false} />`,
  exports: ["StreamingText"],
}
