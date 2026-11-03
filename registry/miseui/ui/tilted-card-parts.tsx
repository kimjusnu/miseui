import type * as React from "react"
import { createContext, useContext } from "react"
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react"
import { glareTransform, layerTransform } from "@/registry/miseui/ui/tilted-card-math"
import { cn } from "@/registry/miseui/lib/utils"

/** 0 at rest, 1 while tilted. Layers and the sheen read it, so everything reaches rest together and text ends up sharp. */
export const TiltLiftContext = createContext<MotionValue<number> | null>(null)

const NOTCH_EDGE = "transparent 6.5px, #000 7px"
const NOTCH_BOTTOM: React.CSSProperties = {
  maskImage: `radial-gradient(circle 7px at 0 100%, ${NOTCH_EDGE}), radial-gradient(circle 7px at 100% 100%, ${NOTCH_EDGE})`,
  maskComposite: "intersect",
}
const NOTCH_TOP: React.CSSProperties = {
  maskImage: `radial-gradient(circle 7px at 0 0, ${NOTCH_EDGE}), radial-gradient(circle 7px at 100% 0, ${NOTCH_EDGE})`,
  maskComposite: "intersect",
}
/** A white core between two faint darker flanks: that pair reads as foil on a light card, where white alone cannot show. No hue, so never a rainbow. */
const SHEEN_IMAGE = [
  "linear-gradient(112deg, transparent 30%, color-mix(in oklab, var(--foreground) 7%, transparent) 41%, rgb(255 255 255 / var(--mise-sheen)) 50%, color-mix(in oklab, var(--foreground) 7%, transparent) 59%, transparent 70%)",
  "linear-gradient(112deg, transparent 66%, rgb(255 255 255 / calc(var(--mise-sheen) * 0.5)) 70%, transparent 74%)",
].join(",")

interface TiltLayerProps extends Omit<React.ComponentProps<"div">, "ref" | "style" | "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"> {
  /** Pixels toward the viewer while the card is tilted. Past about 48 a part near the edge passes the reserved room. */
  depth?: number
}

/** A part on its own plane. Lies flat at rest, so its text is as sharp as anything else on the page. */
function TiltLayer({ depth = 24, className, children, ...props }: TiltLayerProps) {
  const contextLift = useContext(TiltLiftContext)
  const idleLift = useMotionValue(0)
  const lift = contextLift ?? idleLift
  const transform = useTransform(lift, (value) => layerTransform(depth, value))
  return (
    <motion.div {...props} data-slot="tilt-layer" data-depth={depth} className={className} style={{ transform, transformStyle: "preserve-3d" }}>
      {children}
    </motion.div>
  )
}

interface PhotoFaceProps {
  caption?: React.ReactNode
  children: React.ReactNode
}

/** The clip sits on the picture alone: overflow on the turning surface would flatten the caption back into the card. */
function PhotoFace({ caption, children }: PhotoFaceProps) {
  return (
    <>
      <div data-slot="tilted-card-picture" className="overflow-hidden rounded-2xl">
        {children}
      </div>
      {caption ? (
        <TiltLayer depth={40} className="absolute start-3 end-3 bottom-3 flex">
          <div data-slot="tilted-card-caption" className="min-w-0 rounded-lg bg-background px-3 py-2 text-[13px] text-foreground shadow-md shadow-black/15 dark:shadow-black/40">
            {caption}
          </div>
        </TiltLayer>
      ) : null}
    </>
  )
}

interface GlareFaceProps {
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
  lift: MotionValue<number>
  maxTilt: number
  children: React.ReactNode
}

function GlareFace({ rotateX, rotateY, lift, maxTilt, children }: GlareFaceProps) {
  const transform = useTransform([rotateX, rotateY], ([x, y]) => glareTransform(x as number, y as number, maxTilt))
  return (
    <div data-slot="tilted-card-foil" className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground">
      {children}
      <motion.div
        aria-hidden="true"
        data-slot="tilted-card-sheen"
        className="pointer-events-none absolute -inset-[60%] [--mise-sheen:0.75] dark:[--mise-sheen:0.14]"
        style={{ backgroundImage: SHEEN_IMAGE, opacity: lift, transform }}
      />
    </div>
  )
}

/** A plain wrapper div around a layer would flatten it back into the card, so every ancestor of a layer keeps 3D. */
const KEEP_3D = "[&_:has([data-slot=tilt-layer])]:[transform-style:preserve-3d]"

function LayersFace({ children }: { children: React.ReactNode }) {
  return (
    <div data-slot="tilted-card-plate" className={cn("relative rounded-2xl border bg-card text-card-foreground [transform-style:preserve-3d]", KEEP_3D)}>
      {children}
    </div>
  )
}

interface PassFaceProps {
  stub?: React.ReactNode
  finePrint?: React.ReactNode
  children: React.ReactNode
}

/** Each half cuts its own corners at the seam, so the notches stay on the fold however tall either half grows. */
function PassFace({ stub, finePrint, children }: PassFaceProps) {
  return (
    <div data-slot="tilted-card-pass" className="relative grid grid-cols-[minmax(0,1fr)] text-card-foreground">
      <div data-slot="tilted-card-pass-main" className="rounded-t-2xl bg-card p-4 dark:bg-muted" style={NOTCH_BOTTOM}>
        {children}
      </div>
      <div data-slot="tilted-card-pass-stub" className="grid gap-2 rounded-b-2xl border-t border-dashed border-border bg-card p-4 dark:bg-muted" style={NOTCH_TOP}>
        {stub}
        {finePrint ? <p className={cn("text-xs text-muted-foreground")}>{finePrint}</p> : null}
      </div>
    </div>
  )
}

export { GlareFace, LayersFace, PassFace, PhotoFace, TiltLayer, type TiltLayerProps }
