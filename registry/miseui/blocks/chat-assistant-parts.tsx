import type * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { AgentAvatar } from "@/registry/miseui/ui/agent-avatar"
import { Button } from "@/registry/miseui/ui/button"
import type { ReasoningStep } from "@/registry/miseui/ui/reasoning-steps"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import type { ToolCallStatus } from "@/registry/miseui/ui/tool-call-card"

type ChatStatus = "idle" | "generating"

interface ChatToolCall {
  id: string
  name: string
  status: ToolCallStatus
  input?: unknown
  output?: unknown
  durationMs?: number
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  /** Assistant turns only: what the model did on the way to this answer. */
  reasoning?: readonly ReasoningStep[]
  tools?: readonly ChatToolCall[]
}

/** Header, thread and composer share this column, so all three start on one left edge. */
const COLUMN_CLASS = "mx-auto w-full max-w-2xl"
const BODY_CLASS = "text-[15px] leading-relaxed text-pretty"

interface ChatHeaderProps {
  agentName: string
  description: string
  generating: boolean
  onNewChat?: () => void
  /** Extra controls after New chat, such as a way to close a panel. */
  actions?: React.ReactNode
}

function ChatHeader({ agentName, description, generating, onNewChat, actions }: ChatHeaderProps) {
  return (
    <header className="border-b px-4 py-3 @md:px-6">
      <div className={cn(COLUMN_CLASS, "flex items-center gap-3")}>
        <AgentAvatar seed={agentName} size={32} label={agentName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-[15px] font-medium">{agentName}</h2>
          <p className="truncate text-[13px] text-muted-foreground">
            {generating ? <ShimmerText>Working on it</ShimmerText> : description}
          </p>
        </div>
        {onNewChat ? (
          <Button variant="ghost" size="sm" className={actions ? "pointer-coarse:h-10" : undefined} onClick={onNewChat}>
            New chat
          </Button>
        ) : null}
        {actions}
      </div>
    </header>
  )
}

interface ChatStarterProps {
  agentName: string
  suggestions: readonly string[]
  disabled: boolean
  onPick: (suggestion: string) => void
  /** A narrow panel: the headline would otherwise take the whole thread. */
  compact?: boolean
}

/** Sits at the bottom of the thread, just above the composer, so sending the first message moves nothing. */
function ChatStarter({ agentName, suggestions, disabled, onPick, compact = false }: ChatStarterProps) {
  return (
    <div className="mt-auto flex flex-col gap-6">
      <h3 className={cn("text-display leading-[1.12]! text-balance", compact ? "text-xl" : "text-3xl @2xl:text-4xl")}>
        What should we look at?{" "}
        <span className="text-muted-foreground">{agentName} reads your reports and answers with the numbers.</span>
      </h3>
      {suggestions.length > 0 ? (
        <ul className="-mx-3 flex flex-col">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(suggestion)}
                className="group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[15px] text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              >
                {suggestion}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 shrink-0 opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-mise) group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ChatError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 text-[13px] text-destructive">
      <p className="text-pretty">{message}</p>
      {onRetry ? (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export { BODY_CLASS, ChatError, ChatHeader, ChatStarter, COLUMN_CLASS, type ChatMessage, type ChatStatus, type ChatToolCall }
