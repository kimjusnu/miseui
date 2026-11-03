import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { BeamsBackground, type BeamsBackgroundProps } from "@/registry/miseui/ui/beams-background"

const CELLS: readonly { label: string; props: BeamsBackgroundProps }[] = [
  { label: "rays", props: { variant: "rays" } },
  { label: "lines", props: { variant: "lines" } },
  { label: "sweep", props: { variant: "sweep" } },
  { label: "columns", props: { variant: "columns" } },
  { label: "lines, still effect", props: { variant: "lines", effect: "still", seed: 4 } },
  { label: "rays, another seed", props: { variant: "rays", seed: 9 } },
]

function Copy() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="grid gap-1">
        <p className="text-[15px] font-medium text-foreground">Every push gets its own preview</p>
        <p className="text-[13px] text-muted-foreground">Share the link before you merge.</p>
      </div>
      <Button size="sm" className="pointer-coarse:h-10">Create a project</Button>
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
            <BeamsBackground {...props} paused={paused} className="h-50 rounded-lg border">
              <Copy />
            </BeamsBackground>
          </div>
        ))}
      </div>
    </div>
  )
}
