import { useState } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { RotatingText, type RotatingTextProps } from "@/registry/miseui/ui/rotating-text"

const LINE_CLASS = "block text-[clamp(20px,7cqi,24px)] leading-snug font-semibold tracking-tight"

function Line({ label, ...props }: RotatingTextProps & { label: string }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <RotatingText as="p" className={LINE_CLASS} {...props} />
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
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>
      <div key={run} className="grid gap-8 sm:grid-cols-2">
        <Line label="slide" before="Invoices for " words={["freelancers", "studios", "small teams"]} after=", sent on time." paused={paused} />
        <Line label="blur" before="A calmer way to " words={["plan", "review", "ship"]} after=" your week." variant="blur" paused={paused} />
        <Line label="flip" before="Open it on your " words={["phone", "tablet", "laptop"]} variant="flip" paused={paused} />
        <Line label="pill" before="Book a " words={["demo", "short call", "walkthrough"]} after=" today." variant="pill" paused={paused} />
        <Line label="letters effect" before="Teams ship " words={["faster", "calmer", "together"]} effect="letters" paused={paused} />
      </div>
    </div>
  )
}
