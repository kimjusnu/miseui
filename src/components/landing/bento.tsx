import type * as React from "react"
import { Suspense } from "react"
import { Link } from "react-router"
import { IntelligenceGlow } from "@/registry/miseui/ui/intelligence-glow"
import { RevealImage, type RevealMode } from "@/registry/miseui/ui/reveal-image"
import { cn } from "@/registry/miseui/lib/utils"
import { findComponent } from "@/src/content"
import { demos } from "@/src/demos"
import { BeamScene, GooeyScene, MetalScene, OrbScene, ShimmerScene, VoiceScene } from "./effect-scenes"
import { SectionHeading } from "./section-heading"
import { useCycle } from "./use-cycle"

const REVEAL_MODES: readonly RevealMode[] = ["blur", "pixelate", "wipe"]
const REVEAL_TICK_MS = 100
const REVEAL_STEP = 0.025
/** Rest on the finished image before the next arrival. */
const REVEAL_HOLD_TICKS = 16
const REVEAL_CYCLE_TICKS = Math.ceil(1 / REVEAL_STEP) + REVEAL_HOLD_TICKS

/** An inline picture with hard edges and a gradient, so every reveal mode has something to work on. */
const REVEAL_SCENE = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a33"/><stop offset=".6" stop-color="#7a4a58"/><stop offset="1" stop-color="#f0a95e"/></linearGradient></defs>
  <rect width="640" height="360" fill="url(#s)"/>
  <circle cx="430" cy="206" r="70" fill="#ffd08a"/>
  <path d="M0 262C120 206 220 300 340 248S540 210 640 262V360H0Z" fill="#2a2433"/>
  <path d="M0 312C160 268 280 340 640 296V360H0Z" fill="#14121c"/>
</svg>`
const REVEAL_SRC = `data:image/svg+xml,${encodeURIComponent(REVEAL_SCENE)}`

function RevealScene() {
  const tick = useCycle(REVEAL_MODES.length * REVEAL_CYCLE_TICKS, REVEAL_TICK_MS)
  const mode = REVEAL_MODES[Math.floor(tick / REVEAL_CYCLE_TICKS)]
  const progress = tick === 0 ? 1 : Math.min(1, (tick % REVEAL_CYCLE_TICKS) * REVEAL_STEP)
  return <RevealImage src={REVEAL_SRC} alt="" mode={mode} progress={progress} className="aspect-video w-full rounded-2xl" />
}

function GlowScene() {
  return (
    <div className="relative grid h-32 w-full place-items-center rounded-2xl bg-background/60">
      <IntelligenceGlow active inset intensity={0.8} className="rounded-2xl" />
      <span className="text-[15px] font-medium">Listening…</span>
    </div>
  )
}

/** A wrapped live demo: its controls stay usable, so the title is the only link on the card. */
function LiveDemo({ name }: { name: string }) {
  const Demo = demos[name]
  return Demo ? (
    <Suspense fallback={null}>
      <Demo />
    </Suspense>
  ) : null
}

function BentoCard({ name, className, children }: { name: string; className?: string; children: React.ReactNode }) {
  const meta = findComponent(name)
  return (
    <article className={cn("flex min-w-0 flex-col justify-between gap-5 rounded-[22px] bg-card p-5 md:p-6", className)}>
      <div className="flex min-h-36 flex-1 items-center justify-center">{children}</div>
      <div>
        <Link
          to={`/components/${name}`}
          className="rounded-md text-[15px] font-medium outline-none hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {meta?.title ?? name}
        </Link>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{meta?.why.principle}</p>
      </div>
    </article>
  )
}

export function Bento() {
  return (
    <section aria-labelledby="effects-heading" className="dark rounded-[28px] bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-10 md:py-20">
        <SectionHeading id="effects-heading" lead="Effects that mean something." quiet="Each one marks a real state, and names when to leave it out." />
        <div className="mt-10 grid gap-3 md:grid-cols-6">
          <BentoCard name="reveal-image" className="md:col-span-3 md:row-span-2">
            <RevealScene />
          </BentoCard>
          <BentoCard name="thinking-orb" className="md:col-span-3 lg:col-span-1">
            <OrbScene size={64} />
          </BentoCard>
          <BentoCard name="voice-glow" className="md:col-span-3 lg:col-span-2">
            <VoiceScene size={96} />
          </BentoCard>
          <BentoCard name="beam-border" className="md:col-span-3 lg:col-span-1">
            <BeamScene />
          </BentoCard>
          <BentoCard name="liquid-metal" className="md:col-span-3 lg:col-span-2">
            <MetalScene />
          </BentoCard>
          <BentoCard name="gooey-morph" className="md:col-span-2">
            <GooeyScene />
          </BentoCard>
          <BentoCard name="shimmer-text" className="md:col-span-2">
            <ShimmerScene />
          </BentoCard>
          <BentoCard name="intelligence-glow" className="md:col-span-2">
            <GlowScene />
          </BentoCard>
        </div>
        <SectionHeading lead="Transitions that keep your place." quiet="Nothing teleports, so nobody gets lost." className="mt-16" />
        <div className="mt-10 grid gap-3 md:grid-cols-6">
          <BentoCard name="use-view-transition" className="md:col-span-3">
            <LiveDemo name="use-view-transition" />
          </BentoCard>
          <BentoCard name="materialize" className="md:col-span-3 lg:col-span-2">
            <LiveDemo name="materialize" />
          </BentoCard>
          <BentoCard name="sheet" className="md:col-span-6 lg:col-span-1">
            <LiveDemo name="sheet" />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
