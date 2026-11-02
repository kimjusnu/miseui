import type * as React from "react"
import { Link } from "react-router"
import { AgentAvatar } from "@/registry/miseui/ui/agent-avatar"
import { IntelligenceGlow } from "@/registry/miseui/ui/intelligence-glow"
import { RevealImage, type RevealMode } from "@/registry/miseui/ui/reveal-image"
import { cn } from "@/registry/miseui/lib/utils"
import { findComponent } from "@/src/content"
import { demos } from "@/src/demos"
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
const AGENT_SEEDS = ["research", "planner", "writer", "reviewer", "scribe", "scout"] as const

function RevealScene() {
  const tick = useCycle(REVEAL_MODES.length * REVEAL_CYCLE_TICKS, REVEAL_TICK_MS)
  const mode = REVEAL_MODES[Math.floor(tick / REVEAL_CYCLE_TICKS)]
  const progress = tick === 0 ? 1 : Math.min(1, (tick % REVEAL_CYCLE_TICKS) * REVEAL_STEP)
  return <RevealImage src={REVEAL_SRC} alt="" mode={mode} progress={progress} className="aspect-video w-full rounded-2xl" />
}

function GlowScene() {
  return (
    <div className="relative flex h-44 w-full items-center justify-center rounded-2xl bg-background/60">
      <IntelligenceGlow active inset intensity={0.8} className="rounded-2xl" />
      <span className="text-[15px] font-medium">Listening…</span>
    </div>
  )
}

function AvatarScene() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {AGENT_SEEDS.map((seed) => (
        <AgentAvatar key={seed} seed={seed} size={60} label={seed} />
      ))}
    </div>
  )
}

/** A wrapped live demo: its controls stay usable, so the title is the only link on the card. */
function LiveDemo({ name }: { name: string }) {
  const Demo = demos[name]
  return Demo ? <Demo /> : null
}

function BentoCard({ name, className, children }: { name: string; className?: string; children: React.ReactNode }) {
  const meta = findComponent(name)
  return (
    <article className={cn("flex min-w-0 flex-col justify-between gap-6 rounded-[28px] bg-card p-6 md:p-7", className)}>
      <div className="flex min-h-44 flex-1 items-center justify-center">{children}</div>
      <div>
        <Link
          to={`/components/${name}`}
          className="rounded-md text-[17px] font-medium outline-none hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {meta?.title ?? name}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">{meta?.why.principle}</p>
      </div>
    </article>
  )
}

export function Bento() {
  return (
    <section aria-labelledby="effects-heading" className="dark bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-6">
        <h2 id="effects-heading" className="text-display max-w-3xl text-4xl text-balance md:text-6xl">
          Effects that mean something. Transitions that keep your place.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-6">
          <BentoCard name="reveal-image" className="md:col-span-4">
            <RevealScene />
          </BentoCard>
          <BentoCard name="agent-avatar" className="md:col-span-2">
            <AvatarScene />
          </BentoCard>
          <BentoCard name="intelligence-glow" className="md:col-span-2">
            <GlowScene />
          </BentoCard>
          <BentoCard name="use-view-transition" className="md:col-span-4">
            <LiveDemo name="use-view-transition" />
          </BentoCard>
          <BentoCard name="materialize" className="md:col-span-3">
            <LiveDemo name="materialize" />
          </BentoCard>
          <BentoCard name="sheet" className="md:col-span-3">
            <LiveDemo name="sheet" />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
