# Chat Assistant

A full AI chat screen that shows the model working: steps, tool calls, streaming text and a composer that swaps Send for Stop.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/chat-assistant.json
```

## Why it looks like this

**Labor illusion.** People trust an answer more, and wait longer for it, when they can see the work behind it. Steps, tool calls and streaming text turn a silent pause into visible effort, and the beam on the composer says at a glance that the system is busy. Stop sits exactly where Send was, so the way out is already under the hand.

**Don't.** Only show steps your model really took. Invented progress is a lie people eventually catch, and it costs more trust than the wait did. For a one-shot answer under a second, skip the steps and show the text.

## Usage

```tsx
import { ChatAssistant } from "@/components/chat-assistant"

// Leave out messages to preview a scripted sample.
<ChatAssistant
  className="h-dvh"
  messages={messages}
  status={isStreaming ? "generating" : "idle"}
  onSend={sendToModel}
  onStop={abort}
  suggestions={["Why did churn rise last month?"]}
/>
```

Exports: `ChatAssistant`
