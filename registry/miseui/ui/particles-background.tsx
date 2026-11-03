import type * as React from "react"
import { useEffect, useRef } from "react"
import { LIGHT_TOKEN_CLASS, useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import type { ParticleVariant } from "@/registry/miseui/ui/particles-background-engine"
import { startParticlePainter, type ParticlePainter } from "@/registry/miseui/ui/particles-background-painter"
import { cn } from "@/registry/miseui/lib/utils"

type ParticlesBackgroundEffect = "pointer"

/** Rising sparks have nothing to say about a pointer. A field exists to bend, so it does with or without the prop. */
function followsPointer(variant: ParticleVariant, effect?: ParticlesBackgroundEffect) {
  if (variant === "field") return true
  return effect === "pointer" && variant !== "rise"
}

type ParticlesBackgroundProps = Omit<React.ComponentProps<"div">, "ref"> & {
  /** `drift` points floating, `constellation` near points joined by faint lines, `rise` points going up and fading, `field` an even dot field with a clearing that follows the pointer. */
  variant?: ParticleVariant
  /** `pointer` parts the `drift` points and links the `constellation` to the pointer. Off on touch. */
  effect?: ParticlesBackgroundEffect
  /** Holds the motion. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** Another seed gives another layout. Points are only drawn in the browser, so hydration is not at stake. */
  seed?: number
}

function ParticlesBackground({ variant = "drift", effect, paused = false, seed = 1, className, children, onPointerMove, onPointerLeave, ...props }: ParticlesBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painterRef = useRef<ParticlePainter | null>(null)
  const { still, playing } = useBackgroundPlayback(rootRef, { paused })
  const following = followsPointer(variant, effect)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const painter = startParticlePainter(canvas, { variant, seed })
    painterRef.current = painter
    return () => {
      painter.stop()
      painterRef.current = null
    }
  }, [variant, seed])

  useEffect(() => {
    painterRef.current?.setPlaying(playing)
  }, [playing, variant, seed])

  return (
    <div
      {...props}
      ref={rootRef}
      data-slot="particles-background"
      data-variant={variant}
      data-effect={effect}
      data-playing={still ? undefined : String(playing)}
      className={cn("relative isolate min-w-0 overflow-clip", className)}
      // On the root and not on window: the events bubble up from whatever sits on top, and nothing listens while off screen.
      onPointerMove={(event) => {
        onPointerMove?.(event)
        if (following && event.pointerType !== "touch") painterRef.current?.setPointer({ x: event.clientX, y: event.clientY })
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (following) painterRef.current?.setPointer(null)
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-slot="particles-background-canvas"
        className={cn("pointer-events-none absolute inset-0 -z-10 size-full rounded-[inherit] [color:var(--mise-light)] [border-color:var(--muted-foreground)]", LIGHT_TOKEN_CLASS)}
      />
      <div data-slot="particles-background-content" className="relative h-full">
        {children}
      </div>
    </div>
  )
}

export { ParticlesBackground, type ParticlesBackgroundProps, type ParticlesBackgroundEffect, type ParticleVariant as ParticlesBackgroundVariant }
