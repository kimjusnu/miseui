import { useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { ReasoningSteps } from "@/registry/miseui/ui/reasoning-steps"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import { StreamingText } from "@/registry/miseui/ui/streaming-text"
import { ThinkingOrb } from "@/registry/miseui/ui/thinking-orb"
import { ToolCallCard } from "@/registry/miseui/ui/tool-call-card"
import { BODY_CLASS, type ChatMessage, type ChatStatus } from "@/registry/miseui/blocks/chat-assistant-parts"

const WORKING_ORB_PX = 16

function UserBubble({ text }: { text: string }) {
  return (
    <div className={cn(BODY_CLASS, "ml-auto w-fit max-w-[85%] rounded-2xl border bg-popover px-4 py-2 break-words whitespace-pre-wrap")}>
      {text}
    </div>
  )
}

function WorkingRow() {
  return (
    <div role="status" className="flex items-center gap-2 text-[15px]">
      <ThinkingOrb state="thinking" size={WORKING_ORB_PX} label="Working" />
      <ShimmerText>Thinking</ShimmerText>
    </div>
  )
}

interface AssistantTurnProps {
  message: ChatMessage
  /** Reveal the text at reading pace instead of showing it whole. */
  streaming: boolean
  working: boolean
}

function AssistantTurn({ message, streaming, working }: AssistantTurnProps) {
  const steps = message.reasoning ?? []
  const tools = message.tools ?? []
  return (
    <div className="flex flex-col gap-3">
      {steps.length > 0 ? (
        <ReasoningSteps steps={steps} defaultOpen={steps.some((step) => step.status === "active")} className="bg-popover" />
      ) : null}
      {tools.map(({ id, ...tool }) => (
        <ToolCallCard key={id} {...tool} className="bg-popover" />
      ))}
      {working && steps.length === 0 ? <WorkingRow /> : null}
      {message.text && streaming ? <StreamingText text={message.text} className={cn(BODY_CLASS, "block")} /> : null}
      {message.text && !streaming ? <p className={cn(BODY_CLASS, "whitespace-pre-wrap")}>{message.text}</p> : null}
    </div>
  )
}

/** Keeps the streaming reveal on a turn after status goes idle: the text may still be catching up, and swapping to plain text would make it jump. */
function useStreamingTurnId(messages: readonly ChatMessage[], status: ChatStatus) {
  const last = messages[messages.length - 1]
  const liveId = status === "generating" && last?.role === "assistant" ? last.id : null
  const [streamingId, setStreamingId] = useState(liveId)
  if (liveId && liveId !== streamingId) setStreamingId(liveId)
  return streamingId
}

interface ChatThreadProps {
  messages: readonly ChatMessage[]
  status: ChatStatus
}

function ChatThread({ messages, status }: ChatThreadProps) {
  const streamingId = useStreamingTurnId(messages, status)
  const generating = status === "generating"
  const last = messages[messages.length - 1]
  return (
    <ol aria-label="Conversation" className="flex flex-col gap-8">
      {messages.map((message) => (
        <li key={message.id}>
          {message.role === "user" ? (
            <UserBubble text={message.text} />
          ) : (
            <AssistantTurn
              message={message}
              streaming={message.id === streamingId}
              working={generating && message === last && !message.text}
            />
          )}
        </li>
      ))}
      {generating && last?.role !== "assistant" ? (
        <li>
          <WorkingRow />
        </li>
      ) : null}
    </ol>
  )
}

export { ChatThread }
