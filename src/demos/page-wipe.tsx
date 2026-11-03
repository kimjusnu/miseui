import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { PageWipeLink, usePageWipe, type PageWipeEffect, type PageWipeVariant } from "@/registry/miseui/ui/page-wipe"

const SCREENS = [
  { name: "Overview", line: "Three projects are on track." },
  { name: "Timeline", line: "The next review is on Thursday." },
  { name: "People", line: "Eight teammates, two on leave." },
] as const

const SHOWN: ReadonlyArray<{ title: string; variant: PageWipeVariant; effect?: PageWipeEffect }> = [
  { title: "curtain", variant: "curtain" },
  { title: "sweep", variant: "sweep" },
  { title: "iris, opens from your click", variant: "iris" },
  { title: "recede effect on sweep", variant: "sweep", effect: "recede" },
]

function WipeButton({ title, variant, effect, onNext }: { title: string; variant: PageWipeVariant; effect?: PageWipeEffect; onNext: () => void }) {
  const wipe = usePageWipe({ variant, effect })
  return (
    <div className="grid min-w-0 content-start justify-items-start gap-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      <Button variant="outline" size="sm" onClick={(event) => wipe(onNext, event)}>
        Next screen
      </Button>
    </div>
  )
}

export function Demo() {
  const [screen, setScreen] = useState(0)
  const next = () => setScreen((current) => (current + 1) % SCREENS.length)
  const current = SCREENS[screen] ?? SCREENS[0]
  return (
    <div className="grid gap-6">
      <div className="grid gap-1 rounded-xl border bg-card p-6 text-card-foreground">
        <p className="text-[13px] text-muted-foreground">Screen {screen + 1} of {SCREENS.length}</p>
        <p className="text-xl font-semibold tracking-tight">{current.name}</p>
        <p className="text-sm text-muted-foreground">{current.line}</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-6">
        {SHOWN.map((shown) => <WipeButton key={shown.title} {...shown} onNext={next} />)}
        <div className="grid min-w-0 content-start justify-items-start gap-2">
          <p className="text-xs text-muted-foreground">as a link, cmd-click still opens a tab</p>
          <PageWipeLink
            href="#next-screen"
            variant="curtain"
            onNavigate={next}
            className="inline-flex min-h-10 items-center text-sm font-medium underline underline-offset-4"
          >
            Next screen
          </PageWipeLink>
        </div>
      </div>
    </div>
  )
}
