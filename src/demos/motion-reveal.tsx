import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { MotionReveal } from "@/registry/miseui/ui/motion-reveal"

const STEPS = ["Export your contacts", "Invite your team", "Connect your calendar"] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
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
        <Cell label="rise">
          <MotionReveal>
            <Note title="Report ready" body="Your October numbers are in, and two of them need a look." />
          </MotionReveal>
        </Cell>
        <Cell label="fade">
          <MotionReveal variant="fade">
            <Note title="Three new replies" body="Everyone on the thread answered before lunch." />
          </MotionReveal>
        </Cell>
        <Cell label="clip">
          <MotionReveal variant="clip">
            <Note title="Floor plan updated" body="The new meeting rooms are on level two." />
          </MotionReveal>
        </Cell>
        <Cell label="stagger effect">
          <MotionReveal as="ul" effect="stagger" variant="fade" className="grid gap-2">
            {STEPS.map((step) => (
              <span key={step} className="block rounded-md border px-3 py-2 text-[13px] leading-5">
                {step}
              </span>
            ))}
          </MotionReveal>
        </Cell>
      </div>
    </div>
  )
}
