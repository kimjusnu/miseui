import {
  clearAnimation,
  pathDirection,
  seededRotation,
  spawnAnimation,
  spawnPoints,
  speedScale,
  type ImageTrailVariant,
  type Point,
} from "@/registry/miseui/ui/image-trail-math"

export interface TrailEngineOptions {
  root: HTMLElement
  /** Holds the fixed pool of pictures. */
  layer: HTMLElement
  variant: ImageTrailVariant
  speed: boolean
  spacing: number
}

export interface TrailEngine {
  move: (point: Point, now: number) => void
  leave: () => void
  dispose: () => void
}

/** How long the pointer has to rest before a pile clears. */
const PILE_REST_MS = 450
/** After this with no movement the still arrangement comes back. */
const IDLE_MS = 1500

/** Everything here is direct writes and the Web Animations API. A spawn never touches React. */
export function createTrailEngine({ root, layer, variant, speed, spacing }: TrailEngineOptions): TrailEngine {
  const nodes = [...layer.children] as HTMLElement[]
  const running = new Map<HTMLElement, Animation>()
  const piled = new Map<HTMLElement, string>()
  const state = {
    cursor: 0,
    spawned: 0,
    anchor: null as Point | null,
    lastPoint: null as Point | null,
    lastAt: 0,
    restTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    idleTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  }

  const play = (node: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    running.get(node)?.cancel()
    running.set(node, node.animate(keyframes, options))
  }

  const spawn = (point: Point, direction: Point, scale: number) => {
    const node = nodes[state.cursor]
    if (!node) return
    state.cursor = (state.cursor + 1) % nodes.length
    state.spawned += 1
    const x = point.x - node.offsetWidth / 2
    const y = point.y - node.offsetHeight / 2
    const rotation = seededRotation(variant, state.spawned)
    const { keyframes, options } = spawnAnimation(variant, { x, y, scale, rotation, direction })
    // Removed first so a reused picture rejoins the pile on top, in the order it will clear.
    piled.delete(node)
    if (variant === "pile") piled.set(node, keyframes[keyframes.length - 1]?.transform as string)
    play(node, keyframes, options)
    root.dataset.active = "true"
  }

  const clearPile = () => {
    [...piled.entries()].forEach(([node, rest], order) => {
      const { keyframes, options } = clearAnimation(rest, order)
      play(node, keyframes, options)
    })
    piled.clear()
  }

  const wait = () => {
    clearTimeout(state.restTimer)
    clearTimeout(state.idleTimer)
    if (variant === "pile") state.restTimer = setTimeout(clearPile, PILE_REST_MS)
    state.idleTimer = setTimeout(() => {
      delete root.dataset.active
    }, IDLE_MS)
  }

  const move = (point: Point, now: number) => {
    const elapsed = now - state.lastAt
    const travelled = state.lastPoint ? Math.hypot(point.x - state.lastPoint.x, point.y - state.lastPoint.y) : 0
    const scale = speed && elapsed > 0 ? speedScale(travelled / elapsed) : 1
    const direction = state.lastPoint ? pathDirection(state.lastPoint, point) : { x: 1, y: 0 }
    state.lastPoint = point
    state.lastAt = now
    if (!state.anchor) {
      state.anchor = point
      return
    }
    const step = spawnPoints(state.anchor, point, spacing)
    state.anchor = step.anchor
    step.points.forEach((spot) => spawn(spot, direction, scale))
    wait()
  }

  const leave = () => {
    state.anchor = null
    state.lastPoint = null
    wait()
  }

  const dispose = () => {
    clearTimeout(state.restTimer)
    clearTimeout(state.idleTimer)
    running.forEach((animation) => animation.cancel())
    running.clear()
    piled.clear()
    delete root.dataset.active
  }

  return { move, leave, dispose }
}
