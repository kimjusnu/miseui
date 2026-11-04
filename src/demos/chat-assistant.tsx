import { ChatAssistant, type ChatAssistantVariant } from "@/registry/miseui/blocks/chat-assistant"

export function Demo({ variant }: { variant?: string }) {
  // Opens the popup from the first frame: a closed one is a page with a button, which shows nothing of the design.
  return <ChatAssistant variant={variant as ChatAssistantVariant | undefined} defaultOpen={variant === "popup" ? true : undefined} />
}
