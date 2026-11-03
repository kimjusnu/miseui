import type * as React from "react"
import { useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { DEFAULT_DELAY_MS, DEFAULT_MIN_VISIBLE_MS, useDelayedOverlay } from "@/registry/miseui/ui/loading-overlay-state"
import { Skeleton } from "@/registry/miseui/ui/skeleton"
import { Spinner } from "@/registry/miseui/ui/spinner"
import { cn } from "@/registry/miseui/lib/utils"

type LoadingOverlayVariant = "spinner" | "blur" | "skeleton" | "bar"
type LoadingOverlayEffect = "fade"

const INSTANT = { duration: 0 } as const
const BAR_SECONDS = 1.2
const DEFAULT_SKELETON_LINES = 3
/** A last line this short is what makes a stack of bars read as a paragraph. */
const LAST_LINE_CLASS = "w-3/5"

const COVER_CLASS: Record<LoadingOverlayVariant, string> = {
  spinner: "grid place-items-center bg-background/70",
  blur: "grid place-items-center bg-background/30 backdrop-blur-sm [@media(prefers-reduced-transparency:reduce)]:bg-background/90 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
  // Opaque: the skeleton replaces the content, which is stale and should not show through between its bars.
  skeleton: "overflow-hidden bg-background p-4",
  // Nothing covers the view: the old content stays readable, and pressing it does nothing while it refreshes.
  bar: "overflow-hidden",
}

function BarTrack({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <span aria-hidden="true" data-slot="loading-overlay-bar" className="absolute inset-x-0 top-0 block h-0.5 overflow-hidden bg-border">
      {reduceMotion ? (
        <span className="block h-full w-full bg-mise" />
      ) : (
        <motion.span
          className="block h-full w-1/3 bg-mise"
          initial={{ x: "-100%" }}
          animate={{ x: "300%" }}
          transition={{ duration: BAR_SECONDS, ease: "easeInOut", repeat: Infinity }}
        />
      )}
    </span>
  )
}

function SkeletonLines({ lines }: { lines: number }) {
  return (
    <span aria-hidden="true" data-slot="loading-overlay-skeleton" className="grid gap-3">
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton key={index} effect="pulse" className={cn("h-4", index === lines - 1 && lines > 1 ? LAST_LINE_CLASS : "w-full")} />
      ))}
    </span>
  )
}

interface CoverBodyProps {
  variant: LoadingOverlayVariant
  label: string
  showLabel: boolean
  skeleton: React.ReactNode
  skeletonLines: number
  reduceMotion: boolean
}

function CoverBody({ variant, label, showLabel, skeleton, skeletonLines, reduceMotion }: CoverBodyProps) {
  if (variant === "bar") return <BarTrack reduceMotion={reduceMotion} />
  if (variant === "skeleton") return <>{skeleton ?? <SkeletonLines lines={skeletonLines} />}</>
  if (variant === "blur") {
    return showLabel ? (
      <span aria-hidden="true" className="rounded-full border bg-background px-3 py-1 text-[13px] text-foreground shadow-xs">
        {label}
      </span>
    ) : null
  }
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-2 text-[13px] text-foreground">
      <Spinner size="sm" label="" />
      {showLabel ? label : null}
    </span>
  )
}

type LoadingOverlayProps = React.ComponentProps<"div"> & {
  /** The work is running. The container is marked busy at once; the cover follows after `delay`. */
  loading: boolean
  /** `spinner` a soft scrim with a spinner, `blur` frosts what is behind, `skeleton` replaces it with bars, `bar` a thin line along the top and content left readable. */
  variant?: LoadingOverlayVariant
  /** `fade` eases the cover in and out once the delay has passed. */
  effect?: LoadingOverlayEffect
  /** How long to wait before showing anything, in ms. A faster answer shows nothing at all. */
  delay?: number
  /** Shortest time the cover stays once shown, in ms, so it cannot blink. */
  minVisible?: number
  /** Said to assistive tech when the cover shows. */
  label?: string
  /** Shows the label on screen too. On by default for `blur`, which has nothing else to look at. */
  showLabel?: boolean
  /** Your own skeleton, matching the real content, in place of the generic lines. */
  skeleton?: React.ReactNode
  skeletonLines?: number
  /** Classes for the cover, such as bg-card when the parent is a card. */
  overlayClassName?: string
}

function LoadingOverlay({
  loading,
  variant = "spinner",
  effect,
  delay = DEFAULT_DELAY_MS,
  minVisible = DEFAULT_MIN_VISIBLE_MS,
  label = "Loading",
  showLabel,
  skeleton,
  skeletonLines = DEFAULT_SKELETON_LINES,
  overlayClassName,
  className,
  children,
  ...props
}: LoadingOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const shown = useDelayedOverlay({ loading, delay, minVisible, contentRef })
  const reduceMotion = useReducedMotion() ?? false
  const transition = effect === "fade" && !reduceMotion ? SPRING_DEFAULT : INSTANT
  return (
    <div data-slot="loading-overlay" data-variant={variant} data-effect={effect} data-shown={shown ? "true" : "false"} aria-busy={loading} className={cn("relative min-w-0", className)} {...props}>
      <div ref={contentRef} data-slot="loading-overlay-content" inert={shown} className={cn("transition-opacity duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none", shown && variant === "bar" && "opacity-60")}>
        {children}
      </div>
      <AnimatePresence initial={false}>
        {shown ? (
          <motion.div
            data-slot="loading-overlay-cover"
            className={cn("absolute inset-0 z-10 rounded-[inherit]", COVER_CLASS[variant], overlayClassName)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            <CoverBody variant={variant} label={label} showLabel={showLabel ?? variant === "blur"} skeleton={skeleton} skeletonLines={skeletonLines} reduceMotion={reduceMotion} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* Stays mounted with changing text: a live region added together with its message is often not read. */}
      <span role="status" className="sr-only">
        {shown ? label : ""}
      </span>
    </div>
  )
}

export { LoadingOverlay, type LoadingOverlayProps, type LoadingOverlayVariant, type LoadingOverlayEffect }
