import { useId, useState } from "react"
import { BarChart3, FolderOpen, Settings, UserPlus } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Tour, type TourEffect, type TourStep, type TourVariant } from "@/registry/miseui/ui/tour"

const NAV = [
  { key: "projects", label: "Projects", Icon: FolderOpen },
  { key: "reports", label: "Reports", Icon: BarChart3 },
  { key: "invite", label: "Invite", Icon: UserPlus },
  { key: "settings", label: "Settings", Icon: Settings },
] as const

const COPY: Record<string, { title: string; body: string }> = {
  projects: { title: "Your projects", body: "Everything your team is working on starts here." },
  reports: { title: "See how it is going", body: "Reports update as work moves, with nothing to set up." },
  invite: { title: "Bring your team", body: "Teammates get access to the projects you choose." },
  settings: { title: "Make it yours", body: "Billing, members and notifications all live in settings." },
}

const MODES: ReadonlyArray<{ variant: TourVariant; effect?: TourEffect; label: string }> = [
  { variant: "spotlight", effect: "spring", label: "Spotlight" },
  { variant: "popover", effect: "spring", label: "Popover" },
  { variant: "banner", label: "Banner" },
  { variant: "checklist", label: "Checklist" },
]

function stepsFor(prefix: string): TourStep[] {
  return [
    ...NAV.map(({ key }) => ({ target: `[data-tour='${prefix}-${key}']`, ...COPY[key] })),
    // Shows that a step whose target is gone is skipped rather than pointing at nothing.
    { target: `[data-tour='${prefix}-removed']`, title: "Removed in the last release", body: "This target does not exist." },
  ]
}

export function Demo() {
  const prefix = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [mode, setMode] = useState<(typeof MODES)[number] | null>(null)
  return (
    <div className="grid min-w-0 gap-8">
      <div className="grid min-w-0 gap-2">
        <p className="text-xs text-muted-foreground">Start a tour of this small app</p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {MODES.map((entry) => (
            <Button key={entry.variant} variant="outline" size="sm" onClick={() => setMode(entry)}>
              {entry.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid min-w-0 gap-2">
        <p className="text-xs text-muted-foreground">The page being explained</p>
        <nav aria-label="Example app" className="flex min-w-0 flex-wrap gap-1 rounded-lg border bg-card p-1">
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              data-tour={`${prefix}-${key}`}
              className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
              {label}
            </button>
          ))}
        </nav>
      </div>
      {mode ? (
        <Tour
          key={mode.variant}
          steps={stepsFor(prefix)}
          variant={mode.variant}
          effect={mode.effect}
          defaultOpen
          title="Set up your workspace"
          onOpenChange={(open) => {
            if (!open) setMode(null)
          }}
        />
      ) : null}
    </div>
  )
}
