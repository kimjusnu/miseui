import { useEffect, useRef, useState } from "react"

type ClipboardStatus = "idle" | "copied" | "failed"

/** Failure stays up longer: the person now has a manual step to do and needs time to read about it. */
const FAILED_HOLD_FACTOR = 3

/** Never rejects. The API is missing on plain http and refused without a user gesture or with permissions denied. */
async function copyText(text: string) {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Leaves the text selected, so the person whose browser refused can still copy it by hand. */
function selectText(node: HTMLElement | null) {
  if (!node) return
  if (node instanceof HTMLInputElement) node.select()
  else window.getSelection()?.selectAllChildren(node)
}

interface UseClipboardOptions {
  value: string
  resetAfter: number
  onCopied?: () => void
  onFailed?: () => void
}

function useClipboard({ value, resetAfter, onCopied, onFailed }: UseClipboardOptions) {
  const [status, setStatus] = useState<ClipboardStatus>("idle")
  const timer = useRef<number | undefined>(undefined)
  const textRef = useRef<HTMLElement>(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    const copied = await copyText(value)
    window.clearTimeout(timer.current)
    setStatus(copied ? "copied" : "failed")
    const hold = copied ? resetAfter : resetAfter * FAILED_HOLD_FACTOR
    timer.current = window.setTimeout(() => setStatus("idle"), hold)
    if (copied) {
      onCopied?.()
      return
    }
    selectText(textRef.current)
    onFailed?.()
  }

  return { status, copy, textRef }
}

export { copyText, selectText, useClipboard, type ClipboardStatus }
