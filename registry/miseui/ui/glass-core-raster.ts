import { FILL_SHARE, type KnotBead } from "@/registry/miseui/ui/glass-core-knot"

export type Rgb = readonly [number, number, number]

export interface KnotShade {
  accent: Rgb
  surface: Rgb
  solid: boolean
}

const TUBE_SHARE = 0.11
const SLICE_REACH = 1.6
const FOLD_TURN = 0.7
const FOLD_STEP = 0.04
const FAR_FADE = 0.5
const FAR_FADE_SOLID = 0.25
const PALE_BODY = 0.2
const SHADOW = 0.3
const GLOW = 0.28
const SHEEN_POWER = 10
const SHEEN = 0.3
const GLINT_POWER = 60
const GLINT = 0.95
const GLASS_ALPHA = 0.86
const LIGHT = { x: -0.42, y: -0.6, z: 0.68 } as const

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount

function direction(beads: readonly KnotBead[], index: number) {
  const before = beads[(index - 1 + beads.length) % beads.length] as KnotBead
  const after = beads[(index + 1) % beads.length] as KnotBead
  const dx = after.x - before.x
  const dy = after.y - before.y
  const length = Math.hypot(dx, dy) || 1
  return { tx: dx / length, ty: dy / length, step: length / 2 }
}

/** A glass tube: pale where it faces you, light gathered on the side away from the source, one sharp glint. */
function shadePixel(data: Uint8ClampedArray, offset: number, shade: KnotShade, nx: number, ny: number, nz: number, near: number, cover: number) {
  const facing = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z
  const fade = (1 - near) * (shade.solid ? FAR_FADE_SOLID : FAR_FADE)
  const body = 1 - SHADOW * (1 - Math.max(facing, 0))
  const pale = shade.solid ? 0 : PALE_BODY * nz
  const reflected = Math.max(2 * facing * nz - LIGHT.z, 0)
  const white = shade.solid ? 0 : Math.min(SHEEN * reflected ** SHEEN_POWER + GLINT * reflected ** GLINT_POWER * (0.4 + near * 0.6), 1)
  const glow = shade.solid ? 0 : GLOW * Math.max(-facing, 0)
  for (let channel = 0; channel < 3; channel += 1) {
    const accent = shade.accent[channel] as number
    const tint = mix(accent, shade.surface[channel] as number, fade)
    data[offset + channel] = mix(mix(mix(tint, 255, pale) * body, accent, glow), 255, white)
  }
  data[offset + 3] = (shade.solid ? 1 : mix(1, GLASS_ALPHA, nz * nz)) * cover * 255
}

interface Slice {
  tx: number
  ty: number
  step: number
  radius: number
  /** The strand turns hard on screen here, so slices would fan apart with gaps between them. */
  fold: boolean
}

interface Claims {
  depths: Float32Array
  owners: Int32Array
  across: Float32Array
  along: Float32Array
}

function sliceAt(beads: readonly KnotBead[], index: number, size: number): Slice {
  const bead = beads[index] as KnotBead
  const before = beads[(index - 1 + beads.length) % beads.length] as KnotBead
  const after = beads[(index + 1) % beads.length] as KnotBead
  const radius = (size * TUBE_SHARE * bead.scale) / 2
  const inLength = Math.hypot(bead.x - before.x, bead.y - before.y) || 1
  const outLength = Math.hypot(after.x - bead.x, after.y - bead.y) || 1
  const turn = ((bead.x - before.x) * (after.x - bead.x) + (bead.y - before.y) * (after.y - bead.y)) / (inLength * outLength)
  const heading = direction(beads, index)
  return { ...heading, radius, fold: turn < FOLD_TURN || heading.step < radius * FOLD_STEP }
}

/** Takes every pixel of this bead's slice that is nearer than what is there. A fold also takes a ball, which only wins where no slice reached. */
function claimBead(claims: Claims, bead: KnotBead, index: number, { tx, ty, step, radius, fold }: Slice, size: number, world: number) {
  const reach = Math.max(step * SLICE_REACH, 1)
  const edge = radius + 0.5
  // The box of this slice alone, not of the whole ball: most of the time saved is here.
  const spanX = fold ? edge : Math.abs(tx) * reach + Math.abs(ty) * edge
  const spanY = fold ? edge : Math.abs(ty) * reach + Math.abs(tx) * edge
  const right = Math.min(Math.ceil(bead.x + spanX), size - 1)
  const bottom = Math.min(Math.ceil(bead.y + spanY), size - 1)
  for (let y = Math.max(Math.floor(bead.y - spanY), 0); y <= bottom; y += 1) {
    for (let x = Math.max(Math.floor(bead.x - spanX), 0); x <= right; x += 1) {
      const dx = x + 0.5 - bead.x
      const dy = y + 0.5 - bead.y
      const along = dx * tx + dy * ty
      const across = dy * tx - dx * ty
      const inSlice = Math.abs(along) <= reach && Math.abs(across) <= edge
      if (!inSlice && !(fold && along * along + across * across <= edge * edge)) continue
      const axial = inSlice ? 0 : along
      const depth = bead.depth * world + Math.sqrt(Math.max(radius * radius - across * across - axial * axial, 0))
      const pixel = y * size + x
      if (depth <= (claims.depths[pixel] as number)) continue
      claims.depths[pixel] = depth
      claims.owners[pixel] = index
      claims.across[pixel] = across
      claims.along[pixel] = axial
    }
  }
}

/**
 * Paints the path as a tube into `data`, an RGBA buffer the caller owns and reuses, which is why this writes in place.
 * Each bead claims a thin slice across the tube, and a depth test per pixel settles every crossing without sorting.
 * A pixel is shaded once at the end, only by its distance from the centre line, so the shade cannot change along a
 * strand. Stamping shaded balls or strokes instead gave seams at the joints, or blobs where one ball ended up on top.
 */
export function rasterizeKnot(beads: readonly KnotBead[], size: number, shade: KnotShade, data: Uint8ClampedArray) {
  data.fill(0)
  const count = size * size
  const claims: Claims = {
    depths: new Float32Array(count).fill(-Infinity),
    owners: new Int32Array(count).fill(-1),
    across: new Float32Array(count),
    along: new Float32Array(count),
  }
  const slices = beads.map((_, index) => sliceAt(beads, index, size))
  beads.forEach((bead, index) => claimBead(claims, bead, index, slices[index] as Slice, size, size * FILL_SHARE))
  for (let pixel = 0; pixel < count; pixel += 1) {
    const owner = claims.owners[pixel] as number
    if (owner < 0) continue
    const bead = beads[owner] as KnotBead
    const { tx, ty, radius } = slices[owner] as Slice
    const across = claims.across[pixel] as number
    const along = claims.along[pixel] as number
    const nz = Math.sqrt(Math.max(radius * radius - across * across - along * along, 0)) / radius
    const near = (Math.min(Math.max(bead.depth, -1), 1) + 1) / 2
    const cover = Math.min(radius + 0.5 - Math.hypot(across, along), 1)
    shadePixel(data, pixel * 4, shade, (tx * along - ty * across) / radius, (ty * along + tx * across) / radius, nz, near, cover)
  }
}
