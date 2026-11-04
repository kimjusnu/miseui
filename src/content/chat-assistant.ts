import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "chat-assistant",
  title: "Chat Assistant",
  category: "blocks",
  description: "An AI chat that shows the model working, as a full screen, a panel docked beside the work, or a launcher that opens a small window.",
  why: {
    principle: "Labor illusion",
    explanation:
      "People trust an answer more, and wait longer for it, when they can see the work behind it. Steps, tool calls and streaming text turn a silent pause into visible effort, and the beam on the composer says at a glance that the system is busy. Stop sits exactly where Send was, so the way out is already under the hand.",
    avoid:
      "Only show steps your model really took. Invented progress is a lie people eventually catch, and it costs more trust than the wait did. For a one-shot answer under a second, skip the steps and show the text.",
  },
  designs: [
    {
      name: "full",
      principle: "Labor illusion",
      use: "The conversation is the product, and nothing competes with it on the screen.",
    },
    {
      name: "docked",
      principle: "Keep the work in view",
      use: "People ask about what they are looking at, so the question and the report have to stay on screen together.",
    },
    {
      name: "popup",
      principle: "Available, not in the way",
      use: "Help is occasional, on a page with its own job, and the chat must not take any room until someone asks.",
    },
  ],
  usage: `import { ChatAssistant } from "@/components/chat-assistant"

// Leave out messages to preview a scripted sample.
<ChatAssistant
  className="h-dvh"
  messages={messages}
  status={isStreaming ? "generating" : "idle"}
  onSend={sendToModel}
  onStop={abort}
  suggestions={["Why did churn rise last month?"]}
/>

// A panel beside your screen. Stacks under it in a narrow container.
<ChatAssistant variant="docked" className="h-dvh" messages={messages} status={status} onSend={sendToModel}>
  <YourReport />
</ChatAssistant>

// A launcher over your screen. The window stays inside this block, not the browser window.
<ChatAssistant variant="popup" className="h-dvh" messages={messages} status={status} onSend={sendToModel}>
  <YourPage />
</ChatAssistant>`,
  exports: ["ChatAssistant"],
}
