import type * as React from "react"
import { useClipboard, copyText, type ClipboardStatus } from "@/registry/miseui/ui/clipboard-state"
import { BlockBody, CopyButton, FieldBody, InlineBody } from "@/registry/miseui/ui/clipboard-parts"
import { cn } from "@/registry/miseui/lib/utils"

type ClipboardVariant = "icon" | "inline" | "field" | "block"
type ClipboardEffect = "morph"

const ROOT_CLASS: Record<ClipboardVariant, string> = {
  icon: "inline-flex",
  inline: "grid w-full min-w-0 gap-1",
  field: "grid w-full min-w-0 gap-1",
  block: "grid w-full min-w-0 gap-1",
}
const BUTTON_SHAPE = { icon: "icon", inline: "icon", field: "joined", block: "header" } as const

type ClipboardProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** The exact text that lands on the clipboard. */
  value: string
  /** `icon` a lone button, `inline` a code line, `field` a read-only input with a button, `block` several lines under a heading. */
  variant?: ClipboardVariant
  /** `morph` turns the copy glyph into the check instead of swapping it. */
  effect?: ClipboardEffect
  /** The button name. */
  label?: string
  copiedLabel?: string
  /** Shown when the browser refuses. The text is selected at that moment, so it should say to copy by hand. */
  failedLabel?: string
  /** Name of the text for assistive tech in `inline`, `field` and `block`. */
  valueLabel?: string
  /** Heading of `block`, usually a file name. */
  title?: React.ReactNode
  disabled?: boolean
  /** How long the check stays, in milliseconds. */
  resetAfter?: number
  onCopied?: () => void
  onFailed?: () => void
}

function Clipboard({
  value,
  variant = "icon",
  effect,
  label = "Copy",
  copiedLabel = "Copied",
  failedLabel = "Could not copy. The text is selected, so copy it by hand.",
  valueLabel = "Text to copy",
  title,
  disabled,
  resetAfter = 2000,
  onCopied,
  onFailed,
  className,
  ...props
}: ClipboardProps) {
  const { status, copy, textRef } = useClipboard({ value, resetAfter, onCopied, onFailed })
  const button = (
    <CopyButton
      {...{ status, label, copiedLabel, disabled }}
      shape={BUTTON_SHAPE[variant]}
      morph={effect === "morph"}
      onClick={copy}
    />
  )
  const body = { value, valueLabel, textRef, button }
  const message = status === "copied" ? copiedLabel : status === "failed" ? failedLabel : ""
  const showFailure = status === "failed" && variant !== "icon"
  return (
    <div
      data-slot="clipboard"
      data-variant={variant}
      data-effect={effect}
      data-state={status}
      className={cn(ROOT_CLASS[variant], className)}
      {...props}
    >
      {variant === "icon" ? button : null}
      {variant === "inline" ? <InlineBody {...body} /> : null}
      {variant === "field" ? <FieldBody {...body} disabled={disabled} /> : null}
      {variant === "block" ? <BlockBody {...body} title={title} /> : null}
      <span
        role="status"
        data-slot="clipboard-status"
        className={showFailure ? "text-[13px] leading-5 text-destructive" : "sr-only"}
      >
        {message}
      </span>
    </div>
  )
}

export { Clipboard, copyText, type ClipboardProps, type ClipboardVariant, type ClipboardEffect, type ClipboardStatus }
