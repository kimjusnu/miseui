import type * as React from "react"
import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"
import { dockHasRoom, dockLayout, dockMaxSpread, type DockSlot } from "@/registry/miseui/ui/dock-math"
import { isFinePointer } from "@/registry/miseui/ui/pointer-fine"

/** Critical damping. useSpring takes physics, not a duration: 0.2 s to follow, 0.35 s to arrive and leave. */
const FOLLOW_SPRING = { stiffness: 700, damping: 53, mass: 1 }
const PRESENCE_SPRING = { stiffness: 322, damping: 36, mass: 1 }
const SLOT_SELECTOR = "[data-slot='dock-slot']"
const SETTLED = 0.002

function matchesFocusVisible(element: Element) {
  try {
    return element.matches(":focus-visible")
  } catch {
    return false
  }
}

function readSlots(root: HTMLElement, vertical: boolean): readonly DockSlot[] {
  const box = root.getBoundingClientRect()
  return [...root.querySelectorAll(SLOT_SELECTOR)].map((slot) => {
    const rect = slot.getBoundingClientRect()
    return vertical
      ? { centre: rect.top + rect.height / 2 - box.top, size: rect.height }
      : { centre: rect.left + rect.width / 2 - box.left, size: rect.width }
  })
}

/** Slots do not move, so this stays true while tiles are magnified. A row that scrolls would clip them, so it never magnifies. */
function rowFits(list: HTMLElement, vertical: boolean) {
  const slots = [...list.querySelectorAll(SLOT_SELECTOR)]
  const first = slots[0]?.getBoundingClientRect()
  const last = slots[slots.length - 1]?.getBoundingClientRect()
  if (!first || !last) return true
  const style = getComputedStyle(list)
  const padding = (parseFloat(vertical ? style.paddingTop : style.paddingLeft) || 0) + (parseFloat(vertical ? style.paddingBottom : style.paddingRight) || 0)
  const needed = (vertical ? last.bottom - first.top : last.right - first.left) + padding
  return needed <= (vertical ? list.clientHeight : list.clientWidth) + 1
}

function useRowFits(listRef: React.RefObject<HTMLElement | null>, vertical: boolean) {
  // Starts as a scroller: a server-rendered row too long for its box must not widen the page before hydration.
  const [fits, setFits] = useState(false)
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const check = () => setFits(rowFits(list, vertical))
    check()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(check)
    observer.observe(list)
    return () => observer.disconnect()
  }, [listRef, vertical])
  return fits
}

function writeRow(root: HTMLElement, surface: HTMLElement | null, slots: readonly DockSlot[], pointer: number, amount: number, vertical: boolean) {
  const tiles = root.querySelectorAll<HTMLElement>("[data-slot='dock-item']")
  const { scales, shifts, spread } = dockLayout(slots, pointer, amount)
  tiles.forEach((tile, index) => {
    const shift = shifts[index] ?? 0
    tile.style.transform = `${vertical ? "translateY" : "translateX"}(${shift.toFixed(2)}px) scale(${(scales[index] ?? 1).toFixed(4)})`
  })
  if (!surface) return
  const length = vertical ? surface.offsetHeight : surface.offsetWidth
  if (length > 0) surface.style.transform = `${vertical ? "scaleY" : "scaleX"}(${(1 + spread / length).toFixed(4)})`
}

/** No transform at rest, so icons and labels are drawn sharp and the tooltip measures the real box. */
function clearRow(root: HTMLElement, surface: HTMLElement | null) {
  root.querySelectorAll<HTMLElement>("[data-slot='dock-item']").forEach((tile) => tile.style.removeProperty("transform"))
  surface?.style.removeProperty("transform")
}

/** One pair of springs drives the whole row. Every write is a direct style write, so a pointer stream never re-renders. */
function useMagnifyRow(rootRef: React.RefObject<HTMLElement | null>, surfaceRef: React.RefObject<HTMLElement | null>, vertical: boolean) {
  const slotsRef = useRef<readonly DockSlot[]>([])
  const pointer = useMotionValue(0)
  const presence = useMotionValue(0)
  const smoothPointer = useSpring(pointer, FOLLOW_SPRING)
  const smoothPresence = useSpring(presence, PRESENCE_SPRING)

  const write = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const amount = smoothPresence.get()
    if (amount < SETTLED && presence.get() === 0) clearRow(root, surfaceRef.current)
    else writeRow(root, surfaceRef.current, slotsRef.current, smoothPointer.get(), amount, vertical)
  }, [presence, rootRef, smoothPointer, smoothPresence, surfaceRef, vertical])

  useMotionValueEvent(smoothPointer, "change", write)
  useMotionValueEvent(smoothPresence, "change", write)

  const aim = useCallback(
    (coordinate: number) => {
      const root = rootRef.current
      if (!root) return
      // Arriving from outside, the swell starts under the pointer instead of sweeping across from where it last was.
      if (presence.get() === 0) {
        slotsRef.current = readSlots(root, vertical)
        const box = root.getBoundingClientRect()
        if (!vertical && !dockHasRoom(box.left, box.right, window.innerWidth, dockMaxSpread(slotsRef.current))) return
        smoothPointer.jump(coordinate)
      }
      pointer.set(coordinate)
      presence.set(1)
    },
    [pointer, presence, rootRef, smoothPointer, vertical],
  )
  const release = useCallback(() => presence.set(0), [presence])
  return { aim, release }
}

interface DockMagnifyOptions {
  enabled: boolean
  vertical: boolean
}

export function useDockMagnify({ enabled, vertical }: DockMagnifyOptions) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLSpanElement>(null)
  const hoveringRef = useRef(false)
  const reduceMotion = useReducedMotion() ?? false
  const fits = useRowFits(listRef, vertical)
  const { aim, release } = useMagnifyRow(rootRef, surfaceRef, vertical)
  const allowed = enabled && fits && !reduceMotion

  const handlers = {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!allowed || event.pointerType === "touch" || !isFinePointer()) return
      hoveringRef.current = true
      const box = event.currentTarget.getBoundingClientRect()
      aim(vertical ? event.clientY - box.top : event.clientX - box.left)
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      hoveringRef.current = false
      const active = event.currentTarget.ownerDocument.activeElement
      if (!active || !event.currentTarget.contains(active) || !matchesFocusVisible(active)) release()
    },
    onFocusCapture: (event: React.FocusEvent<HTMLElement>) => {
      if (!allowed || hoveringRef.current || !isFinePointer() || !matchesFocusVisible(event.target)) return
      const root = event.currentTarget
      const slot = event.target.closest(SLOT_SELECTOR)
      const index = slot ? [...root.querySelectorAll(SLOT_SELECTOR)].indexOf(slot) : -1
      const centre = readSlots(root, vertical)[index]?.centre
      if (centre !== undefined) aim(centre)
    },
    onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
      if (!hoveringRef.current && !event.currentTarget.contains(event.relatedTarget)) release()
    },
  }

  return { rootRef, listRef, surfaceRef, fits, handlers }
}

/** One hop on the icon inside the tile, so it composes with the magnify transform written on the tile. */
export function hopOnce(icon: HTMLElement | null, vertical: boolean) {
  if (!icon) return
  const lifted = vertical ? "translateX(10px)" : "translateY(-14px)"
  icon.getAnimations().forEach((animation) => animation.cancel())
  icon.animate(
    [
      { transform: "none", easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      { transform: lifted, offset: 0.4, easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
      { transform: "none" },
    ],
    { duration: 480 },
  )
}
