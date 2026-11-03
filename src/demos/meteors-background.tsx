import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { MeteorsBackground, type MeteorsBackgroundProps } from "@/registry/miseui/ui/meteors-background"

const CELLS: readonly { label: string; props: MeteorsBackgroundProps }[] = [
  { label: "meteors", props: { variant: "meteors" } },
  { label: "rain", props: { variant: "rain" } },
  { label: "comets", props: { variant: "comets" } },
  { label: "stars", props: { variant: "stars" } },
  { label: "meteors, count 16", props: { variant: "meteors", count: 16, seed: 5 } },
  { label: "stars, still effect", props: { variant: "stars", effect: "still", seed: 2 } },
]

function Copy() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="grid gap-1">
        <p className="text-[15px] font-medium text-foreground">Launch night, Thursday at nine</p>
        <p className="text-[13px] text-muted-foreground">Watch it live with the whole team.</p>
      </div>
      <Button size="sm" className="pointer-coarse:h-10">Save my seat</Button>
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
            <MeteorsBackground {...props} paused={paused} className="h-50 rounded-lg border">
              <Copy />
            </MeteorsBackground>
          </div>
        ))}
      </div>
    </div>
  )
}
