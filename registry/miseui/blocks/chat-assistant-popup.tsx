import type * as React from "react"
import { useId, useRef, useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import type { ChatStatus } from "@/registry/miseui/blocks/chat-assistant-parts"
import { useChatOpen, useChatPanelFocus, type ChatPanelOptions } from "@/registry/miseui/blocks/chat-assistant-panel-state"
import { ChatScreen, DEFAULT_AGENT_NAME, splitChatProps, type ChatConversation } from "@/registry/miseui/blocks/chat-assistant-screen"
import { ChatSampleWork } from "@/registry/miseui/blocks/chat-assistant-work"

const WINDOW_SHOWN = { opacity: 1, scale: 1, y: 0 }
const WINDOW_GONE = { opacity: 0, scale: 0.96, y: 8 }
const WINDOW_GONE_REDUCED = { opacity: 0, scale: 1, y: 0 }

type ChatPopupProps = React.ComponentProps<"section"> & ChatConversation & ChatPanelOptions

/** A reply that finishes while the window is closed would otherwise go unnoticed. */
function useMissedReply(open: boolean, status: ChatStatus) {
  const [previous, setPrevious] = useState(status)
  const [missed, setMissed] = useState(false)
  if (previous !== status) {
    setPrevious(status)
    if (!open && previous === "generating" && status === "idle") setMissed(true)
  }
  if (open && missed) setMissed(false)
  return missed
}

function launcherLabel(open: boolean, missed: boolean, generating: boolean, agentName: string) {
  if (open) return "Hide chat"
  if (missed) return `New reply from ${agentName}`
  return generating ? `${agentName} is working` : `Ask ${agentName}`
}

/** Stays mounted through the exit, then leaves the layout. Under reduced motion there is no exit to wait for. */
function useWindowExit(open: boolean) {
  const reduceMotion = useReducedMotion()
  const [exited, setExited] = useState(!open)
  if (open && exited) setExited(false)
  return {
    reduceMotion,
    gone: !open && (exited || Boolean(reduceMotion)),
    onAnimationComplete: () => {
      if (!open) setExited(true)
    },
  }
}

interface PopupWindowProps {
  id: string
  panelRef: React.RefObject<HTMLDivElement | null>
  open: boolean
  agentName: string
  chat: ChatConversation
  onClose: () => void
}

function PopupWindow({ id, panelRef, open, agentName, chat, onClose }: PopupWindowProps) {
  const exit = useWindowExit(open)
  return (
    <motion.div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-label={`Chat with ${agentName}`}
      aria-hidden={!open}
      inert={!open}
      initial={false}
      animate={open ? WINDOW_SHOWN : exit.reduceMotion ? WINDOW_GONE_REDUCED : WINDOW_GONE}
      transition={exit.reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
      onAnimationComplete={exit.onAnimationComplete}
      style={{ transformOrigin: "100% 100%" }}
      className={cn(
        "absolute inset-2 z-10 flex-col overflow-hidden rounded-2xl border bg-background shadow-[0_24px_48px_-16px_oklch(0_0_0/24%)] dark:bg-card",
        "@md:inset-auto @md:right-4 @md:bottom-20 @md:h-[min(520px,calc(100%-96px))] @md:w-[384px]",
        exit.gone ? "hidden" : "flex",
      )}
    >
      <ChatScreen
        {...chat}
        data-slot="chat-assistant-panel"
        aria-label={undefined}
        compact
        className="h-auto max-h-none min-h-0 flex-1 bg-transparent pointer-coarse:[&_button]:min-h-10 pointer-coarse:[&_button]:min-w-10 dark:bg-transparent"
        headerActions={
          <Button variant="ghost" size="icon" aria-label="Close chat" className="pointer-coarse:size-10" onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        }
      />
    </motion.div>
  )
}

function ChatPopup({ open, defaultOpen = false, onOpenChange, ...props }: ChatPopupProps) {
  const { chat, rest } = splitChatProps(props)
  const { children, className, onKeyDown, ...root } = rest
  const [isOpen, setOpen] = useChatOpen({ open, defaultOpen, onOpenChange })
  const windowId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  useChatPanelFocus(isOpen, panelRef, launcherRef)
  const missed = useMissedReply(isOpen, chat.status)
  const agentName = chat.agentName ?? DEFAULT_AGENT_NAME

  const keyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event)
    // isComposing: Escape cancels a half-typed Korean or Japanese syllable, and must not close the window with it.
    if (event.key !== "Escape" || !isOpen || event.nativeEvent.isComposing) return
    setOpen(false)
  }

  return (
    // The block is the frame: everything is placed against it, so a preview or a page section contains the window.
    <section
      data-slot="chat-assistant"
      data-variant="popup"
      data-status={chat.status}
      data-open={isOpen ? "true" : "false"}
      className={cn("@container relative h-[640px] max-h-dvh w-full overflow-hidden bg-muted dark:bg-background", className)}
      onKeyDown={keyDown}
      {...root}
    >
      {/* The bottom padding keeps the last row of the page clear of the launcher. */}
      <div data-slot="chat-assistant-work" role="region" aria-label="Your work" tabIndex={0} className="size-full overflow-auto overscroll-contain pb-20 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50">
        {children ?? <ChatSampleWork />}
      </div>
      <PopupWindow id={windowId} panelRef={panelRef} open={isOpen} agentName={agentName} chat={chat} onClose={() => setOpen(false)} />
      {/* Quiet while open, when Send is the accent. Hidden when the window fills a narrow block: the header has a close button there. */}
      <Button
        ref={launcherRef}
        variant={isOpen ? "outline" : "mise"}
        size="lg"
        aria-expanded={isOpen}
        aria-controls={windowId}
        onClick={() => setOpen(!isOpen)}
        className={cn("absolute right-4 bottom-4 z-10 max-w-[calc(100%-32px)] shadow-md", isOpen && "@max-md:hidden")}
      >
        {isOpen ? <X aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
        <span className="truncate">{launcherLabel(isOpen, missed, chat.status === "generating", agentName)}</span>
      </Button>
    </section>
  )
}

export { ChatPopup, type ChatPopupProps }
