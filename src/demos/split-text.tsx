import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { SplitText, type SplitTextProps } from "@/registry/miseui/ui/split-text"

const HEADLINE_CLASS = "block text-[clamp(24px,7cqi,32px)] leading-tight font-semibold tracking-tight"

function Headline({ label, ...props }: SplitTextProps & { label: string }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <SplitText as="h3" className={HEADLINE_CLASS} {...props} />
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
        <Headline label="rise" text="Ship the quiet version" />
        <Headline label="fade, by word" text="Every sentence earns its place" variant="fade" by="words" />
        <Headline label="blur" text="Fewer screens, clearer choices" variant="blur" />
        <Headline label="center effect" text="Start where the eye is" effect="center" className={`${HEADLINE_CLASS} text-center`} />
      </div>
    </div>
  )
}
