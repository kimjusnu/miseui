import type * as React from "react"
import { useMemo } from "react"
import { BackgroundPointerLayer, useBackgroundPointer } from "@/registry/miseui/ui/grid-background-pointer"
import { cn } from "@/registry/miseui/lib/utils"

type GridBackgroundVariant = "lines" | "fade" | "perspective" | "blocks"
type GridBackgroundEffect = "pointer"

interface GridBlock {
  col: number
  row: number
  /** 0..1, weaker further from the corner the blocks gather in. */
  strength: number
}

const CELL = "var(--mise-grid-cell,32px)"
const LINE_IMAGE = "linear-gradient(var(--mise-grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--mise-grid-line) 1px,transparent 1px)"
/** The -1 px hides the first line, which would otherwise double the owner's border. */
const LINES_STYLE: React.CSSProperties = { backgroundImage: LINE_IMAGE, backgroundSize: `${CELL} ${CELL}`, backgroundPosition: "-1px -1px" }
/** Anchored top right like the blocks, so every block sits exactly between two lines. */
const BLOCK_LINES_STYLE: React.CSSProperties = { ...LINES_STYLE, backgroundPosition: "100% -1px" }

const FADE_MASK = "radial-gradient(ellipse closest-side at 50% 50%,#000 20%,transparent 100%)"
const FADE_STYLE: React.CSSProperties = { ...LINES_STYLE, maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }

/**
 * The floor is hinged at the bottom edge and tips almost flat, so its lines meet at a horizon near 40 percent whatever
 * the box height. Everything is in container units to keep that picture the same on a card and a hero. 88 degrees rather
 * than 90 keeps the matrix away from the edge-on case. The plane is far larger than the box because the far rows shrink
 * to a ninth; the mask ends before its far edge, so that edge never shows. Depth squeezes rows, hence 2 px rows and 1 px columns.
 */
const FLOOR_MASK = "linear-gradient(to bottom,transparent 46%,#000 100%)"
const FLOOR_CELL = `max(${CELL},14cqh)`
const STAGE_STYLE: React.CSSProperties = { perspective: "100cqh", perspectiveOrigin: "50% 42%", maskImage: FLOOR_MASK, WebkitMaskImage: FLOOR_MASK }
const PLANE_STYLE: React.CSSProperties = {
  left: "-400cqw",
  width: "900cqw",
  bottom: 0,
  height: "800cqh",
  transformOrigin: "50% 100%",
  transform: "rotateX(88deg)",
  backgroundImage: "linear-gradient(var(--mise-grid-line) 2px,transparent 2px),linear-gradient(90deg,var(--mise-grid-line) 1px,transparent 1px)",
  backgroundSize: `${FLOOR_CELL} ${FLOOR_CELL}`,
  backgroundPosition: "50% 100%",
}

const BLOCK_COUNT = 9
const BLOCK_COLS = 10
const BLOCK_ROWS = 7
const BLOCK_ATTEMPTS = 160

/** Pure hash of a seed and a position in the sequence, so a layout needs no random state and hydrates exactly. */
function seededUnit(seed: number, index: number) {
  const start = (seed + Math.imul(index + 1, 0x6d2b79f5)) | 0
  const mixed = Math.imul(start ^ (start >>> 15), 1 | start)
  const scrambled = mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed))
  return ((scrambled ^ (scrambled >>> 14)) >>> 0) / 4294967296
}

const touches = (a: GridBlock, b: Pick<GridBlock, "col" | "row">) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) <= 1

/** Picks cells counted from the top right corner. Squaring pulls them toward it, and no two share a side: a row of filled cells reads as a chart. */
function pickGridBlocks(seed: number, count = BLOCK_COUNT, cols = BLOCK_COLS, rows = BLOCK_ROWS): readonly GridBlock[] {
  return Array.from({ length: BLOCK_ATTEMPTS }).reduce<readonly GridBlock[]>((picked, _, attempt) => {
    if (picked.length >= count) return picked
    const cell = {
      col: Math.floor(seededUnit(seed, attempt * 2) ** 2 * cols),
      row: Math.floor(seededUnit(seed, attempt * 2 + 1) ** 2 * rows),
    }
    if (picked.some((block) => touches(block, cell))) return picked
    const reach = Math.hypot(cell.col / cols, cell.row / rows) / Math.SQRT2
    return [...picked, { ...cell, strength: Number((1 - reach * 0.7).toFixed(2)) }]
  }, [])
}

function Lines({ variant }: { variant: GridBackgroundVariant }) {
  if (variant === "perspective") {
    return (
      <div className="absolute inset-0 [container-type:size]">
        <div className="absolute inset-0" style={STAGE_STYLE}>
          <div data-slot="grid-background-plane" className="absolute" style={PLANE_STYLE} />
        </div>
      </div>
    )
  }
  const style = variant === "fade" ? FADE_STYLE : variant === "blocks" ? BLOCK_LINES_STYLE : LINES_STYLE
  return <div data-slot="grid-background-lines" className="absolute inset-0" style={style} />
}

function Blocks({ seed }: { seed: number }) {
  const blocks = useMemo(() => pickGridBlocks(seed), [seed])
  return blocks.map((block) => (
    <div
      key={`${block.col}-${block.row}`}
      data-slot="grid-background-block"
      className="absolute bg-mise-soft"
      style={{
        top: `calc(${CELL} * ${block.row} - 1px)`,
        right: `calc(${CELL} * ${block.col})`,
        width: CELL,
        height: CELL,
        opacity: block.strength,
      }}
    />
  ))
}

type GridBackgroundProps = React.ComponentProps<"div"> & {
  /** `lines` even hairlines, `fade` lines dissolve toward the edges, `perspective` a floor receding to a horizon, `blocks` a few filled cells in the top right. */
  variant?: GridBackgroundVariant
  /** `pointer` brightens the lines around the pointer. Off on touch. */
  effect?: GridBackgroundEffect
  /** Which cells `blocks` fills. The same seed always gives the same cells. */
  seed?: number
}

/** Change the cell size from the outside: `className="[--mise-grid-cell:48px]"`. */
function GridBackground({ variant = "lines", effect, seed = 7, className, children, onPointerMove, onPointerLeave, ...props }: GridBackgroundProps) {
  const { lit, handlers } = useBackgroundPointer(effect === "pointer", { onPointerMove, onPointerLeave })
  return (
    <div
      {...props}
      {...handlers}
      data-slot="grid-background"
      data-variant={variant}
      data-effect={effect}
      data-lit={lit ? "true" : undefined}
      className={cn("relative isolate overflow-clip", className)}
    >
      <div
        aria-hidden="true"
        data-slot="grid-background-layer"
        className="pointer-events-none absolute inset-0 rounded-[inherit] [--mise-grid-line:var(--border)] contrast-more:hidden forced-colors:hidden"
      >
        {variant === "blocks" ? <Blocks seed={seed} /> : null}
        <Lines variant={variant} />
        {effect === "pointer" ? (
          <BackgroundPointerLayer lit={lit} className="[--mise-grid-line:color-mix(in_oklab,var(--mise)_70%,transparent)]">
            <Lines variant={variant} />
          </BackgroundPointerLayer>
        ) : null}
      </div>
      <div data-slot="grid-background-content" className="relative h-full min-h-[inherit]">
        {children}
      </div>
    </div>
  )
}

export { GridBackground, pickGridBlocks, seededUnit, type GridBackgroundProps, type GridBackgroundVariant, type GridBackgroundEffect, type GridBlock }
