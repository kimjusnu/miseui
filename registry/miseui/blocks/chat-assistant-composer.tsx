import type * as React from "react"
import { useRef, useState } from "react"
import { ArrowUp, Square } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_PRESS } from "@/registry/miseui/lib/motion"
import { BeamBorder } from "@/registry/miseui/ui/beam-border"
import { Button } from "@/registry/miseui/ui/button"
import { Textarea } from "@/registry/miseui/ui/textarea"

const ACTION_ICON_START = { scale: 0.6, opacity: 0 }
const ACTION_ICON_END = { scale: 1, opacity: 1 }

interface ChatComposerProps {
  label: string
  placeholder: string
  generating: boolean
  disabled: boolean
  onSend: (text: string) => void
  onStop?: () => void
}

function ChatComposer({ label, placeholder, generating, disabled, onSend, onStop }: ChatComposerProps) {
  const [draft, setDraft] = useState("")
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const canSend = !generating && !disabled && draft.trim().length > 0

  const send = () => {
    if (!canSend) return
    onSend(draft.trim())
    setDraft("")
    fieldRef.current?.focus()
  }
  const stop = () => {
    onStop?.()
    fieldRef.current?.focus()
  }
  const sendOnEnter = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing: Enter confirms a Korean or Japanese syllable; sending here would post half a word.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  return (
    <BeamBorder active={generating} className="rounded-2xl">
      <div className="flex flex-col gap-2 rounded-[inherit] border bg-popover p-3 shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--mise)_24%,oklch(0_0_0/40%))] transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise) focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <Textarea
          ref={fieldRef}
          aria-label={label}
          rows={1}
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={sendOnEnter}
          className="max-h-48 min-h-12 resize-none overflow-y-auto rounded-none border-0 bg-transparent px-1 py-1 leading-relaxed shadow-none focus-visible:ring-0 md:text-[15px]"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="hidden pl-1 text-[13px] text-muted-foreground @md:block">Enter to send, Shift + Enter for a new line</p>
          <ComposerAction generating={generating} canSend={canSend} onSend={send} onStop={stop} />
        </div>
      </div>
    </BeamBorder>
  )
}

interface ComposerActionProps {
  generating: boolean
  canSend: boolean
  onSend: () => void
  onStop: () => void
}

/**
 * One button that changes job, not two that swap: it keeps keyboard focus across the change. Always
 * type="button", because a type that flips mid-click could submit a form right after Stop.
 */
function ComposerAction({ generating, canSend, onSend, onStop }: ComposerActionProps) {
  const reduceMotion = useReducedMotion()
  return (
    <Button
      type="button"
      size="icon"
      variant={generating ? "secondary" : "mise"}
      aria-label={generating ? "Stop generating" : "Send message"}
      disabled={!generating && !canSend}
      onClick={generating ? onStop : onSend}
      className="ml-auto"
    >
      <motion.span
        key={generating ? "stop" : "send"}
        aria-hidden="true"
        className="grid place-items-center"
        initial={reduceMotion ? false : ACTION_ICON_START}
        animate={ACTION_ICON_END}
        transition={SPRING_PRESS}
      >
        {generating ? <Square className="size-3.5 fill-current" /> : <ArrowUp />}
      </motion.span>
    </Button>
  )
}

export { ChatComposer }
