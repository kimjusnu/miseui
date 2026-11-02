import type * as React from "react"
import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { motion, useMotionValue, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { IntelligenceGlow } from "@/registry/miseui/ui/intelligence-glow"
import { components } from "@/src/content"
import { BeamScene, GooeyScene, MetalScene, OrbScene, ShimmerScene, VoiceScene } from "./effect-scenes"
import { HeroTile } from "./hero-tile"

/** Three per side, clear of the headline's 700 px column. Below xl they drop into a grid under the CTAs. */
const TILES = [
  { name: "thinking-orb", Scene: OrbScene, depth: 22, className: "xl:left-[3%] xl:top-[9%]" },
  { name: "liquid-metal", Scene: MetalScene, depth: 12, className: "xl:left-[6.5%] xl:top-[38%]" },
  { name: "shimmer-text", Scene: ShimmerScene, depth: 28, className: "xl:left-[2.5%] xl:top-[67%]" },
  { name: "beam-border", Scene: BeamScene, depth: 16, className: "xl:right-[3%] xl:top-[7%]" },
  { name: "voice-glow", Scene: VoiceScene, depth: 26, className: "xl:right-[6.5%] xl:top-[36%]" },
  { name: "gooey-morph", Scene: GooeyScene, depth: 14, className: "xl:right-[2.5%] xl:top-[65%]" },
] as const

const LINE_STAGGER_SECONDS = 0.08

function Arrive({ order, className, children }: { order: number; className?: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(10px)" }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...SPRING_DEFAULT, delay: order * LINE_STAGGER_SECONDS }}
    >
      {children}
    </motion.div>
  )
}

function HeroCopy() {
  const effectCount = components.filter((c) => c.category === "effects" || c.category === "transitions").length
  const stateCount = components.filter((c) => c.category === "ai").length

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <Arrive order={0}>
        <p className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1 text-xs font-medium text-muted-foreground">
          {components.length} components · {stateCount} AI states · {effectCount} effects & transitions · MIT
        </p>
      </Arrive>
      <Arrive order={1}>
        <h1 className="text-display bg-linear-to-b from-foreground from-40% to-foreground/55 bg-clip-text pb-1.5 text-[2.75rem] text-balance text-transparent sm:text-6xl xl:text-7xl">
          UI that explains itself.
          <br />
          Built for the AI era.
        </h1>
      </Arrive>
      <Arrive order={2}>
        <p className="max-w-xl text-[17px] leading-relaxed text-pretty text-muted-foreground md:text-xl">
          Living effects, AI states and fluid transitions, each with the psychology behind it. Your coding agent
          installs the right piece and keeps the reason.
        </p>
      </Arrive>
      <Arrive order={3} className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="mise" size="lg" asChild>
          <Link to="/components/thinking-orb">
            Browse the kit <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs">Get started</Link>
        </Button>
      </Arrive>
    </div>
  )
}

export function Hero() {
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)

  const trackPointer = (event: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1)
    pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1)
  }
  const releasePointer = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <section
      onPointerMove={trackPointer}
      onPointerLeave={releasePointer}
      className="dark relative isolate flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 text-foreground md:px-6 xl:min-h-[max(44rem,calc(100dvh-3.5rem))]"
    >
      <div className="pointer-events-none absolute inset-1.5 -z-10 rounded-[26px] bg-[radial-gradient(ellipse_70%_55%_at_50%_108%,color-mix(in_oklch,var(--mise)_30%,transparent),transparent)]">
        <IntelligenceGlow active inset intensity={0.42} />
      </div>
      <HeroCopy />
      <div className="mt-12 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3 xl:contents">
        {TILES.map(({ name, Scene, depth, className }, index) => (
          <HeroTile
            key={name}
            name={name}
            index={index}
            depth={depth}
            pointerX={pointerX}
            pointerY={pointerY}
            className={className}
          >
            <Scene />
          </HeroTile>
        ))}
      </div>
    </section>
  )
}
