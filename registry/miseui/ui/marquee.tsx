import type * as React from "react"
import { createContext, useContext, useMemo } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type MarqueeVariant = "plain" | "fade" | "cards" | "logos"
type MarqueeOrientation = "horizontal" | "vertical"

const DEFAULT_DURATION_SECONDS = 30

/**
 * Lives with the component so an install needs no global CSS. React 19 hoists a style with `href` into the head
 * once however many marquees render. The sign flips the travel in right-to-left pages, where the copies run the other way.
 */
const KEYFRAMES =
  "@keyframes mise-marquee-x{to{transform:translateX(calc(-100% * var(--mise-marquee-sign,1)))}}@keyframes mise-marquee-y{to{transform:translateY(-100%)}}"

const GAP_CLASS: Record<MarqueeVariant, string> = {
  plain: "[--mise-marquee-gap:2rem]",
  fade: "[--mise-marquee-gap:3rem]",
  cards: "[--mise-marquee-gap:0.75rem]",
  logos: "[--mise-marquee-gap:3rem]",
}

const FADE_MASK: Record<MarqueeOrientation, string> = {
  horizontal: "[mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]",
  vertical: "[mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-3rem),transparent)]",
}

const ITEM_CLASS: Record<MarqueeVariant, string> = {
  plain: "text-sm whitespace-nowrap text-muted-foreground",
  fade: "text-[15px] font-medium whitespace-nowrap",
  cards: "rounded-lg border bg-card p-4 text-sm text-card-foreground",
  logos: "text-base font-semibold tracking-tight whitespace-nowrap text-muted-foreground",
}

const ROW_CLASS: Record<MarqueeOrientation, string> = {
  horizontal: "flex-row items-center pr-(--mise-marquee-gap)",
  vertical: "flex-col items-stretch pb-(--mise-marquee-gap)",
}

const TRAVEL_CLASS: Record<MarqueeOrientation, string> = {
  horizontal: "min-w-full animate-[mise-marquee-x_var(--mise-marquee-duration)_linear_infinite]",
  vertical: "min-h-full animate-[mise-marquee-y_var(--mise-marquee-duration)_linear_infinite]",
}

const PAUSE_ON_ATTENTION =
  "group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]"

const MarqueeContext = createContext<{ variant: MarqueeVariant; orientation: MarqueeOrientation }>({
  variant: "plain",
  orientation: "horizontal",
})

interface CopyProps {
  orientation: MarqueeOrientation
  hidden?: boolean
  reverse: boolean
  paused: boolean
  children: React.ReactNode
}

function MarqueeCopy({ orientation, hidden = false, reverse, paused, children }: CopyProps) {
  return (
    <div
      data-slot="marquee-copy"
      // The repeat is scenery. Inert also keeps any links in it out of the tab order, so nobody tabs through the row twice.
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn(
        "flex shrink-0 justify-around gap-(--mise-marquee-gap) motion-reduce:animate-none",
        ROW_CLASS[orientation],
        TRAVEL_CLASS[orientation],
        PAUSE_ON_ATTENTION,
        reverse && "[animation-direction:reverse]",
        paused && "[animation-play-state:paused]",
      )}
    >
      {children}
    </div>
  )
}

type MarqueeProps = React.ComponentProps<"div"> & {
  /** `plain` a quiet line of text, `fade` larger with masked edges, `cards` a row of surfaces, `logos` text wordmarks. */
  variant?: MarqueeVariant
  /** Runs top to bottom. Give the root a height; the default is 192 px. */
  vertical?: boolean
  reverse?: boolean
  /** Seconds for one full pass. A longer row needs more, to keep the same speed. */
  duration?: number
  /** Holds it still, for a pause button of your own. Hover and focus already pause it. */
  paused?: boolean
}

function Marquee({
  variant = "plain",
  vertical = false,
  reverse = false,
  duration = DEFAULT_DURATION_SECONDS,
  paused = false,
  className,
  style,
  children,
  onBlur,
  ...props
}: MarqueeProps) {
  const reduceMotion = useReducedMotion() ?? false
  const orientation: MarqueeOrientation = vertical ? "vertical" : "horizontal"
  const context = useMemo(() => ({ variant, orientation }), [variant, orientation])
  const root = {
    ...props,
    "data-slot": "marquee",
    "data-variant": variant,
    "data-orientation": orientation,
  }
  const base = cn("group/marquee flex w-full min-w-0 rtl:[--mise-marquee-sign:-1]", vertical && "h-48 flex-col", GAP_CLASS[variant])
  // People who turned motion off still get the whole row, by scrolling it themselves.
  const still = (
    <div
      {...root}
      data-static="true"
      tabIndex={0}
      style={style}
      className={cn(
        base,
        "gap-(--mise-marquee-gap) outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        vertical ? "overflow-y-auto" : "items-center overflow-x-auto",
        className,
      )}
    >
      {children}
    </div>
  )
  const moving = (
    <div
      {...root}
      data-paused={paused ? "true" : undefined}
      style={{ "--mise-marquee-duration": `${duration}s`, ...style } as React.CSSProperties}
      className={cn(base, "overflow-hidden", variant === "fade" && FADE_MASK[orientation], className)}
      onBlur={(event) => {
        onBlur?.(event)
        // Focusing an off-screen link scrolls this clipped box. Undo it, or the loop runs on with a permanent offset.
        if (event.currentTarget.contains(event.relatedTarget)) return
        event.currentTarget.scrollTo?.(0, 0)
      }}
    >
      <MarqueeCopy {...{ orientation, reverse, paused }}>{children}</MarqueeCopy>
      <MarqueeCopy {...{ orientation, reverse, paused }} hidden>
        {children}
      </MarqueeCopy>
    </div>
  )
  return (
    <MarqueeContext.Provider value={context}>
      {reduceMotion ? null : (
        <style href="mise-marquee" precedence="default">
          {KEYFRAMES}
        </style>
      )}
      {reduceMotion ? still : moving}
    </MarqueeContext.Provider>
  )
}

function MarqueeItem({ className, ...props }: React.ComponentProps<"div">) {
  const { variant, orientation } = useContext(MarqueeContext)
  return (
    <div
      data-slot="marquee-item"
      className={cn(
        "shrink-0",
        ITEM_CLASS[variant],
        variant === "cards" && orientation === "horizontal" && "w-64 max-w-[80vw]",
        className,
      )}
      {...props}
    />
  )
}

export { Marquee, MarqueeItem, type MarqueeProps, type MarqueeVariant }
