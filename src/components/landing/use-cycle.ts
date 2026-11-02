import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"

/** Index that advances on a timer. Reduced motion holds the first frame: an autoplaying page is the thing people asked to stop. */
export function useCycle(length: number, intervalMs: number) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => setIndex((current) => (current + 1) % length), intervalMs)
    return () => window.clearInterval(id)
  }, [reduceMotion, length, intervalMs])

  return index
}
