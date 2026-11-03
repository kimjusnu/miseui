import type { Ink } from "@/registry/miseui/ui/globe-color"
import { drawDots, drawGraticule, drawHaze, limbFill, type Disc } from "@/registry/miseui/ui/globe-draw"
import { dotStep, sampleLandDots, type GlobeView } from "@/registry/miseui/ui/globe-math"
import { buildSolidFrame, type SolidFrame } from "@/registry/miseui/ui/globe-solid"

export type GlobeVariant = "dots" | "wire" | "solid" | "arcs"

const DOT_PEAK: Record<GlobeVariant, number> = { dots: 0.66, wire: 0.5, solid: 0, arcs: 0.42 }

export class DotCache {
  private step = -1
  units = new Float32Array(0)
  scratch = new Float32Array(0)
  use(step: number) {
    if (step === this.step) return
    this.step = step
    this.units = sampleLandDots(step)
    this.scratch = new Float32Array(this.units.length)
  }
}

export interface SolidBuffer {
  key: string
  frame: SolidFrame
  image: ImageData
  target: Uint32Array
}

export function solidBuffer(ctx: CanvasRenderingContext2D, previous: SolidBuffer | null, pixels: number, tilt: number, ink: Ink): SolidBuffer {
  const key = `${pixels}|${tilt}|${ink.ocean.join()}|${ink.land.join()}`
  if (previous?.key === key) return previous
  const image = ctx.createImageData(pixels, pixels)
  return { key, image, frame: buildSolidFrame(pixels, tilt, { ocean: ink.ocean, land: ink.land }), target: new Uint32Array(image.data.buffer) }
}

export function paintVector(ctx: CanvasRenderingContext2D, variant: GlobeVariant, view: GlobeView, disc: Disc, ink: Ink, dots: DotCache, graticule: readonly Float32Array[]) {
  ctx.clearRect(0, 0, disc.cx * 2, disc.cy * 2)
  if (variant === "wire") drawGraticule(ctx, graticule, view, disc, ink.foreground)
  else drawHaze(ctx, disc, ink.foreground)
  dots.use(dotStep(disc.radius / disc.ratio, variant === "wire" ? 7 : 5.6))
  const dotRadius = disc.ratio * (variant === "wire" ? 0.8 : disc.radius / disc.ratio > 180 ? 1.2 : 1)
  drawDots(ctx, dots.units, dots.scratch, view, disc, dotRadius, limbFill(ctx, disc, ink.foreground, DOT_PEAK[variant]))
}
