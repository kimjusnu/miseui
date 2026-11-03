import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { ScrambleText, type ScrambleTextProps } from "@/registry/miseui/ui/scramble-text"

const LINE_CLASS = "block text-[clamp(20px,7cqi,24px)] leading-snug font-semibold tracking-tight"

function Line({ label, ...props }: ScrambleTextProps & { label: string }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <ScrambleText as="h3" className={LINE_CLASS} {...props} />
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
        <Line label="letters" text="Your changes are saved everywhere" />
        <Line label="mono" text="Deploy finished in 42s" variant="mono" className={`${LINE_CLASS} font-medium`} />
        <Line label="center" text="Start where the eye is" variant="center" className={`${LINE_CLASS} text-center`} />
        <Line label="ticker" text="Gate B12 boards at 19:40" variant="ticker" />
        <Line label="letters, Hangul stays whole" text="제품을 더 조용하게 만듭니다" />
        <div className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">hover effect, on a link</p>
          <a
            href="#changelog"
            onClick={(event) => event.preventDefault()}
            className="inline-flex min-h-10 w-fit max-w-full items-center rounded-sm text-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ScrambleText text="Read the changelog" effect="hover" />
          </a>
        </div>
      </div>
    </div>
  )
}
