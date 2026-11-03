import type * as React from "react"
import { useId } from "react"
import { useReducedMotion, useMotionTemplate, useTransform, motion } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { RING_SHAPE, RingItem, type RingGalleryEntry, type RingGalleryVariant } from "@/registry/miseui/ui/ring-gallery-item"
import { ringItemShare, ringRadius, ringStep, useRingState, type RingState } from "@/registry/miseui/ui/ring-gallery-state"
import { cn } from "@/registry/miseui/lib/utils"

type RingGalleryEffect = "momentum"

const STAGE_PADDING_PX = 72
const PERSPECTIVE_ITEMS = 8

type RootAttributes = Omit<React.ComponentProps<"div">, "children">

interface RingGalleryProps extends RootAttributes {
  /** What the ring holds, read out when someone focuses it. */
  label: string
  items: readonly RingGalleryEntry[]
  /** `ring` cards seen from above, `medallion` round faces that always look at you, `cylinder` panels curving around the viewer. */
  variant?: RingGalleryVariant
  /** `momentum` lets a flick spin past several items and settle where it would come to rest. */
  effect?: RingGalleryEffect
  index?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  previousLabel?: string
  nextLabel?: string
}

const FOCUS_CLASS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

interface ListProps {
  label: string
  listId: string
  items: readonly RingGalleryEntry[]
  ring: RingState
}

/** Reduced motion gets a plain list that keeps the same selection model: nothing here needs the spin to be understood. */
function RingFlatList({ label, listId, items, ring }: ListProps) {
  return (
    <div
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${listId}-${ring.active}`}
      data-slot="ring-gallery-stage"
      data-layout="flat"
      className={cn("grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 rounded-lg", FOCUS_CLASS)}
      onKeyDown={ring.onKeyDown}
    >
      {items.map((entry, position) => (
        <div
          key={entry.id}
          id={`${listId}-${position}`}
          role="option"
          aria-selected={position === ring.active}
          data-slot="ring-gallery-item"
          onClick={() => ring.select(position)}
          className="flex min-h-12 min-w-0 cursor-pointer items-center gap-2 rounded-lg border p-2 text-[13px] aria-selected:border-foreground/40 aria-selected:bg-muted aria-selected:font-medium"
        >
          {entry.media ? <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center overflow-hidden">{entry.media}</span> : null}
          <span className="min-w-0">{entry.label}</span>
        </div>
      ))}
    </div>
  )
}

function RingStage({ label, listId, items, ring, variant }: ListProps & { variant: RingGalleryVariant }) {
  const shape = RING_SHAPE[variant]
  const count = items.length
  const rotation = useTransform(ring.turn, (value) => -shape.direction * value * ringStep(count))
  const place = variant === "cylinder" ? "translateZ(var(--ring-radius))" : "translateZ(calc(var(--ring-radius) * -1))"
  // Static parts stay out of the template: useMotionTemplate drops a plain 0, and rotateX(deg) invalidates the whole transform.
  const fixed = `${place} rotateX(${shape.tilt}deg)`
  const transform = useMotionTemplate`${fixed} rotateY(${rotation}deg)`
  const stageStyle = {
    "--ring-item": `min(${shape.maxItem}px, ${(ringItemShare(count) * shape.fill).toFixed(2)}cqw)`,
    "--ring-item-height": `calc(var(--ring-item) * ${shape.ratio})`,
    "--ring-radius": `calc(var(--ring-item) * ${ringRadius(count).toFixed(3)})`,
    height: `calc(var(--ring-item-height) + ${STAGE_PADDING_PX}px)`,
    perspective: `calc(var(--ring-item) * ${PERSPECTIVE_ITEMS})`,
  } as React.CSSProperties
  return (
    <div
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${listId}-${ring.active}`}
      data-slot="ring-gallery-stage"
      data-layout={variant}
      className={cn("relative min-w-0 cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing focus-visible:ring-inset", FOCUS_CLASS)}
      style={stageStyle}
      onKeyDown={ring.onKeyDown}
      {...ring.handlers}
    >
      <motion.div className="absolute top-1/2 left-1/2 size-0 transform-3d" style={{ transform }}>
        {items.map((entry, position) => (
          <RingItem
            key={entry.id}
            entry={entry}
            optionId={`${listId}-${position}`}
            index={position}
            count={count}
            turn={ring.turn}
            variant={variant}
            selected={position === ring.active}
            onPick={ring.select}
          />
        ))}
      </motion.div>
    </div>
  )
}

function RingButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-grid size-10 shrink-0 place-items-center rounded-full border bg-background transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-muted",
        FOCUS_CLASS,
      )}
    >
      {children}
    </button>
  )
}

function RingGallery({
  label, items, variant = "ring", effect, index, defaultIndex = 0, onIndexChange,
  previousLabel = "Previous item", nextLabel = "Next item", className, ...props
}: RingGalleryProps) {
  const listId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const ring = useRingState({ count: items.length, index, defaultIndex, onIndexChange, momentum: effect === "momentum", reduceMotion })
  const current = items[ring.active]
  return (
    <div
      data-slot="ring-gallery"
      data-variant={variant}
      data-effect={effect}
      className={cn("@container grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)}
      {...props}
    >
      {reduceMotion ? (
        <RingFlatList label={label} listId={listId} items={items} ring={ring} />
      ) : (
        <RingStage label={label} listId={listId} items={items} ring={ring} variant={variant} />
      )}
      <div className="flex items-center gap-2">
        <RingButton label={previousLabel} onClick={() => ring.select(ring.active - 1)}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </RingButton>
        <div className="grid min-w-0 flex-1 gap-1 text-center" aria-live="polite" aria-atomic="true" data-slot="ring-gallery-caption">
          <p className="text-[15px] font-semibold tracking-tight">{current?.label}</p>
          {current?.detail ? <p className="text-[13px] text-muted-foreground">{current.detail}</p> : null}
        </div>
        <RingButton label={nextLabel} onClick={() => ring.select(ring.active + 1)}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </RingButton>
      </div>
    </div>
  )
}

export { RingGallery, type RingGalleryProps, type RingGalleryEntry, type RingGalleryVariant, type RingGalleryEffect }
