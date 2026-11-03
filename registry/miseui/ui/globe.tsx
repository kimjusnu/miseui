import type * as React from "react"
import { useEffect, useRef } from "react"
import { useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import { createGlobePainter, type GlobePainter, type GlobeVariant } from "@/registry/miseui/ui/globe-painter"
import type { GlobePoint } from "@/registry/miseui/ui/globe-math"
import { cn } from "@/registry/miseui/lib/utils"

type GlobeEffect = "drag"

interface GlobeMarker extends GlobePoint {
  /** Read out in a hidden list: a dot on a canvas says nothing to a screen reader. */
  label: string
}

interface GlobeArc {
  from: GlobePoint
  to: GlobePoint
  /** Add it when the route means something: it joins the hidden list. */
  label?: string
}

const KEY_TURN_DEGREES = 20
const DEFAULT_CENTER: GlobePoint = { lat: 18, lng: 15 }
const NO_MARKERS: readonly GlobeMarker[] = []
const NO_ARCS: readonly GlobeArc[] = []

type GlobeProps = Omit<React.ComponentProps<"div">, "ref" | "children"> & {
  /** `dots` land as dots, `wire` lines of latitude and longitude with land dots, `solid` a shaded disc with land in the accent, `arcs` dots plus routes with a light along each. */
  variant?: GlobeVariant
  /** `drag` spins it with inertia. The page still scrolls vertically, and Left and Right turn it while it has focus. */
  effect?: GlobeEffect
  markers?: readonly GlobeMarker[]
  /** Only `arcs` draws these. */
  arcs?: readonly GlobeArc[]
  /** What faces the viewer at the start. `lat` is also the tilt, and stays fixed while it turns. */
  center?: GlobePoint
  /** Holds the slow turn. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** What the picture shows, for assistive tech. */
  label?: string
}

function usePointerDrag(painterRef: React.RefObject<GlobePainter | null>, enabled: boolean) {
  const lastX = useRef<number | null>(null)
  if (!enabled) return {}
  return {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      lastX.current = event.clientX
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (lastX.current === null) return
      painterRef.current?.dragBy(event.clientX - lastX.current, event.timeStamp)
      lastX.current = event.clientX
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      lastX.current = null
      painterRef.current?.release(event.timeStamp)
    },
    // The browser took the gesture for a vertical scroll, so whatever speed was measured is not a flick.
    onPointerCancel: () => {
      lastX.current = null
      painterRef.current?.release(Number.NEGATIVE_INFINITY)
    },
  }
}

function Globe({
  variant = "dots",
  effect,
  markers = NO_MARKERS,
  arcs = NO_ARCS,
  center = DEFAULT_CENTER,
  paused = false,
  label = "A slowly turning globe",
  className,
  ...props
}: GlobeProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painterRef = useRef<GlobePainter | null>(null)
  const { still, playing } = useBackgroundPlayback(rootRef, { paused })
  const draggable = effect === "drag"
  const dragHandlers = usePointerDrag(painterRef, draggable)
  const { lat, lng } = center

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const painter = createGlobePainter(canvas, { variant: "dots", center: { lat: 0, lng: 0 }, markers: [], arcs: [] })
    painterRef.current = painter
    return () => {
      painter.destroy()
      painterRef.current = null
    }
  }, [])

  // Declared after the painter's effect, so it finds the painter on the first run too.
  useEffect(() => {
    painterRef.current?.setScene({ variant, center: { lat, lng }, markers, arcs })
  }, [variant, lat, lng, markers, arcs])
  useEffect(() => {
    painterRef.current?.setStill(still)
    painterRef.current?.setAuto(playing)
  }, [still, playing])

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    painterRef.current?.turnBy(event.key === "ArrowRight" ? KEY_TURN_DEGREES : -KEY_TURN_DEGREES)
  }
  const namedArcs = arcs.filter((arc) => arc.label)

  return (
    <div
      {...props}
      {...dragHandlers}
      ref={rootRef}
      data-slot="globe"
      data-variant={variant}
      data-effect={effect}
      data-playing={still ? undefined : String(playing)}
      className={cn("relative aspect-square w-full min-w-0", draggable && "cursor-grab touch-pan-y select-none active:cursor-grabbing", className)}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={draggable ? `${label}. Left and Right arrow keys turn it.` : label}
        aria-keyshortcuts={draggable ? "ArrowLeft ArrowRight" : undefined}
        tabIndex={draggable ? 0 : undefined}
        onKeyDown={draggable ? onKeyDown : undefined}
        data-slot="globe-canvas"
        className="absolute inset-0 size-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      {markers.length + namedArcs.length > 0 ? (
        <ul data-slot="globe-places" className="sr-only select-none">
          {markers.map((marker) => (
            <li key={marker.label}>{marker.label}</li>
          ))}
          {namedArcs.map((arc) => (
            <li key={arc.label}>{arc.label}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export { Globe, type GlobeProps, type GlobeVariant, type GlobeEffect, type GlobeMarker, type GlobeArc }
