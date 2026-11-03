import type * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import {
  buildMetro,
  centeredScroll,
  edgeMask,
  scrollEdges,
  stationInDirection,
  type MetroLayout,
  type MetroLine,
  type MetroLineTone,
  type MetroStop,
  type PlacedStation,
} from "@/registry/miseui/ui/metro-map-layout"
import { MetroLegend, MetroLines, MetroStation, type MetroMapVariant } from "@/registry/miseui/ui/metro-map-parts"
import { cn } from "@/registry/miseui/lib/utils"

type MetroMapEffect = "ride"

const LAYOUT: Record<MetroMapVariant, MetroLayout> = {
  transit: { orientation: "horizontal", gap: 112, laneGap: 88, padTime: 64, padLane: 72, bend: "diagonal", corner: 8 },
  tube: { orientation: "horizontal", gap: 112, laneGap: 88, padTime: 64, padLane: 72, bend: "orthogonal", corner: 16 },
  branch: { orientation: "vertical", gap: 56, laneGap: 16, padTime: 28, padLane: 16, bend: "diagonal", corner: 4 },
}

const LABEL_ROOM_PX = 12

type RootAttributes = Omit<React.ComponentProps<"nav">, "children" | "onSelect">

interface MetroMapProps extends RootAttributes {
  /** What the map shows, read out as the name of the navigation landmark. */
  label: string
  lines: readonly MetroLine[]
  /** `transit` 45 degree bends and rings, `tube` right angles and ticks, `branch` a vertical list with the lines in its margin. */
  variant?: MetroMapVariant
  /** `ride` inks the line up to the selected station, so the map also says how far along someone is. */
  effect?: MetroMapEffect
  selected?: string | null
  defaultSelected?: string | null
  /** Gets the pressed element too, so a dialog can grow out of it and return focus to it. */
  onSelect?: (id: string, element: HTMLElement) => void
}

function useStationFocus(scrollerRef: React.RefObject<HTMLDivElement | null>, reduceMotion: boolean) {
  const findStation = (id: string) =>
    [...(scrollerRef.current?.querySelectorAll<HTMLElement>("[data-station]") ?? [])].find((element) => element.dataset.station === id)

  const center = (id: string, behavior: ScrollBehavior) => {
    const scroller = scrollerRef.current
    const element = findStation(id)
    if (!scroller || !element) return
    scroller.scrollTo?.({ left: centeredScroll(element.offsetLeft, element.offsetWidth, scroller.clientWidth), behavior })
  }

  const focusStation = (id: string) => {
    findStation(id)?.focus({ preventScroll: true })
    center(id, reduceMotion ? "auto" : "smooth")
  }

  return { center, focusStation }
}

function useScrollFade(scrollerRef: React.RefObject<HTMLDivElement | null>) {
  const [edges, setEdges] = useState({ start: false, end: false })
  const measure = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const next = scrollEdges(scroller)
    setEdges((previous) => (previous.start === next.start && previous.end === next.end ? previous : next))
  }, [scrollerRef])

  useEffect(() => {
    measure()
    const scroller = scrollerRef.current
    if (!scroller || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [measure, scrollerRef])

  return { mask: edgeMask(edges), onScroll: measure }
}

function MetroMap({
  label, lines, variant = "transit", effect, selected, defaultSelected = null, onSelect, className, ...props
}: MetroMapProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const plan = useMemo(() => buildMetro(lines, LAYOUT[variant]), [lines, variant])
  const [uncontrolled, setUncontrolled] = useState(defaultSelected)
  const [focused, setFocused] = useState<string | null>(null)
  const current = selected === undefined ? uncontrolled : selected
  const enabled = plan.stations.filter((station) => !station.disabled)
  const tabStop = focused ?? current ?? enabled[0]?.id
  const { center, focusStation } = useStationFocus(scrollerRef, reduceMotion)
  const fade = useScrollFade(scrollerRef)
  const layout = LAYOUT[variant]
  const branch = variant === "branch"
  // The labels start past the widest lane, so the lines keep a clear margin.
  const gutter = plan.width + LABEL_ROOM_PX

  // Opens on the current station even when it starts out of view on a narrow screen.
  useEffect(() => {
    if (current) center(current, "auto")
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the first paint only; later moves scroll with their own behaviour
  }, [])

  const pick = (station: PlacedStation, element: HTMLElement) => {
    setUncontrolled(station.id)
    onSelect?.(station.id, element)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!tabStop) return
    let next: string | null | undefined = stationInDirection(plan.stations, tabStop, event.key)
    if (event.key === "Home") next = enabled[0]?.id
    if (event.key === "End") next = enabled.at(-1)?.id
    if (!next) {
      // A dead-end arrow still must not scroll the page out from under the map.
      if (event.key.startsWith("Arrow")) event.preventDefault()
      return
    }
    event.preventDefault()
    setFocused(next)
    focusStation(next)
  }

  return (
    <nav
      aria-label={label}
      data-slot="metro-map"
      data-variant={variant}
      data-effect={effect}
      className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      <div
        ref={scrollerRef}
        data-slot="metro-map-scroller"
        className="min-w-0 overflow-x-auto overscroll-x-contain"
        style={{ maskImage: fade.mask }}
        onScroll={fade.onScroll}
      >
        <div
          data-slot="metro-map-canvas"
          className="relative"
          style={{ width: branch ? "100%" : plan.width, height: plan.height, minWidth: branch ? gutter + 160 : undefined }}
        >
          <MetroLines
            plan={plan}
            variant={variant}
            selected={plan.stations.find((station) => station.id === current)}
            ride={effect === "ride"}
            reduceMotion={reduceMotion}
          />
          {plan.stations.map((station) => (
            <MetroStation
              key={station.id}
              station={station}
              variant={variant}
              selected={station.id === current}
              focusable={station.id === tabStop}
              gap={layout.gap}
              gutter={gutter}
              labelAbove={station.lane === 0}
              onPick={pick}
              onFocusStation={setFocused}
            />
          ))}
        </div>
      </div>
      <MetroLegend plan={plan} />
    </nav>
  )
}

export { MetroMap, type MetroMapProps, type MetroMapVariant, type MetroMapEffect, type MetroLine, type MetroStop, type MetroLineTone }
