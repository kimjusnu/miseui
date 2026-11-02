import { useState } from "react"
import { BeamBorder } from "@/registry/miseui/ui/beam-border"
import { Button } from "@/registry/miseui/ui/button"
import { ThinkingIndicator } from "@/registry/miseui/ui/thinking-indicator"

export function Demo() {
  const [active, setActive] = useState(true)

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Button variant="outline" size="sm" onClick={() => setActive((value) => !value)}>
        {active ? "Finish" : "Generate"}
      </Button>
      <BeamBorder active={active} className="w-full max-w-sm rounded-2xl">
        <div className="rounded-2xl border bg-background p-5">
          <p className="text-[15px] font-medium">Quarterly summary</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The beam marks the one card being written, and nothing else on the page moves.
          </p>
          <div className="mt-4">
            <ThinkingIndicator state={active ? "writing" : "done"} size="sm" />
          </div>
        </div>
      </BeamBorder>
    </div>
  )
}
