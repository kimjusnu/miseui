import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { ViewCounter, type ViewCounterEffect, type ViewCounterVariant } from "@/registry/miseui/ui/view-counter"

const LOAD_MS = 900

/** Stands in for your API. Honours the signal, the way a real fetch does. */
function pretendFetch(count: number, signal: AbortSignal, fail = false) {
  return new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => (fail ? reject(new Error("Service unavailable")) : resolve(count)), LOAD_MS)
    signal.addEventListener("abort", () => clearTimeout(timer))
  })
}

const SHOWN: ReadonlyArray<{ title: string; variant: ViewCounterVariant; effect?: ViewCounterEffect; count: number }> = [
  { title: "inline", variant: "inline", count: 1284 },
  { title: "badge", variant: "badge", count: 48210 },
  { title: "stat", variant: "stat", count: 1284903 },
  { title: "count effect", variant: "stat", effect: "count", count: 48210 },
  { title: "odometer effect", variant: "stat", effect: "odometer", count: 96302 },
]

function FailureThenSuccess() {
  const [attempts, setAttempts] = useState(0)
  return (
    <ViewCounter
      fetcher={(signal) => {
        setAttempts((count) => count + 1)
        return pretendFetch(312, signal, attempts === 0)
      }}
    />
  )
}

export function Demo() {
  const [run, setRun] = useState(0)
  return (
    <div className="grid gap-6">
      <div className="grid gap-8 sm:grid-cols-3">
        {SHOWN.map(({ title, variant, effect, count }) => (
          <div key={title} className="grid min-w-0 content-start justify-items-start gap-2">
            <p className="text-xs text-muted-foreground">{title}</p>
            <ViewCounter
              resourceKey={String(run)}
              variant={variant}
              effect={effect}
              fetcher={(signal) => pretendFetch(count, signal)}
            />
          </div>
        ))}
        <div className="grid min-w-0 content-start justify-items-start gap-2">
          <p className="text-xs text-muted-foreground">failure, then retry</p>
          <FailureThenSuccess key={run} />
        </div>
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={() => setRun((current) => current + 1)}>
          Load again
        </Button>
      </div>
    </div>
  )
}
