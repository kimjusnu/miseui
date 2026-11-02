import { useEffect, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"

const STEPS = ["Thinking…", "Reading 12 files…", "Drafting reply…"] as const
const STEP_MS = 2700
const DONE_LABEL = "Done"
const SLOW_SWEEP_SECONDS = 3.4

export function Demo() {
  const [index, setIndex] = useState(0)
  const [working, setWorking] = useState(true)

  useEffect(() => {
    if (!working) return
    const id = window.setInterval(() => setIndex((current) => (current + 1) % STEPS.length), STEP_MS)
    return () => window.clearInterval(id)
  }, [working])

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Button variant="outline" size="sm" onClick={() => setWorking((value) => !value)}>
        {working ? "Finish" : "Start again"}
      </Button>
      <div className="flex flex-col gap-2">
        <ShimmerText active={working} className="text-[15px] font-medium">
          {working ? STEPS[index] : DONE_LABEL}
        </ShimmerText>
        <ShimmerText duration={SLOW_SWEEP_SECONDS} className="text-sm">
          {`Slower pass, ${SLOW_SWEEP_SECONDS} s`}
        </ShimmerText>
      </div>
    </div>
  )
}
