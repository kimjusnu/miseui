import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "chat-assistant",
  title: "Chat Assistant",
  category: "blocks",
  description: "A full AI chat screen that shows the model working: steps, tool calls, streaming text and a composer that swaps Send for Stop.",
  why: {
    principle: "Labor illusion",
    explanation:
      "People trust an answer more, and wait longer for it, when they can see the work behind it. Steps, tool calls and streaming text turn a silent pause into visible effort, and the beam on the composer says at a glance that the system is busy. Stop sits exactly where Send was, so the way out is already under the hand.",
    avoid:
      "Only show steps your model really took. Invented progress is a lie people eventually catch, and it costs more trust than the wait did. For a one-shot answer under a second, skip the steps and show the text.",
  },
  usage: `import { ChatAssistant } from "@/components/chat-assistant"

// Leave out messages to preview a scripted sample.
<ChatAssistant
  className="h-dvh"
  messages={messages}
  status={isStreaming ? "generating" : "idle"}
  onSend={sendToModel}
  onStop={abort}
  suggestions={["Why did churn rise last month?"]}
/>`,
  exports: ["ChatAssistant"],
}
