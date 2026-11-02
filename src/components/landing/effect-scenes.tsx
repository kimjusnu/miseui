import { BeamBorder } from "@/registry/miseui/ui/beam-border"
import { GooeyMorph } from "@/registry/miseui/ui/gooey-morph"
import { LiquidMetal } from "@/registry/miseui/ui/liquid-metal"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import { ThinkingOrb, type OrbState } from "@/registry/miseui/ui/thinking-orb"
import { VoiceGlow } from "@/registry/miseui/ui/voice-glow"
import { useCycle } from "./use-cycle"

/** The bare effects, without the buttons and captions their documentation demos carry. */

const ORB_STATES: readonly OrbState[] = ["listening", "thinking", "speaking", "idle"]
const ORB_MS = 3200
const GOOEY_ITEMS = [
  { id: "plan", label: "Plan" },
  { id: "search", label: "Search" },
  { id: "write", label: "Write" },
]
const GOOEY_PHASES = 2
const GOOEY_MS = 2200
const SHIMMER_STEPS = ["Thinking…", "Reading 12 files…", "Drafting reply…"]
const SHIMMER_MS = 2700
const VOICE_TICK_MS = 120
const VOICE_TICKS = 100_000
const VOICE_SLOW_RADIANS = 0.3
const VOICE_FAST_RADIANS = 1.15
const VOICE_FAST_SHARE = 0.35

export function OrbScene({ size = 76 }: { size?: number }) {
  const index = useCycle(ORB_STATES.length, ORB_MS)
  return <ThinkingOrb state={ORB_STATES[index]} size={size} />
}

export function BeamScene() {
  return (
    <BeamBorder size={90} className="w-full rounded-xl">
      <div className="flex flex-col gap-2 rounded-xl border bg-background/60 p-3.5">
        <span className="h-2 w-3/4 rounded-full bg-foreground/70" />
        <span className="h-2 w-full rounded-full bg-muted-foreground/40" />
        <span className="h-2 w-2/3 rounded-full bg-muted-foreground/40" />
      </div>
    </BeamBorder>
  )
}

export function MetalScene() {
  return (
    <LiquidMetal intensity={0.85} className="rounded-full shadow-sm">
      <span className="relative inline-flex h-11 items-center rounded-full px-7 text-[15px] font-medium text-[oklch(0.2_0_0)]">
        Continue
      </span>
    </LiquidMetal>
  )
}

/** A slow swell with a quicker wobble on top reads as someone speaking. */
function voiceLevel(tick: number) {
  const slow = (Math.sin(tick * VOICE_SLOW_RADIANS) + 1) / 2
  const fast = (Math.sin(tick * VOICE_FAST_RADIANS) + 1) / 2
  return slow * (1 - VOICE_FAST_SHARE) + fast * VOICE_FAST_SHARE
}

export function VoiceScene({ size = 104 }: { size?: number }) {
  const tick = useCycle(VOICE_TICKS, VOICE_TICK_MS)
  return <VoiceGlow active level={voiceLevel(tick)} size={size} />
}

export function GooeyScene() {
  const phase = useCycle(GOOEY_PHASES, GOOEY_MS)
  return <GooeyMorph items={GOOEY_ITEMS} merged={phase === 1} size={18} gap={14} />
}

export function ShimmerScene() {
  const index = useCycle(SHIMMER_STEPS.length, SHIMMER_MS)
  return <ShimmerText className="text-[17px] font-medium">{SHIMMER_STEPS[index]}</ShimmerText>
}
