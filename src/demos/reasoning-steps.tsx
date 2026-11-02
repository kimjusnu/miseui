import { useEffect, useState } from "react"
import { ReasoningSteps, type ReasoningStep, type ReasoningStepStatus } from "@/registry/miseui/ui/reasoning-steps"

const LABELS: readonly { id: string; label: string; detail?: string }[] = [
  { id: "read", label: "Reading the question" },
  { id: "search", label: "Searching docs", detail: "3 sources so far" },
  { id: "compare", label: "Comparing the two APIs" },
  { id: "write", label: "Writing the answer" },
]
const STEP_MS = 1600
/** Pause with every step done before the demo starts over. */
const RESTART_MS = 3000

function statusFor(index: number, activeIndex: number): ReasoningStepStatus {
  if (index < activeIndex) return "done"
  if (index === activeIndex) return "active"
  return "pending"
}

export function Demo() {
  const [activeIndex, setActiveIndex] = useState(0)
  const finished = activeIndex >= LABELS.length

  useEffect(() => {
    const id = window.setTimeout(
      () => setActiveIndex((current) => (current >= LABELS.length ? 0 : current + 1)),
      finished ? RESTART_MS : STEP_MS,
    )
    return () => window.clearTimeout(id)
  }, [activeIndex, finished])

  const steps: ReasoningStep[] = LABELS.map((step, index) => ({ ...step, status: statusFor(index, activeIndex) }))

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ReasoningSteps steps={steps} defaultOpen />
      <ReasoningSteps steps={steps} />
    </div>
  )
}
