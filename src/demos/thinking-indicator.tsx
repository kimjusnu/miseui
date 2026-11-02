import { useEffect, useState } from "react"
import { ThinkingIndicator, type ThinkingState } from "@/registry/miseui/ui/thinking-indicator"

const SEQUENCE: readonly ThinkingState[] = ["thinking", "searching", "writing", "done"]
const STEP_MS = 2200

export function Demo() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SEQUENCE.length), STEP_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <ThinkingIndicator state={SEQUENCE[index]} size="lg" />
      <div className="flex flex-wrap gap-6 text-muted-foreground">
        <ThinkingIndicator state="thinking" size="sm" />
        <ThinkingIndicator state="writing" label="Drafting reply…" size="sm" />
        <ThinkingIndicator state="error" size="sm" />
      </div>
    </div>
  )
}
