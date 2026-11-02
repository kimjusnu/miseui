import { useEffect, useState } from "react"
import { VoiceWave } from "@/registry/miseui/ui/voice-wave"

const TICK_MS = 120
/** Two overlapping sines read as speech: a slow swell with a faster wobble on top. */
const SLOW_RADIANS_PER_TICK = 0.35
const FAST_RADIANS_PER_TICK = 1.1
const FAST_SHARE = 0.3

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

  const level = levelAt(tick)

  return (
    <div className="flex flex-wrap items-center gap-8">
      <VoiceWave active level={level} className="h-8" />
      <VoiceWave active level={level} bars={9} className="h-8" />
      <VoiceWave active={false} className="h-8" />
    </div>
  )
}
