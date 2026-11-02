import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/miseui/ui/tabs"
import { CodeBlock } from "@/src/components/code-block"
import { findComponent } from "@/src/content"
import { STAGES, type Stage } from "./effect-stage-list"
import { SectionHeading } from "./section-heading"

const PLAIN = {
  name: "plain",
  principle: "The default",
  use: "What you already expect. It stays the default, and it is often the right call.",
}

function EffectOption({
  option,
  selected,
  onSelect,
}: {
  option: typeof PLAIN
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "rounded-2xl px-4 py-3 text-left outline-none transition-[background-color,scale] duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] active:duration-100",
        selected ? "bg-accent" : "hover:bg-accent/60",
      )}
    >
      <span className="block text-sm font-medium">
        <code className="font-mono text-[13px]">{option.name}</code>
        <span className="text-muted-foreground"> · {option.principle}</span>
      </span>
      {selected ? <span className="mt-1 block text-sm leading-relaxed text-pretty text-muted-foreground">{option.use}</span> : null}
    </button>
  )
}

function StagePanel({ stage }: { stage: Stage }) {
  const reduceMotion = useReducedMotion()
  const [selected, setSelected] = useState(() => stage.initial ?? findComponent(stage.name)?.effects?.[0]?.name ?? PLAIN.name)
  const options = [PLAIN, ...(findComponent(stage.name)?.effects ?? [])]
  const effect = selected === PLAIN.name ? undefined : selected
  const { Render } = stage

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="dark flex min-h-80 items-center justify-center rounded-[28px] bg-background p-8 text-foreground">
          <motion.div
            key={selected}
            className="flex w-full justify-center"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: "blur(8px)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={SPRING_DEFAULT}
          >
            <Render effect={effect} />
          </motion.div>
        </div>
        <CodeBlock code={stage.code(effect)} language="tsx" />
      </div>
      <div role="group" aria-label={`${stage.name} effects`} className="flex flex-col gap-1">
        {options.map((option) => (
          <EffectOption
            key={option.name}
            option={option}
            selected={option.name === selected}
            onSelect={() => setSelected(option.name)}
          />
        ))}
      </div>
    </div>
  )
}

export function EffectPlayground() {
  return (
    <section aria-labelledby="playground-heading" className="rounded-[28px] bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-10 md:py-20">
        <SectionHeading id="playground-heading" lead="Boring by default." quiet="Alive on demand." />
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">
          Every core component starts as the plain one you expect. Pass one prop and it comes alive, and the reason for
          that effect comes with it.
        </p>
        <Tabs effect="spring" defaultValue={STAGES[0].name} className="mt-10 gap-6">
          <TabsList className="h-auto flex-wrap justify-start">
            {STAGES.map((stage) => (
              <TabsTrigger key={stage.name} value={stage.name} className="capitalize">
                {stage.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {STAGES.map((stage) => (
            <TabsContent key={stage.name} value={stage.name}>
              <StagePanel stage={stage} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
