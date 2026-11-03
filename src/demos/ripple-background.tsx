import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { RippleBackground, type RippleBackgroundProps } from "@/registry/miseui/ui/ripple-background"

const CELLS: readonly { label: string; props: RippleBackgroundProps }[] = [
  { label: "rings", props: { variant: "rings" } },
  { label: "pulse", props: { variant: "pulse" } },
  { label: "sonar", props: { variant: "sonar" } },
  { label: "pond", props: { variant: "pond" } },
  { label: "rings, press effect: press anywhere in the box", props: { variant: "rings", effect: "press" } },
  { label: "pulse, press effect", props: { variant: "pulse", effect: "press" } },
]

function Copy() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="grid gap-1">
        <p className="text-[15px] font-medium text-foreground">Your call starts in a minute</p>
        <p className="text-[13px] text-muted-foreground">Two people are already waiting.</p>
      </div>
      <Button size="sm" className="pointer-coarse:h-10">Join the call</Button>
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
            <RippleBackground {...props} paused={paused} className="h-50 rounded-lg border">
              <Copy />
            </RippleBackground>
          </div>
        ))}
      </div>
    </div>
  )
}
