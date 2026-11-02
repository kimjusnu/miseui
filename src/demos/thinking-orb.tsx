import { useEffect, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { ThinkingOrb, type OrbState } from "@/registry/miseui/ui/thinking-orb"

const STATES: readonly OrbState[] = ["idle", "listening", "thinking", "speaking"]
const CYCLE_MS = 3200
const DEMO_SIZE_PX = 72

export function Demo() {
  const [state, setState] = useState<OrbState>("listening")
  const [cycling, setCycling] = useState(true)

  useEffect(() => {
    if (!cycling) return
    const id = window.setInterval(
      () => setState((current) => STATES[(STATES.indexOf(current) + 1) % STATES.length]),
      CYCLE_MS,
    )
    return () => window.clearInterval(id)
  }, [cycling])

  const choose = (next: OrbState) => {
    setCycling(false)
    setState(next)
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <ThinkingOrb state={state} size={DEMO_SIZE_PX} />
      <div className="flex flex-wrap justify-center gap-1">
        {STATES.map((option) => (
          <Button
            key={option}
            variant={option === state ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={option === state}
            onClick={() => choose(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}
