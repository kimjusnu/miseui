import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { motion, useInView } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { findComponent } from "@/src/content"
import { AgentConsole } from "./agent-console"

const STORY = [
  {
    title: "It hears you.",
    body: "Before a word of output exists, the screen says the microphone is live. Light at the edge, a level that follows your voice.",
    pieces: ["voice-glow", "intelligence-glow"],
  },
  {
    title: "It is working.",
    body: "One beam, on the one surface being written. The rest of the page stays still, so your eye knows where to wait.",
    pieces: ["beam-border", "shimmer-text", "reasoning-steps"],
  },
  {
    title: "It shows its hands.",
    body: "Tool calls appear as they run, with inputs and results in plain view. Trust comes from seeing the work, not from being told about it.",
    pieces: ["tool-call-card"],
  },
  {
    title: "It arrives.",
    body: "Text streams at reading pace behind a quiet cursor. The wait ends gradually, which is why it feels shorter.",
    pieces: ["streaming-text", "thinking-orb"],
  },
  {
    title: "It hands back.",
    body: "The next action lands where the answer ended. Nothing jumps, so you never lose your place.",
    pieces: ["button", "thinking-indicator"],
  },
] as const

const IDLE_STEP_OPACITY = 0.32
/** A step counts as current while it crosses a thin band at the middle of the viewport. */
const ACTIVE_BAND = "-48% 0px -48% 0px"

function StoryStep({ index, active, onEnter }: { index: number; active: boolean; onEnter: (index: number) => void }) {
  const ref = useRef<HTMLLIElement>(null)
  const inBand = useInView(ref, { margin: ACTIVE_BAND })
  const step = STORY[index]

  useEffect(() => {
    if (inBand) onEnter(index)
  }, [inBand, index, onEnter])

  return (
    <motion.li
      ref={ref}
      className="flex min-h-[62vh] flex-col justify-center gap-4 py-8 lg:min-h-[72vh]"
      animate={{ opacity: active ? 1 : IDLE_STEP_OPACITY }}
      transition={SPRING_DEFAULT}
    >
      <h3 className="text-display text-4xl md:text-5xl">{step.title}</h3>
      <p className="max-w-md text-[17px] leading-relaxed text-pretty text-muted-foreground">{step.body}</p>
      <ul className="flex flex-wrap gap-2">
        {step.pieces.map((name) => {
          const meta = findComponent(name)
          if (!meta) return null
          return (
            <li key={name}>
              <Link
                to={`/components/${name}`}
                className="inline-flex flex-wrap items-baseline gap-x-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[13px] font-medium outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-white/[0.09] focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {meta.title}
                <span className="font-normal text-muted-foreground">{meta.why.principle}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </motion.li>
  )
}

export function Story() {
  const [step, setStep] = useState(0)

  return (
    <section aria-labelledby="story-heading" className="dark bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pt-24 md:px-6">
        <h2 id="story-heading" className="text-display max-w-3xl text-4xl text-balance md:text-6xl">
          One answer, five states. Each one designed.
        </h2>
        <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
          Most kits stop at the button. An AI product lives in the seconds around it. Scroll, and every state you see is
          a real component from the kit.
        </p>
        <div className="mt-8 grid gap-x-16 lg:grid-cols-2">
          <div className="sticky top-14 z-10 -mx-4 self-start bg-linear-to-b from-background from-90% to-transparent px-4 py-4 md:-mx-6 md:px-6 lg:top-[calc(50dvh-13rem)] lg:order-2 lg:mx-0 lg:bg-none lg:px-0 lg:py-0">
            <AgentConsole step={step} />
          </div>
          <ol className="pb-24 lg:order-1">
            {STORY.map((item, index) => (
              <StoryStep key={item.title} index={index} active={index === step} onEnter={setStep} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
