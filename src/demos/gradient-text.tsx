import { useState } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { GradientText, type GradientTextProps } from "@/registry/miseui/ui/gradient-text"

const HEADLINE_CLASS = "block text-[clamp(24px,9cqi,34px)] leading-tight font-semibold tracking-tight"

function Headline({ label, ...props }: GradientTextProps & { label: string }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <GradientText as="h3" className={HEADLINE_CLASS} {...props} />
    </div>
  )
}

export function Demo() {
  const [run, setRun] = useState(0)
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setRun(run + 1)}>
          <RotateCcw aria-hidden="true" />
          Play again
        </Button>
        <Button variant="outline" size="sm" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? "Resume flow" : "Pause flow"}
        </Button>
      </div>
      <div key={run} className="grid gap-8 sm:grid-cols-2">
        <Headline label="fade">Ship the quiet version, and nothing else</Headline>
        <Headline label="accent" variant="accent">Every sentence earns its place</Headline>
        <Headline label="aurora" variant="aurora">Fewer screens, clearer choices</Headline>
        <Headline label="metal" variant="metal">Built to outlast the roadmap</Headline>
        <Headline label="aurora, flow effect" variant="aurora" effect="flow" paused={paused}>Start with the first page</Headline>
        <Headline label="accent, flow effect" variant="accent" effect="flow" paused={paused}>Quiet tools for loud weeks</Headline>
      </div>
    </div>
  )
}
