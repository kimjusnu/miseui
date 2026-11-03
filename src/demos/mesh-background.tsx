import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { MeshBackground, type MeshBackgroundProps } from "@/registry/miseui/ui/mesh-background"

const PANEL_CLASS = "h-[200px] rounded-lg border"

function Panel({ label, title, body, action, ...props }: MeshBackgroundProps & { label: string; title: string; body: string; action: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <MeshBackground className={PANEL_CLASS} {...props}>
        <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="min-w-0 text-foreground">
            <p className="text-[15px] leading-5 font-medium">{title}</p>
            <p className="mt-1 text-[13px] leading-5">{body}</p>
          </div>
          <Button size="sm">{action}</Button>
        </div>
      </MeshBackground>
    </div>
  )
}

export function Demo() {
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? "Resume drift" : "Pause drift"}
        </Button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Panel label="soft" title="Sign in to your workspace" body="Pick up exactly where your team left off." action="Continue" />
        <Panel label="vivid" variant="vivid" title="Start with the first page" body="A free plan for as long as you need one." action="Create a workspace" />
        <Panel label="corner" variant="corner" title="New this month" body="Shared views, faster search and a calmer inbox." action="Read the changelog" />
        <Panel label="split" variant="split" title="Ready when you are" body="Move your projects over in about ten minutes." action="Import projects" />
        <Panel label="vivid, drift effect" variant="vivid" effect="drift" paused={paused} title="Colours move very slowly" body="It stops off screen and in a hidden tab." action="Get started" />
        <Panel label="split, drift effect" variant="split" effect="drift" paused={paused} title="Quiet enough to forget" body="Press Pause above, and it holds still." action="Book a demo" />
      </div>
    </div>
  )
}
