import type * as React from "react"
import { useEffect, useRef, useState } from "react"

interface ChatPanelOptions {
  /** Whether the chat is showing. Leave it out and the block keeps this itself. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function useChatOpen({ open, defaultOpen = false, onOpenChange }: ChatPanelOptions) {
  const [internal, setInternal] = useState(defaultOpen)
  const current = open ?? internal
  const setOpen = (next: boolean) => {
    setInternal(next)
    onOpenChange?.(next)
  }
  return [current, setOpen] as const
}

/**
 * Opening puts the cursor in the composer, and closing hands focus back to the button that opens it again.
 * Only on a change: a panel that is open from the start must not steal focus from the page.
 */
function useChatPanelFocus(open: boolean, panel: React.RefObject<HTMLElement | null>, opener: React.RefObject<HTMLElement | null>) {
  const previousRef = useRef(open)
  useEffect(() => {
    if (previousRef.current === open) return
    previousRef.current = open
    if (open) panel.current?.querySelector("textarea")?.focus()
    else opener.current?.focus()
  }, [open, panel, opener])
}

export { useChatOpen, useChatPanelFocus, type ChatPanelOptions }
