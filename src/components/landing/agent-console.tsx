import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { AgentAvatar } from "@/registry/miseui/ui/agent-avatar"
import { BeamBorder } from "@/registry/miseui/ui/beam-border"
import { Button } from "@/registry/miseui/ui/button"
import { IntelligenceGlow } from "@/registry/miseui/ui/intelligence-glow"
import { ReasoningSteps } from "@/registry/miseui/ui/reasoning-steps"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import { StreamingText } from "@/registry/miseui/ui/streaming-text"
import { ThinkingIndicator } from "@/registry/miseui/ui/thinking-indicator"
import { ThinkingOrb, type OrbState } from "@/registry/miseui/ui/thinking-orb"
import { ToolCallCard } from "@/registry/miseui/ui/tool-call-card"
import { VoiceScene } from "./effect-scenes"

const REQUEST = "Summarize last quarter's churn and draft a note to the team."
const ANSWER =
  "Churn fell to 3.1% in Q3, mostly from annual plans renewing early. Here is a note for the team, with the three accounts worth a call this week."
const LISTENING = 0
const THINKING = 1
const TOOL_CALL = 2
const STREAMING = 3
const HAND_BACK = 4
const STREAM_CHARS_PER_SECOND = 48

const ORB_BY_STEP: readonly OrbState[] = ["listening", "thinking", "thinking", "speaking", "idle"]
const REASONING = [
  { id: "read", label: "Read 12 billing exports", status: "done" as const },
  { id: "compare", label: "Compare against Q2", status: "active" as const },
  { id: "draft", label: "Draft the note", status: "pending" as const },
]

function StepBody({ step }: { step: number }) {
  if (step === LISTENING) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <VoiceScene size={112} />
        <StreamingText text={REQUEST} speed={STREAM_CHARS_PER_SECOND} className="max-w-xs text-[15px] text-pretty" />
      </div>
    )
  }
  if (step === THINKING) {
    return (
      <div className="flex flex-col gap-4">
        <ShimmerText className="text-[17px] font-medium">Reading 12 files…</ShimmerText>
        <ReasoningSteps steps={REASONING} defaultOpen />
      </div>
    )
  }
  if (step === TOOL_CALL) {
    return (
      <ToolCallCard
        name="query_billing"
        status="success"
        durationMs={840}
        defaultOpen
        input={{ range: "2026-Q3", metric: "churn" }}
        output={{ churn: "3.1%", previous: "3.9%" }}
      />
    )
  }
  if (step === STREAMING) {
    return <StreamingText text={ANSWER} speed={STREAM_CHARS_PER_SECOND} className="text-[17px] leading-relaxed text-pretty" />
  }
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[17px] leading-relaxed text-pretty">{ANSWER}</p>
      <ThinkingIndicator state="done" size="sm" />
      <div className="flex flex-wrap gap-2">
        <Button variant="mise">Send to team</Button>
        <Button variant="outline">Edit first</Button>
      </div>
    </div>
  )
}

/** The same answer in every state, built from the kit itself. Scrolling picks the step. */
export function AgentConsole({ step }: { step: number }) {
  const reduceMotion = useReducedMotion()
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, filter: "blur(6px)" }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
  const working = step === THINKING || step === TOOL_CALL || step === STREAMING

  return (
    <BeamBorder active={working} size={180} duration={3.2} className="w-full rounded-[28px]">
      <div className="relative overflow-hidden rounded-[28px] border bg-card shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]">
        <IntelligenceGlow active={step === LISTENING} inset intensity={0.7} className="rounded-[28px]" />
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <AgentAvatar seed="mise-assistant" size={28} label="Assistant" />
            <span className="truncate text-sm font-medium">Assistant</span>
          </div>
          <ThinkingOrb state={ORB_BY_STEP[step]} size={24} />
        </div>
        <div className="relative h-64 px-5 py-5 sm:h-[21rem] sm:px-6 sm:py-6">
          <AnimatePresence initial={false}>
            <motion.div
              key={step}
              className="absolute inset-x-5 inset-y-5 overflow-hidden sm:inset-x-6 sm:inset-y-6"
              initial={hidden}
              animate={shown}
              exit={hidden}
              transition={SPRING_DEFAULT}
            >
              <StepBody step={step} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </BeamBorder>
  )
}

export const STORY_STEP_COUNT = HAND_BACK + 1
