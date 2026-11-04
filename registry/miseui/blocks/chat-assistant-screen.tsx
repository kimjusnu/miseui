import type * as React from "react"
import { useEffect, useRef } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { ChatComposer } from "@/registry/miseui/blocks/chat-assistant-composer"
import { ChatError, ChatHeader, ChatStarter, COLUMN_CLASS, type ChatMessage, type ChatStatus } from "@/registry/miseui/blocks/chat-assistant-parts"
import { ChatThread } from "@/registry/miseui/blocks/chat-assistant-thread"

/** Within this distance of the end still counts as reading the end, so a small scroll does not stop the follow. */
const STICK_THRESHOLD_PX = 32
const DEFAULT_AGENT_NAME = "Tally"

const DEFAULT_SUGGESTIONS: readonly string[] = [
  "Why did churn rise last month?",
  "Which accounts are at risk this quarter?",
  "Summarize last week's renewals",
]

interface ChatOptions {
  onSend?: (text: string) => void
  onStop?: () => void
  /** Shown when the conversation is empty, and sent as they are when picked. */
  suggestions?: readonly string[]
  agentName?: string
  /** One line under the name while nothing is running. */
  agentDescription?: string
  placeholder?: string
  /** Shows the New chat button. */
  onNewChat?: () => void
  /** The last turn failed. Shown above the composer. */
  error?: string
  onRetry?: () => void
  /** Blocks new messages, for example when the plan's quota is used up. Stop keeps working. */
  disabled?: boolean
}

interface ChatConversation extends ChatOptions {
  messages: readonly ChatMessage[]
  status: ChatStatus
}

interface ChatScreenProps extends React.ComponentProps<"section">, ChatConversation {
  /** Extra controls in the header, such as a way to close a panel. */
  headerActions?: React.ReactNode
  /** A narrow panel, with a smaller headline on the empty screen. */
  compact?: boolean
}

/** Follows new text while the reader is at the end, and lets go as soon as they scroll up to read. */
function useStickToBottom(messageCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  useEffect(() => {
    const scroller = scrollRef.current
    const content = contentRef.current
    if (!scroller || !content || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) scroller.scrollTop = scroller.scrollHeight
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  // A new message means the reader just sent something, so they want the end again.
  useEffect(() => {
    pinnedRef.current = true
    const scroller = scrollRef.current
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  }, [messageCount])

  const onScroll = () => {
    const scroller = scrollRef.current
    if (!scroller) return
    pinnedRef.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < STICK_THRESHOLD_PX
  }

  return { scrollRef, contentRef, onScroll }
}

function ChatScreen({
  messages,
  status,
  onSend,
  onStop,
  suggestions = DEFAULT_SUGGESTIONS,
  agentName = DEFAULT_AGENT_NAME,
  agentDescription = "Reads your reports",
  placeholder = "Ask about a report",
  onNewChat,
  error,
  onRetry,
  disabled = false,
  headerActions,
  compact = false,
  className,
  ...props
}: ChatScreenProps) {
  const { scrollRef, contentRef, onScroll } = useStickToBottom(messages.length)
  const generating = status === "generating"
  const send = (text: string) => onSend?.(text)

  return (
    <section data-slot="chat-assistant" data-status={status} aria-label={`Chat with ${agentName}`} className={cn("@container flex h-[640px] max-h-dvh w-full flex-col bg-muted/40 dark:bg-background", className)} {...props}>
      <ChatHeader agentName={agentName} description={agentDescription} generating={generating} onNewChat={onNewChat} actions={headerActions} />
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 @md:px-6">
        <div ref={contentRef} className={cn(COLUMN_CLASS, "flex min-h-full flex-col py-6")}>
          {messages.length === 0 && !generating ? (
            <ChatStarter agentName={agentName} suggestions={suggestions} disabled={disabled} onPick={send} compact={compact} />
          ) : (
            <ChatThread messages={messages} status={status} />
          )}
        </div>
      </div>
      <div className="px-4 pb-4 @md:px-6 @md:pb-6">
        <div className={cn(COLUMN_CLASS, "flex flex-col gap-2")}>
          {error ? <ChatError message={error} onRetry={onRetry} /> : null}
          <ChatComposer label={`Message ${agentName}`} placeholder={placeholder} generating={generating} disabled={disabled} onSend={send} onStop={onStop} />
        </div>
      </div>
    </section>
  )
}

/** The chat's own props go to the panel, and everything else stays with the outer block, which is the thing placed on the page. */
function splitChatProps<Rest extends object>(props: ChatConversation & Rest) {
  const { messages, status, onSend, onStop, suggestions, agentName, agentDescription, placeholder, onNewChat, error, onRetry, disabled, ...rest } = props
  const chat: ChatConversation = { messages, status, onSend, onStop, suggestions, agentName, agentDescription, placeholder, onNewChat, error, onRetry, disabled }
  return { chat, rest }
}

export { ChatScreen, DEFAULT_AGENT_NAME, splitChatProps, type ChatConversation, type ChatOptions, type ChatScreenProps }
