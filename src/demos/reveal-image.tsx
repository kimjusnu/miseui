import { useEffect, useState } from "react"
import { RevealImage, type RevealMode } from "@/registry/miseui/ui/reveal-image"

const MODES: readonly RevealMode[] = ["blur", "pixelate", "wipe"]
const TICK_MS = 100
const STEP = 0.025
/** Rest on the finished image for a moment before the next arrival. */
const HOLD_TICKS = 14
const CYCLE_TICKS = Math.ceil(1 / STEP) + HOLD_TICKS

/** A small inline scene with hard edges and a gradient, so every mode has something to work on. */
const SCENE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20294a"/><stop offset="1" stop-color="#d8a26a"/></linearGradient></defs>
  <rect width="320" height="200" fill="url(#sky)"/>
  <circle cx="226" cy="118" r="34" fill="#f3c47f"/>
  <path d="M0 150C60 120 110 170 170 140S270 120 320 150V200H0Z" fill="#2b2f3a"/>
  <path d="M0 175C80 150 140 190 320 165V200H0Z" fill="#171a22"/>
</svg>`
const SRC = `data:image/svg+xml,${encodeURIComponent(SCENE_SVG)}`

export function Demo() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((current) => current + 1), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const progress = Math.min(1, (tick % CYCLE_TICKS) * STEP)

  return (
    <div className="flex flex-wrap gap-5">
      {MODES.map((mode) => (
        <figure key={mode} className="flex flex-col gap-2">
          <RevealImage
            src={SRC}
            alt={`Generated scene, ${mode} reveal`}
            mode={mode}
            progress={progress}
            width={160}
            height={100}
            className="rounded-lg"
          />
          <figcaption className="text-xs text-muted-foreground">{mode}</figcaption>
        </figure>
      ))}
    </div>
  )
}
