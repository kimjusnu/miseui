import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { ParticlesBackground, type ParticlesBackgroundProps } from "@/registry/miseui/ui/particles-background"

const CELLS: readonly { label: string; props: ParticlesBackgroundProps }[] = [
  { label: "drift", props: { variant: "drift" } },
  { label: "constellation", props: { variant: "constellation" } },
  { label: "rise", props: { variant: "rise" } },
  { label: "field, move the pointer over it", props: { variant: "field" } },
  { label: "drift, pointer effect", props: { variant: "drift", effect: "pointer", seed: 3 } },
  { label: "constellation, pointer effect", props: { variant: "constellation", effect: "pointer", seed: 7 } },
]

function Copy() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="grid gap-1">
        <p className="text-[15px] font-medium text-foreground">Every team on one map</p>
        <p className="text-[13px] text-muted-foreground">See who is working with whom this week.</p>
      </div>
      <Button size="sm" className="pointer-coarse:h-10">Open the map</Button>
    </div>
  )
}

export function Demo() {
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        {CELLS.map(({ label, props }) => (
          <div key={label} className="grid min-w-0 content-start gap-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <ParticlesBackground {...props} paused={paused} className="h-50 rounded-lg border">
              <Copy />
            </ParticlesBackground>
          </div>
        ))}
      </div>
    </div>
  )
}
