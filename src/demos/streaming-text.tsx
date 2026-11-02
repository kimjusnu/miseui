import { useEffect, useState } from "react"
import { StreamingText } from "@/registry/miseui/ui/streaming-text"

const SENTENCES: readonly string[] = [
  "Mise UI ships components that explain why they look the way they do.",
  " Each one names the principle behind its motion, timing and colour.",
  " Install any of them with the shadcn CLI and keep the source.",
]
const APPEND_MS = 2600
/** Pause after the last sentence before the demo starts over. */
const RESTART_MS = 4000

export function Demo() {
  const [count, setCount] = useState(1)
  const finished = count >= SENTENCES.length

  useEffect(() => {
    const id = window.setTimeout(
      () => setCount((current) => (current >= SENTENCES.length ? 1 : current + 1)),
      finished ? RESTART_MS : APPEND_MS,
    )
    return () => window.clearTimeout(id)
  }, [count, finished])

  return (
    <div className="flex max-w-prose flex-col gap-4 text-sm">
      <StreamingText text={SENTENCES.slice(0, count).join("")} />
      <StreamingText
        text="Faster, and without a caret."
        speed={120}
        cursor={false}
        className="text-muted-foreground"
      />
    </div>
  )
}
