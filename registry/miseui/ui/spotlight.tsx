import type * as React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type SpotlightVariant = "glow" | "border" | "reveal"
type SpotlightEffect = "trail"

/** Critical damping with the 0.35 s response of SPRING_DEFAULT. useSpring takes physics, not a duration. */
const TRAIL_SPRING = { stiffness: 322, damping: 36, mass: 1 }
const OFFSTAGE = -9999

/** Inline, because these read custom properties that change on every pointer move and a utility class would add nothing. */
const LAYER_STYLE: Record<SpotlightVariant, React.CSSProperties> = {
  glow: {
    background: "radial-gradient(360px circle at var(--mise-spot-x) var(--mise-spot-y), color-mix(in oklab, var(--mise) 14%, transparent), transparent 70%)",
  },
  border: {
    background: "radial-gradient(240px circle at var(--mise-spot-x) var(--mise-spot-y), var(--mise), transparent 70%)",
    // Keeps the padding ring and cuts out the content box: only the edge catches the light.
    mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    maskComposite: "exclude",
  },
  reveal: {
    maskImage: "radial-gradient(180px circle at var(--mise-spot-x) var(--mise-spot-y), #000, transparent 100%)",
  },
}

const LAYER_CLASS: Record<SpotlightVariant, string> = {
  glow: "inset-0 -z-10",
  // Past the root's own 1 px border, so the bright ring lands exactly on it.
  border: "-inset-px p-px",
  reveal: "inset-0 -z-10 overflow-hidden",
}

const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(color-mix(in oklab, var(--foreground) 16%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--foreground) 16%, transparent) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
}

interface Light {
  move: (clientX: number, clientY: number) => void
  leave: () => void
}

const GroupContext = createContext<{ add: (light: Light) => () => void } | null>(null)

function useLight(trail: boolean) {
  const rootRef = useRef<HTMLDivElement>(null)
  const litRef = useRef(false)
  const [lit, setLit] = useState(false)
  const x = useMotionValue(OFFSTAGE)
  const y = useMotionValue(OFFSTAGE)
  const trailX = useSpring(x, TRAIL_SPRING)
  const trailY = useSpring(y, TRAIL_SPRING)
  const move = useCallback(
    (clientX: number, clientY: number) => {
      const box = rootRef.current?.getBoundingClientRect()
      if (!box) return
      x.set(clientX - box.left)
      y.set(clientY - box.top)
      // Arriving from outside, the light starts under the pointer instead of flying in from where it last was.
      if (!litRef.current) {
        trailX.jump(clientX - box.left)
        trailY.jump(clientY - box.top)
      }
      litRef.current = true
      setLit(true)
    },
    [x, y, trailX, trailY],
  )
  const leave = useCallback(() => {
    litRef.current = false
    setLit(false)
  }, [])
  const left = useMotionTemplate`${trail ? trailX : x}px`
  const top = useMotionTemplate`${trail ? trailY : y}px`
  return { rootRef, lit, move, leave, left, top }
}

type SpotlightProps = Omit<React.ComponentProps<typeof motion.div>, "style" | "children"> & {
  /** `glow` a soft light on the surface, `border` only the edge lights up, `reveal` a hidden layer shows under the pointer. */
  variant?: SpotlightVariant
  /** `trail` lets the light lag slightly behind the pointer, as if it had weight. */
  effect?: SpotlightEffect
  /** What `reveal` uncovers. Defaults to a fine grid. */
  revealed?: React.ReactNode
  style?: React.CSSProperties
  children?: React.ReactNode
}

function Spotlight({ variant = "glow", effect, revealed, className, style, children, onPointerMove, onPointerLeave, ...props }: SpotlightProps) {
  const reduceMotion = useReducedMotion() ?? false
  const group = useContext(GroupContext)
  const { rootRef, lit, move, leave, left, top } = useLight(effect === "trail" && !reduceMotion)
  useEffect(() => group?.add({ move, leave }), [group, move, leave])
  return (
    <motion.div
      ref={rootRef}
      data-slot="spotlight"
      data-variant={variant}
      data-effect={effect}
      data-lit={lit ? "true" : undefined}
      className={cn("relative isolate min-w-0 rounded-lg border bg-card text-card-foreground", className)}
      style={{ ...style, "--mise-spot-x": left, "--mise-spot-y": top } as React.ComponentProps<typeof motion.div>["style"]}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        // A finger has no hover to follow, and a light stuck where it last touched would look like a bug.
        if (!group && event.pointerType !== "touch") move(event.clientX, event.clientY)
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (!group) leave()
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="spotlight-light"
        className={cn(
          "pointer-events-none absolute rounded-[inherit] transition-opacity duration-(--duration-slow) ease-(--ease-mise) motion-reduce:transition-none",
          LAYER_CLASS[variant],
          lit ? "opacity-100" : "opacity-0",
        )}
        style={LAYER_STYLE[variant]}
      >
        {variant === "reveal" ? (revealed ?? <span data-slot="spotlight-grid" className="absolute inset-0 block" style={GRID_STYLE} />) : null}
      </span>
      {children}
    </motion.div>
  )
}

type SpotlightGroupProps = React.ComponentProps<"div">

/** One pointer lights every card inside at once, so a light passing between two cards catches the edge of both. */
function SpotlightGroup({ className, onPointerMove, onPointerLeave, ...props }: SpotlightGroupProps) {
  const lights = useRef<ReadonlySet<Light>>(new Set())
  const registry = useMemo(
    () => ({
      add: (light: Light) => {
        lights.current = new Set([...lights.current, light])
        return () => {
          lights.current = new Set([...lights.current].filter((entry) => entry !== light))
        }
      },
    }),
    [],
  )
  return (
    <GroupContext.Provider value={registry}>
      <div
        data-slot="spotlight-group"
        className={cn("min-w-0", className)}
        onPointerMove={(event) => {
          onPointerMove?.(event)
          if (event.pointerType === "touch") return
          lights.current.forEach((light) => light.move(event.clientX, event.clientY))
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          lights.current.forEach((light) => light.leave())
        }}
        {...props}
      />
    </GroupContext.Provider>
  )
}

export { Spotlight, SpotlightGroup, type SpotlightProps, type SpotlightGroupProps, type SpotlightVariant, type SpotlightEffect }
