import type * as React from "react"
import { useId } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type SkeletonEffect = "pulse" | "wave" | "gooey"

type SkeletonProps = React.ComponentProps<"div"> & {
  /** How it signals loading. Undefined is the plain pulse. */
  effect?: SkeletonEffect
  /** With effect="gooey": how many lines of text the blocks merge into. */
  lines?: number
}

const DEFAULT_LINES = 3
const BLOCKS_PER_LINE = 4
/** Paragraphs rarely end flush; a shorter last line is what makes the shape read as text. */
const LAST_LINE_WIDTH = "62%"
const WAVE_SECONDS = 1.6
const WAVE_REST_SECONDS = 0.35
const WAVE_BAND = "linear-gradient(90deg, transparent, color-mix(in oklab, var(--mise) 32%, transparent) 50%, transparent)"
const BLOCK_BREATH_SECONDS = 1.4
const BLOCK_STAGGER_SECONDS = 0.09
/** Past 1, so neighbours overlap at the end of the breath and the goo reads one solid bar. */
const BLOCK_SCALE: [number, number] = [0.42, 1.04]
/** Blocks join across gaps under about 5 px, while the 12 px gap between lines stays open. */
const GOO_BLUR = 3
const GOO_ALPHA_SLOPE = 18
const GOO_ALPHA_OFFSET = -7
/** Opaque on purpose: the alpha threshold would erase a translucent fill. */
const GOO_BLOCK_CLASS = "bg-[color-mix(in_oklab,var(--mise)_38%,var(--accent))]"

function WaveSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  const reduceMotion = useReducedMotion()
  return (
    <div
      data-slot="skeleton"
      data-effect="wave"
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded-md bg-accent", className)}
      {...props}
    >
      {/* A transform string runs on the compositor: a loading screen is exactly when the main thread is busy. */}
      <motion.span
        data-testid="skeleton-wave"
        data-reduced={reduceMotion ? "true" : "false"}
        className="absolute inset-0 block"
        style={{ backgroundImage: WAVE_BAND }}
        initial={false}
        animate={{ transform: reduceMotion ? "translateX(0%)" : ["translateX(-100%)", "translateX(100%)"] }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: WAVE_SECONDS, ease: "easeInOut", repeat: Infinity, repeatDelay: WAVE_REST_SECONDS }
        }
      />
    </div>
  )
}

function GooeyFilter({ id }: { id: string }) {
  return (
    <svg className="absolute size-0">
      <defs>
        <filter id={id} x="-5%" y="-20%" width="110%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={GOO_BLUR} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GOO_ALPHA_SLOPE} ${GOO_ALPHA_OFFSET}`}
          />
        </filter>
      </defs>
    </svg>
  )
}

function GooeyLine({ line, width, reduceMotion }: { line: number; width: string; reduceMotion: boolean }) {
  if (reduceMotion) {
    return <div data-testid="skeleton-line" className={cn("h-3 rounded-full", GOO_BLOCK_CLASS)} style={{ width }} />
  }
  return (
    <div data-testid="skeleton-line" className="flex h-3" style={{ width }}>
      {Array.from({ length: BLOCKS_PER_LINE }, (_, block) => (
        <motion.span
          key={block}
          data-testid="skeleton-block"
          className={cn("h-full flex-1", GOO_BLOCK_CLASS)}
          initial={false}
          animate={{ scaleX: BLOCK_SCALE }}
          transition={{
            duration: BLOCK_BREATH_SECONDS,
            delay: (line + block) * BLOCK_STAGGER_SECONDS,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      ))}
    </div>
  )
}

function GooeySkeleton({ className, lines, ...props }: React.ComponentProps<"div"> & { lines: number }) {
  const reduceMotion = useReducedMotion() ?? false
  const filterId = `skeleton-goo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const count = Math.max(1, Math.floor(lines) || 1)
  return (
    <div
      data-slot="skeleton"
      data-effect="gooey"
      data-reduced={reduceMotion ? "true" : "false"}
      aria-hidden="true"
      className={cn("relative rounded-md", className)}
      {...props}
    >
      {reduceMotion ? null : <GooeyFilter id={filterId} />}
      <div
        data-testid="skeleton-field"
        className="flex flex-col gap-3"
        style={reduceMotion ? undefined : { filter: `url(#${filterId})` }}
      >
        {Array.from({ length: count }, (_, line) => (
          <GooeyLine
            key={line}
            line={line}
            width={line === count - 1 && count > 1 ? LAST_LINE_WIDTH : "100%"}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  )
}

function Skeleton({ className, effect, lines = DEFAULT_LINES, ...props }: SkeletonProps) {
  if (effect === "wave") return <WaveSkeleton className={className} {...props} />
  if (effect === "gooey") return <GooeySkeleton className={className} lines={lines} {...props} />
  return (
    <div
      data-slot="skeleton"
      data-effect={effect}
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-accent", effect === "pulse" && "motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton, type SkeletonProps, type SkeletonEffect }
