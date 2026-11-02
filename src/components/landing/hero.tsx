import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { Button } from "@/registry/miseui/ui/button"
import { components } from "@/src/content"
import { demos } from "@/src/demos"

/** Tiles orbit the headline. Each slot lists candidates; the first one that exists is shown. */
const TILE_SLOTS: ReadonlyArray<{ candidates: readonly string[]; className: string; delay: number }> = [
  { candidates: ["thinking-orb", "thinking-indicator"], className: "left-[4%] top-[14%]", delay: 0 },
  { candidates: ["beam-border", "reasoning-steps"], className: "right-[5%] top-[10%]", delay: 0.8 },
  { candidates: ["liquid-metal", "button"], className: "left-[10%] bottom-[12%]", delay: 1.6 },
  { candidates: ["voice-glow", "voice-wave"], className: "right-[9%] bottom-[16%]", delay: 2.4 },
  { candidates: ["gooey-morph", "streaming-text"], className: "left-[30%] top-[4%]", delay: 3.2 },
  { candidates: ["shimmer-text", "tool-call-card"], className: "right-[28%] bottom-[4%]", delay: 4 },
]

const FLOAT_DISTANCE_PX = 10
const FLOAT_SECONDS = 7

function resolveTile(candidates: readonly string[]) {
  const name = candidates.find((candidate) => demos[candidate] && components.some((c) => c.name === candidate))
  return name ? { name, Demo: demos[name] } : null
}

function FloatingTile({ name, Demo, className, delay }: { name: string; Demo: React.ComponentType; className: string; delay: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={`absolute hidden w-56 md:block ${className}`}
      animate={reduceMotion ? undefined : { y: [0, -FLOAT_DISTANCE_PX, 0] }}
      transition={{ duration: FLOAT_SECONDS, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <Link
        to={`/components/${name}`}
        aria-label={`Open ${name}`}
        className="block rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-white/[0.07]"
      >
        <div className="pointer-events-none flex min-h-24 items-center justify-center overflow-hidden text-foreground">
          <Demo />
        </div>
      </Link>
    </motion.div>
  )
}

export function Hero() {
  const tiles = TILE_SLOTS.map((slot) => ({ slot, tile: resolveTile(slot.candidates) }))
  const effectCount = components.filter((c) => c.category === "effects" || c.category === "transitions").length
  const stateCount = components.filter((c) => c.category === "ai").length

  return (
    <section className="dark relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,_color-mix(in_oklch,var(--mise)_22%,transparent),transparent_60%)]" />
      {tiles.map(({ slot, tile }) =>
        tile ? (
          <FloatingTile key={tile.name} name={tile.name} Demo={tile.Demo} className={slot.className} delay={slot.delay} />
        ) : null,
      )}
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-28 text-center md:py-40">
        <p className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1 text-xs font-medium text-muted-foreground">
          {components.length} components · {stateCount} AI states · {effectCount} effects & transitions · MIT
        </p>
        <h1 className="text-display text-5xl text-balance md:text-7xl">
          UI that explains itself.
          <br />
          Built for the AI era.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground md:text-xl">
          Living effects, AI states and fluid transitions, each with the psychology behind it and an agent skill. Your
          coding agent installs the right piece and keeps the reason.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="mise" size="lg" asChild>
            <Link to="/components/thinking-orb">
              Browse <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/docs">Get started</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
