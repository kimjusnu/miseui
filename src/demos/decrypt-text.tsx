import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { DecryptText, type DecryptTextProps } from "@/registry/miseui/ui/decrypt-text"

const LINE_CLASS = "block text-[clamp(18px,6.5cqi,22px)] leading-snug font-semibold tracking-tight"

function Line({ label, ...props }: DecryptTextProps & { label: string }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <DecryptText as="h3" className={LINE_CLASS} {...props} />
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
        <Line label="dots" text="Card ending 4242 is verified" />
        <Line label="redact" text="The launch moves to the second week of March" variant="redact" />
        <Line label="cipher" text="Backup restored from last night" variant="cipher" className={`${LINE_CLASS} font-medium`} />
        <Line label="scan" text="Invoice 2041 is paid in full, nothing left to do" variant="scan" />
        <div className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">press effect, dots</p>
          <DecryptText text="quiet-harbour-41" effect="press" label="Show wifi password" className="font-mono text-sm" />
        </div>
        <div className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">press effect, redact</p>
          <DecryptText text="The winner is Hana Park" variant="redact" effect="press" label="Show the winner" className="text-sm" />
        </div>
      </div>
    </div>
  )
}
