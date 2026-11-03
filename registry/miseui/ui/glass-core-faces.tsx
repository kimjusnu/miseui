import { useEffect, useRef } from "react"
import { motion, useMotionTemplate, useTransform, type MotionValue } from "motion/react"
import { startKnotPainter } from "@/registry/miseui/ui/glass-core-painter"
import { cn } from "@/registry/miseui/lib/utils"

export interface GlassFaceProps {
  leanX: MotionValue<number>
  leanY: MotionValue<number>
  drift: boolean
  solid: boolean
}

export function KnotFace({ leanX, leanY, drift, solid }: GlassFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startKnotPainter(canvas, { leanX, leanY, drift, solid })
  }, [leanX, leanY, drift, solid])
  return <canvas ref={canvasRef} data-slot="glass-core-canvas" className="absolute inset-0 size-full" />
}

const HIGHLIGHT_REST = 32
const HIGHLIGHT_TRAVEL = 14

const ORB_SHADOW =
  "inset 0 0 0 1px rgb(255 255 255 / 0.18), inset 0 -24px 48px -16px color-mix(in oklab, var(--mise) 55%, transparent), 0 24px 48px -24px rgb(0 0 0 / 0.45)"

export function OrbFace({ leanX, leanY }: GlassFaceProps) {
  const lightX = useTransform(leanX, (value) => `${HIGHLIGHT_REST + value * HIGHLIGHT_TRAVEL}%`)
  const lightY = useTransform(leanY, (value) => `${HIGHLIGHT_REST - 6 + value * HIGHLIGHT_TRAVEL}%`)
  const bendX = useTransform(leanX, (value) => `${100 - HIGHLIGHT_REST + value * HIGHLIGHT_TRAVEL * -0.6}%`)
  const bendY = useTransform(leanY, (value) => `${100 - HIGHLIGHT_REST + value * HIGHLIGHT_TRAVEL * -0.6}%`)
  const glint = useMotionTemplate`radial-gradient(circle at ${lightX} ${lightY}, rgb(255 255 255 / 0.85), transparent 34%)`
  const bend = useMotionTemplate`radial-gradient(circle at ${bendX} ${bendY}, color-mix(in oklab, var(--mise) 70%, transparent), transparent 56%)`
  return (
    <div
      data-slot="glass-core-orb"
      className="absolute inset-[14%] overflow-hidden rounded-full border border-foreground/10 bg-background/20 backdrop-blur-md [@media(prefers-reduced-transparency:reduce)]:bg-muted [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"
      style={{ boxShadow: ORB_SHADOW }}
    >
      <motion.div className="absolute inset-0" style={{ backgroundImage: bend }} />
      <motion.div className="absolute inset-0" style={{ backgroundImage: glint }} />
    </div>
  )
}

const PANE_TILT = 24
const PANE_TURN = -28
const PANE_LEAN = 14
const PANE_LAYERS: ReadonlyArray<{ z: number; className: string }> = [
  { z: -48, className: "bg-background/20" },
  { z: 0, className: "bg-mise/20 [@media(prefers-reduced-transparency:reduce)]:bg-muted" },
  { z: 48, className: "bg-background/30 [@media(prefers-reduced-transparency:reduce)]:bg-card" },
]

export function PanesFace({ leanX, leanY }: GlassFaceProps) {
  const tilt = useTransform(leanY, (value) => PANE_TILT - value * PANE_LEAN)
  const turn = useTransform(leanX, (value) => PANE_TURN + value * PANE_LEAN)
  const transform = useMotionTemplate`rotateX(${tilt}deg) rotateY(${turn}deg)`
  return (
    <div className="absolute inset-0 perspective-[800px]">
      <motion.div className="absolute inset-0 transform-3d" style={{ transform }}>
        {PANE_LAYERS.map((pane) => (
          <div
            key={pane.z}
            data-slot="glass-core-pane"
            className={cn(
              "absolute inset-[24%] rounded-2xl border border-foreground/15 shadow-[0_16px_32px_-20px_rgb(0_0_0/0.5)] backdrop-blur-sm [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
              pane.className,
            )}
            style={{ transform: `translateZ(${pane.z}px)` }}
          />
        ))}
      </motion.div>
    </div>
  )
}
