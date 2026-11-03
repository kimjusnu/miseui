import type * as React from "react"
import { useEffect, useRef } from "react"
import { orbitPose, orbitSlots, poseTransform, ringVelocity, turnToTop, type OrbitVariant } from "@/registry/miseui/ui/orbiting-circles-math"

const CATCH_EASE_SECONDS = 0.14
const BRING_EASE_SECONDS = 0.18

interface OrbitLoopOptions {
  variant: OrbitVariant
  count: number
  seconds: number
  /** Running at all: on screen, tab visible, not paused, not reduced motion. */
  playing: boolean
  /** Reduced motion: a still frame arranged to be read. */
  still: boolean
  /** Someone is on an item: slow to a stop, so the thing they reached for stays under them. */
  caught: boolean
}

export function writePoses(nodes: readonly (HTMLElement | null)[], variant: OrbitVariant, count: number, turns: readonly number[], still: boolean) {
  const slots = orbitSlots(variant, count, still)
  nodes.forEach((node, index) => {
    const slot = slots[index]
    if (!node || !slot) return
    const pose = orbitPose(variant, slot, turns[slot.ring] ?? 0)
    node.style.transform = poseTransform(pose)
    if (variant !== "tilted") return
    node.style.opacity = pose.opacity.toFixed(3)
    const layer = pose.behind ? "1" : "3"
    // A z-index write dirties paint, so only when the item actually crosses from one side to the other.
    if (node.style.zIndex !== layer) node.style.zIndex = layer
  })
}

export interface OrbitControl {
  /** Eases the orbit until `index` sits at the top. Reads the live turn, which only this loop knows. */
  bringToTop: (index: number) => void
  /** Current horizontal and vertical offset of an item, for placing its label. */
  poseOf: (index: number) => { x: number; y: number }
}

/**
 * Turns the orbit by writing styles directly, one frame loop per component. Each orbit keeps its own turn, and speed
 * eases toward zero when caught, so an item stops under a pointer rather than being snatched away from it.
 */
export function useOrbitLoop(nodesRef: React.RefObject<(HTMLElement | null)[]>, { variant, count, seconds, playing, still, caught }: OrbitLoopOptions): OrbitControl {
  const turnsRef = useRef<number[]>([0, 0, 0])
  const speedRef = useRef(1)
  const bringRef = useRef(0)

  useEffect(() => {
    writePoses(nodesRef.current, variant, count, turnsRef.current, still)
  }, [nodesRef, variant, count, still])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last: number | null = null
    const tick = (now: number) => {
      const elapsed = last === null ? 0 : Math.min((now - last) / 1000, 0.05)
      last = now
      const aim = caught ? 0 : 1
      speedRef.current += (aim - speedRef.current) * (1 - Math.exp(-elapsed / CATCH_EASE_SECONDS))
      const bring = bringRef.current * (1 - Math.exp(-elapsed / BRING_EASE_SECONDS))
      bringRef.current -= bring
      turnsRef.current = turnsRef.current.map((turn, ring) => turn + ringVelocity(ring, seconds) * speedRef.current * elapsed + bring)
      writePoses(nodesRef.current, variant, count, turnsRef.current, still)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [nodesRef, variant, count, seconds, playing, still, caught])

  return {
    bringToTop: (index) => {
      const slot = orbitSlots(variant, count, still)[index]
      if (!slot) return
      const needed = turnToTop(slot.start, turnsRef.current[slot.ring] ?? 0)
      if (playing) {
        bringRef.current = needed
        return
      }
      // Not running, so no frame would carry it over. A focused item must still come into view.
      turnsRef.current = turnsRef.current.map((turn) => turn + needed)
      writePoses(nodesRef.current, variant, count, turnsRef.current, still)
    },
    poseOf: (index) => {
      const slot = orbitSlots(variant, count, still)[index]
      if (!slot) return { x: 0, y: 0 }
      return orbitPose(variant, slot, turnsRef.current[slot.ring] ?? 0)
    },
  }
}
