import type * as React from "react"
import { ChatDocked } from "@/registry/miseui/blocks/chat-assistant-docked"
import type { ChatPanelOptions } from "@/registry/miseui/blocks/chat-assistant-panel-state"
import type { ChatMessage, ChatStatus, ChatToolCall } from "@/registry/miseui/blocks/chat-assistant-parts"
import { ChatPopup } from "@/registry/miseui/blocks/chat-assistant-popup"
import { useSampleChat } from "@/registry/miseui/blocks/chat-assistant-sample"
import { ChatScreen, type ChatConversation, type ChatOptions } from "@/registry/miseui/blocks/chat-assistant-screen"

type ChatAssistantVariant = "full" | "docked" | "popup"

interface ChatAssistantProps extends React.ComponentProps<"section">, ChatOptions, ChatPanelOptions {
  /** `full` is the whole screen, `docked` a panel beside the work, `popup` a launcher that opens a small window. Anything else is `full`. */
  variant?: ChatAssistantVariant
  /** The conversation. Leave it out and the block runs a scripted sample, so it can be previewed as is. */
  messages?: readonly ChatMessage[]
  /** "generating" swaps Send for Stop and lights the composer. Ignored while the sample runs. */
  status?: ChatStatus
  /** `docked` and `popup`: the page the chat sits beside or floats over. Leave it out to see a sample report. */
  children?: React.ReactNode
}

type ChatLayoutProps = Omit<ChatAssistantProps, "messages" | "status"> & ChatConversation

/** `full` has no work to sit beside, so children and the open state only reach the two that do. */
function ChatLayout({ variant, children, open, defaultOpen, onOpenChange, ...props }: ChatLayoutProps) {
  const panel = { open, defaultOpen, onOpenChange }
  if (variant === "docked") return <ChatDocked {...props} {...panel}>{children}</ChatDocked>
  if (variant === "popup") return <ChatPopup {...props} {...panel}>{children}</ChatPopup>
  return <ChatScreen data-variant="full" {...props} />
}

function SampleChat({ onSend, onStop, onNewChat, ...props }: Omit<ChatAssistantProps, "messages" | "status">) {
  const sample = useSampleChat()
  return (
    <ChatLayout
      {...props}
      messages={sample.messages}
      status={sample.status}
      onSend={(text) => {
        onSend?.(text)
        sample.send(text)
      }}
      onStop={() => {
        onStop?.()
        sample.stop()
      }}
      onNewChat={() => {
        onNewChat?.()
        sample.reset()
      }}
    />
  )
}

function ChatAssistant({ messages, status = "idle", ...props }: ChatAssistantProps) {
  if (messages) return <ChatLayout messages={messages} status={status} {...props} />
  return <SampleChat {...props} />
}

export { ChatAssistant, type ChatAssistantProps, type ChatAssistantVariant, type ChatMessage, type ChatStatus, type ChatToolCall }
