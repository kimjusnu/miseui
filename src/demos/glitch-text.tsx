import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { GlitchText, type GlitchTextProps } from "@/registry/miseui/ui/glitch-text"

const LINE_CLASS = "text-[clamp(20px,7cqi,24px)] leading-snug font-semibold tracking-tight"
const LINK_CLASS =
  "inline-flex min-h-10 w-fit max-w-full items-center rounded-sm text-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

function Line({ label, ...props }: GlitchTextProps & { label: string }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="min-w-0">
        <GlitchText as="h3" className={LINE_CLASS} {...props} />
      </div>
    </div>
  )
}

function HoverLink({ label, ...props }: GlitchTextProps & { label: string }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <a href="#status" onClick={(event) => event.preventDefault()} className={LINK_CLASS}>
        <GlitchText {...props} />
      </a>
    </div>
  )
}

export function Demo() {
  const [run, setRun] = useState(0)
  return (
    <div className="grid gap-8">
      <div>
        <Button variant="outline" size="sm" onClick={() => setRun(run + 1)}>
          <RotateCcw aria-hidden="true" />
          Play again
        </Button>
      </div>
      <div key={run} className="grid gap-8 sm:grid-cols-2">
        <Line label="split" text="Connection restored after a long outage" />
        <Line label="slice" text="Signal recovered" variant="slice" />
        <Line label="flicker" text="Open all night" variant="flicker" />
        <Line label="skew" text="System rebooted" variant="skew" />
        <HoverLink label="hover effect, split" text="See system status" effect="hover" />
        <HoverLink label="hover effect, skew" text="Read the incident report" variant="skew" effect="hover" />
      </div>
    </div>
  )
}
