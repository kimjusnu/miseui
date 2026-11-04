import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Status, type StatusTone } from "@/registry/miseui/ui/status"

interface EmptyStateSampleRow {
  id: string
  title: string
  detail: string
  status: string
  tone?: StatusTone
  when: string
}

/** Invented rows, shown only after someone asks for them, and labelled as made up on the screen. */
const DEFAULT_ROWS: readonly EmptyStateSampleRow[] = [
  { id: "board", title: "Q3 board summary", detail: "Five things from a 42 page PDF", status: "In review", tone: "warning", when: "2 hours ago" },
  { id: "plan", title: "Onboarding plan", detail: "Rough notes with owners and dates", status: "Draft", tone: "neutral", when: "Yesterday" },
  { id: "sync", title: "Weekly sync", detail: "The two-minute version", status: "Done", tone: "success", when: "Oct 28" },
  { id: "pricing", title: "Pricing research", detail: "Eleven sources, one page", status: "Draft", tone: "neutral", when: "Oct 24" },
]

/** Different on every row, because equal bars read as a loading skeleton and not as a screen waiting to be filled. */
const GHOST_WIDTHS = [
  ["w-2/5", "w-3/5"],
  ["w-1/3", "w-1/2"],
  ["w-1/2", "w-2/5"],
  ["w-1/4", "w-3/5"],
  ["w-2/5", "w-1/3"],
  ["w-1/3", "w-1/2"],
] as const

const ROW_CLASS = "grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 @2xl:grid-cols-[minmax(0,1fr)_112px_96px] @2xl:px-6"
const BAR_CLASS = "block h-2 rounded-full bg-foreground/10 dark:bg-foreground/15"

type SamplePhase = "ghost" | "loading" | "failed" | "loaded"

interface EmptyStateSampleProps extends React.ComponentProps<"section"> {
  title?: string
  /** Continues the title in the same size, one tone quieter. */
  description?: string
  /** The way past the sample: starting for real. */
  actionLabel?: string
  onAction?: () => void
  /** What the ghost turns into. The ghost has as many rows, so nothing jumps. */
  sampleRows?: readonly EmptyStateSampleRow[]
  sampleLabel?: string
  /** Load the sample here. Return a promise to show progress and a retry if it rejects. */
  onUseSample?: () => void | Promise<void>
  onClearSample?: () => void
}

/** Bars and no words: real-looking figures in an empty product would read as someone else's data. */
function SampleGhost({ rows }: { rows: number }) {
  return (
    <div data-testid="empty-state-ghost" aria-hidden="true" className="rounded-2xl border border-dashed bg-background/60 [mask-image:linear-gradient(to_bottom,black_40%,transparent)] dark:bg-card/40">
      {GHOST_WIDTHS.slice(0, rows).map(([first, second], index) => (
        <div key={index} className={cn(ROW_CLASS, index > 0 && "border-t border-dashed")}>
          <div className="flex min-w-0 flex-col gap-2">
            <span className={cn(BAR_CLASS, first)} />
            <span className={cn(BAR_CLASS, second, "opacity-60")} />
          </div>
          <span className={cn(BAR_CLASS, "w-16")} />
          <span className={cn(BAR_CLASS, "hidden w-12 justify-self-end @2xl:block")} />
        </div>
      ))}
    </div>
  )
}

function SampleList({ rows }: { rows: readonly EmptyStateSampleRow[] }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.ul
      aria-label="Sample projects"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING_DEFAULT}
      className="flex flex-col divide-y rounded-2xl border bg-background shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:bg-card dark:shadow-none"
    >
      {rows.map((row) => (
        <li key={row.id} className={ROW_CLASS}>
          <div className="min-w-0">
            <p className="text-[15px] leading-normal text-pretty">{row.title}</p>
            <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">{row.detail}</p>
          </div>
          <Status state="custom" tone={row.tone ?? "neutral"} className="text-[13px]">
            {row.status}
          </Status>
          <p className="hidden text-right text-[13px] text-muted-foreground @2xl:block">{row.when}</p>
        </li>
      ))}
    </motion.ul>
  )
}

function useSamplePhase(onUseSample: EmptyStateSampleProps["onUseSample"], onClearSample: EmptyStateSampleProps["onClearSample"]) {
  const [phase, setPhase] = useState<SamplePhase>("ghost")
  const load = async () => {
    setPhase("loading")
    try {
      await onUseSample?.()
      setPhase("loaded")
    } catch {
      // The ghost stays, so a failed load leaves the screen exactly as it was.
      setPhase("failed")
    }
  }
  const clear = () => {
    setPhase("ghost")
    onClearSample?.()
  }
  return { phase, load, clear }
}

/** Each of these buttons replaces the other, and focus must not fall back to the top of the page with it. */
function useFocusAcrossPhases(phase: SamplePhase) {
  const sampleRef = useRef<HTMLButtonElement>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  const previousRef = useRef(phase)
  useEffect(() => {
    const previous = previousRef.current
    previousRef.current = phase
    if (phase === "loaded") clearRef.current?.focus()
    if (phase === "ghost" && previous === "loaded") sampleRef.current?.focus()
  }, [phase])
  return { sampleRef, clearRef }
}

interface SampleActionsProps {
  phase: SamplePhase
  sampleLabel: string
  actionLabel: string
  onAction?: () => void
  onLoad: () => void
  onClear: () => void
}

function SampleActions({ phase, sampleLabel, actionLabel, onAction, onLoad, onClear }: SampleActionsProps) {
  const { sampleRef, clearRef } = useFocusAcrossPhases(phase)
  const loading = phase === "loading"
  if (phase === "loaded") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="mise" size="lg" onClick={onAction}>{actionLabel}</Button>
        <Button ref={clearRef} variant="outline" size="lg" onClick={onClear}>Clear sample data</Button>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Not disabled: a disabled button drops keyboard focus, and it would be lost for the whole load. */}
      <Button ref={sampleRef} variant="mise" size="lg" effect={loading ? "shimmer" : undefined} aria-disabled={loading || undefined} onClick={loading ? undefined : onLoad}>
        {phase === "failed" ? "Try again" : loading ? "Loading sample" : sampleLabel}
      </Button>
      <Button variant="outline" size="lg" onClick={onAction}>{actionLabel}</Button>
    </div>
  )
}

function EmptyStateSample({
  title = "This is where your projects will live.",
  description = "See it filled in first, then clear it when you are ready.",
  actionLabel = "New project",
  onAction,
  sampleRows = DEFAULT_ROWS,
  sampleLabel = "Use sample data",
  onUseSample,
  onClearSample,
  className,
  ...props
}: EmptyStateSampleProps) {
  const { phase, load, clear } = useSamplePhase(onUseSample, onClearSample)
  const loaded = phase === "loaded"

  return (
    <section data-slot="empty-state" data-variant="sample" data-phase={phase} className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div className="px-4 py-12 @2xl:px-8 @2xl:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div className="flex flex-col gap-6">
            <h2 className="text-display text-3xl text-balance @2xl:text-4xl">
              {loaded ? "Sample data is loaded." : title} <span className="text-muted-foreground">{loaded ? "Everything here is made up, and nothing is saved." : description}</span>
            </h2>
            <SampleActions phase={phase} sampleLabel={sampleLabel} actionLabel={actionLabel} onAction={onAction} onLoad={load} onClear={clear} />
            {phase === "failed" ? <p role="alert" className="text-[13px] text-destructive">The sample did not load. Nothing on this screen changed.</p> : null}
          </div>
          {loaded ? <SampleList rows={sampleRows} /> : <SampleGhost rows={sampleRows.length || GHOST_WIDTHS.length} />}
        </div>
      </div>
    </section>
  )
}

export { EmptyStateSample, type EmptyStateSampleProps, type EmptyStateSampleRow }
