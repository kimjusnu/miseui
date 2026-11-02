import { useEffect, useState } from "react"
import { VoiceGlow } from "@/registry/miseui/ui/voice-glow"

const TICK_MS = 120
/** A slow swell with a quicker wobble on top reads as someone speaking. */
const SLOW_RADIANS_PER_TICK = 0.3
const FAST_RADIANS_PER_TICK = 1.15
const FAST_SHARE = 0.35

function levelAt(tick: number) {
  const slow = (Math.sin(tick * SLOW_RADIANS_PER_TICK) + 1) / 2
  const fast = (Math.sin(tick * FAST_RADIANS_PER_TICK) + 1) / 2
  return slow * (1 - FAST_SHARE) + fast * FAST_SHARE
}

export function Demo() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((current) => current + 1), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-10">
      <VoiceGlow active level={levelAt(tick)} />
      <VoiceGlow active={false} size={80} />
    </div>
  )
}
