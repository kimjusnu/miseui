import type * as React from "react"
import { createRef, useMemo, useRef } from "react"
import { AnimatedBeam, type AnimatedBeamEffect } from "@/registry/miseui/ui/animated-beam-line"
import { cn } from "@/registry/miseui/lib/utils"

interface HubNode {
  id: string
  /** Names it for assistive tech. The tile itself shows only the icon. */
  label: string
  icon: React.ReactNode
}

type AnimatedBeamHubProps = Omit<React.ComponentProps<"div">, "ref" | "children"> & {
  /** What flows in. Beyond about five, the row wraps in a narrow container. */
  sources: readonly HubNode[]
  center: HubNode
  effect?: AnimatedBeamEffect
  /** Seconds of one cycle per beam. */
  duration?: number
  paused?: boolean
  reverse?: boolean
  /** With `pulse`, a new value sends one light down every beam. */
  trigger?: unknown
  /** Names the whole picture for assistive tech. */
  label?: string
}

const TILE_CLASS = "flex items-center justify-center rounded-xl border bg-background text-foreground shadow-sm [&_svg]:size-4 [&_svg]:shrink-0"

/** Stacks in a narrow container and lies down when there is room. The beams need no telling: they are measured, and read the layout. */
function AnimatedBeamHub({ sources, center, effect, duration = 4, paused = false, reverse = false, trigger, label, className, ...props }: AnimatedBeamHubProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const sourceRefs = useMemo(() => sources.map(() => createRef<HTMLDivElement>()), [sources])
  const stagger = duration / Math.max(sources.length, 1)
  return (
    <div
      {...props}
      ref={rootRef}
      role="group"
      aria-label={label}
      data-slot="animated-beam-hub"
      data-variant="hub"
      data-effect={effect}
      className={cn("@container relative isolate w-full min-w-0", className)}
    >
      <div className="flex flex-col items-center gap-12 @md:flex-row @md:justify-center @md:gap-24">
        <ul data-slot="animated-beam-hub-sources" className="grid w-full grid-cols-[repeat(auto-fit,minmax(40px,1fr))] justify-items-center gap-y-3 @md:w-auto @md:grid-cols-1">
          {sources.map((source, index) => (
            <li key={source.id}>
              <div ref={sourceRefs[index]} role="img" aria-label={source.label} className={cn(TILE_CLASS, "size-10")}>
                {source.icon}
              </div>
            </li>
          ))}
        </ul>
        <div ref={centerRef} role="img" aria-label={center.label} data-slot="animated-beam-hub-center" className={cn(TILE_CLASS, "size-12 rounded-2xl border-transparent bg-mise text-mise-foreground ring-1 ring-foreground/10")}>
          {center.icon}
        </div>
      </div>
      {sources.map((source, index) => (
        <AnimatedBeam
          key={source.id}
          containerRef={rootRef}
          fromRef={sourceRefs[index] as React.RefObject<HTMLDivElement | null>}
          toRef={centerRef}
          variant="hub"
          effect={effect}
          reverse={reverse}
          duration={duration}
          delay={index * stagger}
          paused={paused}
          trigger={trigger}
        />
      ))}
    </div>
  )
}

export { AnimatedBeamHub, type AnimatedBeamHubProps, type HubNode }
