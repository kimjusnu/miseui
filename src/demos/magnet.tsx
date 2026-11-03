import type * as React from "react"
import { ArrowRight, BookOpen, Mail, Rss, Share2, Sparkles, type LucideIcon } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Magnet, MagnetGroup, MagnetLayer } from "@/registry/miseui/ui/magnet"

const LINKS: readonly { label: string; icon: LucideIcon }[] = [
  { label: "Mail", icon: Mail },
  { label: "Reading list", icon: BookOpen },
  { label: "Feed", icon: Rss },
  { label: "Share", icon: Share2 },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="grid min-h-40 min-w-0 place-items-center rounded-lg border bg-card p-4">{children}</div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="pull: bring the pointer near, it reacts from a distance">
        <Magnet>
          <Button>
            Start a project
            <ArrowRight aria-hidden="true" />
          </Button>
        </Magnet>
      </Cell>
      <Cell label="layers: the icon and title travel further than the card">
        <Magnet variant="layers" reach={72}>
          <div className="grid w-44 gap-3 rounded-xl border bg-background p-4 shadow-sm">
            <MagnetLayer depth={2.5} className="w-fit">
              <span className="grid size-10 place-items-center rounded-md bg-mise text-mise-foreground">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
            </MagnetLayer>
            <MagnetLayer depth={1} className="grid gap-1">
              <p className="text-[15px] font-medium text-foreground">New this week</p>
              <p className="text-[13px] text-muted-foreground">Twelve fresh walks near you.</p>
            </MagnetLayer>
          </div>
        </Magnet>
      </Cell>
      <Cell label="field: one group, each item by its own distance">
        <MagnetGroup className="justify-center">
          {LINKS.map(({ label, icon: Icon }) => (
            <Magnet key={label}>
              <Button variant="outline" size="icon" className="size-10 rounded-full" aria-label={label}>
                <Icon aria-hidden="true" />
              </Button>
            </Magnet>
          ))}
        </MagnetGroup>
      </Cell>
      <Cell label="halo: the price stays put, a ring trails the pointer">
        <Magnet variant="halo">
          <div className="grid justify-items-center gap-1 rounded-2xl bg-background px-6 py-3 ring-1 ring-border">
            <p className="text-[13px] text-muted-foreground">Billed yearly</p>
            <p className="text-2xl font-medium text-foreground tabular-nums">$96</p>
          </div>
        </Magnet>
      </Cell>
      <Cell label="sticky effect: it latches when close and holds on">
        <Magnet effect="sticky" reach={96} maxOffset={14}>
          <Button variant="outline" className="rounded-full">
            Hold on to me
          </Button>
        </Magnet>
      </Cell>
      <Cell label="sticky effect on a field">
        <MagnetGroup className="justify-center" reach={80}>
          {LINKS.slice(0, 3).map(({ label, icon: Icon }) => (
            <Magnet key={label} effect="sticky" maxOffset={8}>
              <Button variant="ghost" size="icon" className="size-10" aria-label={label}>
                <Icon aria-hidden="true" />
              </Button>
            </Magnet>
          ))}
        </MagnetGroup>
      </Cell>
    </div>
  )
}
