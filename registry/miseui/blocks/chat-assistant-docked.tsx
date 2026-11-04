import type * as React from "react"
import { useRef } from "react"
import { MessageCircle, X } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { useChatOpen, useChatPanelFocus, type ChatPanelOptions } from "@/registry/miseui/blocks/chat-assistant-panel-state"
import { ChatScreen, DEFAULT_AGENT_NAME, splitChatProps, type ChatConversation } from "@/registry/miseui/blocks/chat-assistant-screen"
import { ChatSampleWork } from "@/registry/miseui/blocks/chat-assistant-work"

type ChatDockedProps = React.ComponentProps<"section"> & ChatConversation & ChatPanelOptions

/** The way back to the panel: a narrow strip beside the work when wide, a short bar under it when narrow. Never over the work. */
function DockedOpener({ openerRef, agentName, onOpen }: { openerRef: React.RefObject<HTMLButtonElement | null>; agentName: string; onOpen: () => void }) {
  return (
    <div className="flex shrink-0 justify-end border-t bg-background p-2 dark:bg-card @3xl:flex-col @3xl:justify-start @3xl:border-t-0 @3xl:border-l">
      <Button ref={openerRef} variant="outline" aria-expanded={false} className="pointer-coarse:h-10 @3xl:size-10 @3xl:p-0" onClick={onOpen}>
        <MessageCircle aria-hidden="true" />
        <span className="@3xl:sr-only">Ask {agentName}</span>
      </Button>
    </div>
  )
}

function ChatDocked({ open, defaultOpen = true, onOpenChange, ...props }: ChatDockedProps) {
  const { chat, rest } = splitChatProps(props)
  const { children, className, ...root } = rest
  const [isOpen, setOpen] = useChatOpen({ open, defaultOpen, onOpenChange })
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  useChatPanelFocus(isOpen, panelRef, openerRef)
  const agentName = chat.agentName ?? DEFAULT_AGENT_NAME

  return (
    <section
      data-slot="chat-assistant"
      data-variant="docked"
      data-status={chat.status}
      data-open={isOpen ? "true" : "false"}
      className={cn("@container flex h-[640px] max-h-dvh w-full flex-col bg-muted dark:bg-background", className)}
      {...root}
    >
      {/* Its own element: a container query only sees ancestors, so the root cannot change its own direction. */}
      <div className="flex min-h-0 flex-1 flex-col @3xl:flex-row">
        {/* A tab stop, because it scrolls and may hold nothing else a keyboard could reach. */}
        <div
          data-slot="chat-assistant-work"
          role="region"
          aria-label="Your work"
          tabIndex={0}
          className="min-h-0 min-w-0 flex-[2_1_0%] overflow-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 @3xl:flex-1"
        >
          {children ?? <ChatSampleWork />}
        </div>
        {/* Kept mounted while closed: a half-written message and the thread are still there when it comes back. */}
        <div
          ref={panelRef}
          hidden={!isOpen}
          className={cn("min-h-0 min-w-0 flex-[3_1_0%] flex-col border-t @3xl:w-[400px] @3xl:flex-none @3xl:border-t-0 @3xl:border-l", isOpen ? "flex" : "hidden")}
        >
          <ChatScreen
            {...chat}
            data-slot="chat-assistant-panel"
            compact
            className="h-auto max-h-none min-h-0 flex-1 bg-background pointer-coarse:[&_button]:min-h-10 pointer-coarse:[&_button]:min-w-10 dark:bg-card"
            headerActions={
              <Button variant="ghost" size="icon" aria-label={`Close ${agentName}`} className="pointer-coarse:size-10" onClick={() => setOpen(false)}>
                <X aria-hidden="true" />
              </Button>
            }
          />
        </div>
        {isOpen ? null : <DockedOpener openerRef={openerRef} agentName={agentName} onOpen={() => setOpen(true)} />}
      </div>
    </section>
  )
}

export { ChatDocked, type ChatDockedProps }
