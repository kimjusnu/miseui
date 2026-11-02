import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tool-call-card",
  title: "Tool Call Card",
  category: "ai",
  description:
    "Collapsible record of one tool call: name, status, duration, and the exact input and output on demand.",
  why: {
    principle: "Transparency builds trust",
    explanation:
      "When people can see which tool ran, with what arguments, and what came back, they trust the final answer more and can spot where a wrong answer went wrong. Keeping the detail one click away preserves that audit trail without burying the conversation in JSON.",
    avoid:
      "Do not expand every card by default in a long run; a wall of open payloads hides the answer. Never paste secrets or tokens into the input block, since it is rendered verbatim.",
  },
  usage: `import { ToolCallCard } from "@/components/ui/tool-call-card"

<ToolCallCard name="search_web" status="running" input={{ query: "react 19 release" }} />
<ToolCallCard
  name="read_file"
  status="success"
  durationMs={340}
  input={{ path: "README.md" }}
  output="# Mise UI"
/>
<ToolCallCard name="run_tests" status="error" durationMs={12400} output="2 failed" />`,
  exports: ["ToolCallCard", "formatDuration"],
}
