import type * as React from "react"
import { useMemo, useRef, useState } from "react"
import { useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import { useOrbitLoop } from "@/registry/miseui/ui/orbiting-circles-loop"
import { labelPlacement, orbitPose, orbitShape, orbitSlots, poseTransform, type LabelSide, type OrbitVariant } from "@/registry/miseui/ui/orbiting-circles-math"
import { cn } from "@/registry/miseui/lib/utils"

type OrbitingCirclesEffect = "hover"

interface OrbitItem {
  id: string
  /** Names the item for assistive tech, and is what `hover` shows. */
  label: string
  icon: React.ReactNode
  /** Makes it a link. A link stops the orbit under a pointer and under focus, with or without the effect. */
  href?: string
}

type OrbitingCirclesProps = Omit<React.ComponentProps<"div">, "ref" | "children"> & {
  /** `ring` one orbit, `rings` two or three at different speeds, `tilted` an ellipse where items pass behind the centre, `arc` an arch rising from the bottom edge. */
  variant?: OrbitVariant
  /** `hover` stops the orbit on pointing at or focusing any item and shows its label. */
  effect?: OrbitingCirclesEffect
  items: readonly OrbitItem[]
  /** What everything goes around. */
  center?: React.ReactNode
  /** One lap of the innermost orbit. */
  seconds?: number
  /** Holds the motion. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** Names the whole group for assistive tech. */
  label?: string
}

const ROOT_SHAPE: Record<OrbitVariant, string> = {
  ring: "aspect-square",
  rings: "aspect-square",
  tilted: "aspect-[16/10]",
  arc: "aspect-[2/1] overflow-clip",
}
const ITEM_CLASS =
  "flex size-10 items-center justify-center rounded-full border bg-background text-foreground shadow-sm outline-none transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0"
const LABEL_SIDE: Record<LabelSide, string> = { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" }

function OrbitLines({ variant }: { variant: OrbitVariant }) {
  const { radii, squash, centerTop } = orbitShape(variant)
  if (variant === "tilted") {
    // Two halves so the near half can pass in front of the centre and the far half behind it.
    const radius = radii[0] as number
    return (
      <>
        {([["M -50 0 A 50 50 0 0 1 50 0", 1], ["M 50 0 A 50 50 0 0 1 -50 0", 3]] as const).map(([path, layer]) => (
          <svg
            key={layer}
            aria-hidden="true"
            data-slot="orbiting-circles-line"
            viewBox="-50 -50 100 100"
            className="pointer-events-none absolute overflow-visible text-border"
            style={{ left: "50%", top: "50%", width: `${radius * 2}cqw`, height: `${radius * 2 * squash}cqw`, transform: "translate(-50%, -50%)", zIndex: layer }}
            preserveAspectRatio="none"
          >
            <path d={path} fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke" />
          </svg>
        ))}
      </>
    )
  }
  return radii.map((radius) => (
    <span
      key={radius}
      aria-hidden="true"
      data-slot="orbiting-circles-line"
      className="pointer-events-none absolute rounded-full border"
      style={{ left: "50%", top: `${centerTop}%`, width: `${radius * 2}cqw`, height: `${radius * 2}cqw`, transform: "translate(-50%, -50%)" }}
    />
  ))
}

interface OrbitLabelProps {
  text: string
  side: LabelSide
  below: boolean
}

function OrbitLabel({ text, side, below }: OrbitLabelProps) {
  return (
    <span
      data-slot="orbiting-circles-label"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-10 rounded-md bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-border",
        LABEL_SIDE[side],
        below ? "top-full mt-1" : "bottom-full mb-1",
      )}
    >
      {text}
    </span>
  )
}

function OrbitingCircles({ variant = "ring", effect, items, center, seconds = 28, paused = false, label, className, ...props }: OrbitingCirclesProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState<{ index: number; side: LabelSide; below: boolean } | null>(null)
  const [focused, setFocused] = useState(false)
  const [pointed, setPointed] = useState(false)
  const { still, playing } = useBackgroundPlayback(rootRef, { paused })
  const showsLabels = effect === "hover"
  const control = useOrbitLoop(nodesRef, { variant, count: items.length, seconds, playing, still, caught: focused || pointed })
  const { centerTop } = orbitShape(variant)
  // The first frame is placed by the same helper, in the markup, so a server render already looks finished.
  const firstPoses = useMemo(() => orbitSlots(variant, items.length, false).map((slot) => orbitPose(variant, slot, 0)), [variant, items.length])

  const showLabel = (index: number) => {
    if (!showsLabels) return
    const { x, y } = control.poseOf(index)
    setActive({ index, ...labelPlacement(x, y, centerTop) })
  }
  const catchItem = (index: number) => {
    setPointed(true)
    showLabel(index)
  }
  // A finger lifts straight after a tap. Focus stayed behind, so the label stays until focus moves on.
  const letGo = () => {
    setPointed(false)
    if (!focused) setActive(null)
  }

  return (
    <div
      {...props}
      ref={rootRef}
      role="group"
      aria-label={label}
      data-slot="orbiting-circles"
      data-variant={variant}
      data-effect={effect}
      data-playing={still ? undefined : String(playing)}
      className={cn("relative isolate w-full min-w-0 [container-type:inline-size]", ROOT_SHAPE[variant], className)}
    >
      <OrbitLines variant={variant} />
      {center ? (
        <div data-slot="orbiting-circles-center" className={cn("absolute left-1/2 z-2 -translate-x-1/2", variant === "arc" ? "bottom-4" : "top-1/2 -translate-y-1/2")}>
          {center}
        </div>
      ) : null}
      {items.map((item, index) => {
        const pose = firstPoses[index]
        const Tag = item.href ? "a" : "span"
        const isCatchable = showsLabels || Boolean(item.href)
        return (
          <div
            key={item.id}
            ref={(node) => {
              nodesRef.current[index] = node
            }}
            data-slot="orbiting-circles-item"
            className={cn("absolute left-1/2", variant !== "tilted" && "z-3")}
            style={{ top: `${centerTop}%`, transform: pose ? poseTransform(pose) : undefined, opacity: pose?.opacity, zIndex: variant === "tilted" ? (pose?.behind ? 1 : 3) : undefined }}
            onPointerEnter={isCatchable ? () => catchItem(index) : undefined}
            onPointerLeave={isCatchable ? letGo : undefined}
          >
            <Tag
              {...(item.href ? { href: item.href } : { role: "img" })}
              // Its only content is its label, so it takes focus only when the label would otherwise need a mouse.
              tabIndex={!item.href && showsLabels ? 0 : undefined}
              aria-label={item.label}
              className={cn(ITEM_CLASS, variant === "rings" && "size-8 pointer-coarse:size-10", item.href && "hover:bg-accent")}
              onFocus={() => {
                setFocused(true)
                if (variant === "arc" && !still) control.bringToTop(index)
                showLabel(index)
              }}
              onBlur={() => {
                setFocused(false)
                setActive(null)
              }}
            >
              {item.icon}
            </Tag>
            {active?.index === index ? <OrbitLabel text={item.label} side={active.side} below={active.below} /> : null}
          </div>
        )
      })}
    </div>
  )
}

export { OrbitingCircles, type OrbitingCirclesProps, type OrbitVariant as OrbitingCirclesVariant, type OrbitingCirclesEffect, type OrbitItem }
