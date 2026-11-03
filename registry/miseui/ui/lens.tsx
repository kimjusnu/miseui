import type * as React from "react"
import { useLayoutEffect } from "react"
import { useLens, type LensEffect, type LensVariant } from "@/registry/miseui/ui/lens-state"
import type { Point } from "@/registry/miseui/ui/lens-math"
import { cn } from "@/registry/miseui/lib/utils"

const DEFAULT_SIZE: Record<LensVariant, number> = { circle: 128, square: 112, panel: 0, strip: 64 }

const GLASS_CLASS: Record<Exclude<LensVariant, "panel">, string> = {
  circle: "rounded-full shadow-xl ring-1 shadow-black/25 ring-foreground/10",
  square: "rounded-md ring-1 ring-foreground/40",
  strip: "shadow-[0_-1px_0_var(--border),0_1px_0_var(--border),0_8px_24px_-8px_rgb(0_0_0/0.25)]",
}

const ROOT_CLASS = "@container min-w-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
const PRESS_CLASS = "touch-none [-webkit-touch-callout:none] pointer-coarse:select-none"
const REGION_CLASS = "pointer-events-none absolute top-0 left-0 rounded-sm bg-foreground/5 ring-1 ring-foreground/50"
const PANEL_CLASS = "relative aspect-[2/1] min-w-0 overflow-hidden rounded-lg border bg-background @md:aspect-auto"
const FADE_CLASS = "transition-[opacity,scale] duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none"

interface CopyProps {
  copyRef: React.RefObject<HTMLDivElement | null>
  width: number
  height: number
  children: React.ReactNode
}

/**
 * Hidden and inert, so focus and assistive tech never reach the second copy. Ids and form names are stripped as well:
 * two equal ids break label and aria references, and an inert radio with the same name would still take its group's selection.
 */
function LensCopy({ copyRef, width, height, children }: CopyProps) {
  useLayoutEffect(() => {
    copyRef.current?.querySelectorAll("[id], [name]").forEach((element) => {
      element.removeAttribute("id")
      element.removeAttribute("name")
    })
  })
  return (
    <div
      ref={copyRef}
      aria-hidden="true"
      inert
      data-slot="lens-copy"
      className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
      style={{ width, height }}
    >
      {children}
    </div>
  )
}

function SquareMarks({ zoom }: { zoom: number }) {
  return (
    <>
      <span aria-hidden="true" data-slot="lens-crosshair" className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 [background:linear-gradient(var(--foreground),var(--foreground))_center/100%_1px_no-repeat,linear-gradient(var(--foreground),var(--foreground))_center/1px_100%_no-repeat] opacity-50" />
      <span aria-hidden="true" data-slot="lens-zoom" className="absolute right-1 bottom-1 rounded-sm bg-background/85 px-1 text-xs text-foreground tabular-nums">
        {zoom}x
      </span>
    </>
  )
}

type LensProps = Omit<React.ComponentProps<"div">, "aria-label"> & {
  /** Names the magnifier and says how to use it, for keyboard and screen reader users. */
  label?: string
  /** `circle` a round lens on the pointer, `square` a loupe lifted off the point it reads, `panel` a zoomed view beside the content, `strip` a full-width band. */
  variant?: LensVariant
  /** `press` shows it only while pressed, and a finger can drag it. */
  effect?: LensEffect
  /** How many times larger. At least 1. */
  zoom?: number
  /** Diameter of `circle`, side of `square`, height of `strip`, in px. `panel` takes its size from the layout. */
  size?: number
  /** Where the lens rests until someone moves it, as fractions of the content. It stays visible there. */
  defaultPoint?: Point
  /** For the view behind the zoomed content, when the content sits on something other than the page background. */
  lensClassName?: string
}

function Lens({ label = "Magnifier. Arrow keys move it, Escape hides it.", variant = "circle", effect, zoom = 2, size, defaultPoint, lensClassName, className, children, ...props }: LensProps) {
  const { contentRef, panelRef, bodyRef, copyRef, regionRef, box, view, zoom: shownZoom, shown, armed, pointer, keys } = useLens({ variant, effect, zoom, size: size ?? DEFAULT_SIZE[variant], defaultPoint })
  const panel = variant === "panel"
  const fade = shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
  const copy =
    armed && box ? (
      <LensCopy copyRef={copyRef} width={box.width} height={box.height}>
        {children}
      </LensCopy>
    ) : null
  const stage = (
    // Only `press` owns the gesture. Without it a swipe over the content has to keep scrolling the page.
    <div data-slot="lens-stage" className={cn("relative isolate min-w-0 pointer-fine:cursor-zoom-in", effect === "press" && PRESS_CLASS)} {...pointer}>
      <div ref={contentRef} data-slot="lens-content" className="min-w-0">
        {children}
      </div>
      {panel ? (
        <div ref={regionRef} aria-hidden="true" data-slot="lens-region" className={cn(REGION_CLASS, FADE_CLASS, shown ? "opacity-100" : "opacity-0")} />
      ) : (
        <div ref={bodyRef} aria-hidden="true" data-slot="lens-view" className="pointer-events-none absolute top-0 left-0 z-10" style={view ?? undefined}>
          <div className={cn("relative size-full overflow-hidden bg-background", GLASS_CLASS[variant as Exclude<LensVariant, "panel">], FADE_CLASS, fade, lensClassName)}>
            {copy}
            {variant === "square" ? <SquareMarks zoom={shownZoom} /> : null}
          </div>
        </div>
      )}
    </div>
  )
  return (
    <div role="group" tabIndex={0} aria-label={label} data-slot="lens" data-variant={variant} data-effect={effect} data-shown={shown ? "true" : "false"} className={cn(ROOT_CLASS, className)} {...keys} {...props}>
      {panel ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 @md:grid-cols-2">
          {stage}
          <div ref={panelRef} aria-hidden="true" data-slot="lens-panel" className={cn(PANEL_CLASS, lensClassName)}>
            {copy}
          </div>
        </div>
      ) : (
        stage
      )}
    </div>
  )
}

export { Lens, type LensProps, type LensVariant, type LensEffect }
