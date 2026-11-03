import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { AuroraBackground, type AuroraBackgroundProps } from "@/registry/miseui/ui/aurora-background"

const PANEL_CLASS = "h-[200px] rounded-lg border"

function Panel({ label, title, body, action, ...props }: AuroraBackgroundProps & { label: string; title: string; body: string; action: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <AuroraBackground className={PANEL_CLASS} {...props}>
        <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="min-w-0 text-foreground">
            <p className="text-[15px] leading-5 font-medium">{title}</p>
            <p className="mt-1 text-[13px] leading-5">{body}</p>
          </div>
          <Button size="sm">{action}</Button>
        </div>
      </AuroraBackground>
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
        <Panel label="curtain" title="Quiet tools for loud weeks" body="Everything your team ships, in one calm place." action="Take a look" />
        <Panel label="horizon" variant="horizon" title="Your next launch starts here" body="Plan it, write it and send it from one page." action="Start a launch" />
        <Panel label="halo" variant="halo" title="One clear answer" body="Ask once. Sources are always listed." action="Ask a question" />
        <Panel label="ribbon" variant="ribbon" title="Spring release is out" body="Faster sync and offline drafts for everyone." action="See what changed" />
        <Panel label="curtain, drift effect" effect="drift" paused={paused} title="The bands sway slowly" body="It stops off screen and in a hidden tab." action="Get started" />
        <Panel label="halo, drift effect" variant="halo" effect="drift" paused={paused} title="The ring turns once" body="About every ninety seconds, then again." action="Book a demo" />
      </div>
    </div>
  )
}
