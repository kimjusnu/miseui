import type * as React from "react"
import { useState } from "react"
import { Bookmark, CalendarDays, Camera, Folder, Home, Inbox, MapPin, Music, Search, Settings, type LucideIcon } from "lucide-react"
import { Dock, DockItem, type DockProps } from "@/registry/miseui/ui/dock"

interface App {
  label: string
  icon: LucideIcon
  opens?: boolean
}

const APPS: readonly App[] = [
  { label: "Home", icon: Home },
  { label: "Inbox", icon: Inbox, opens: true },
  { label: "Plan", icon: CalendarDays, opens: true },
  { label: "Files", icon: Folder, opens: true },
  { label: "Setup", icon: Settings, opens: true },
]

const MANY_APPS: readonly App[] = [
  ...APPS,
  { label: "Search", icon: Search },
  { label: "Saved", icon: Bookmark },
  { label: "Photos", icon: Camera },
  { label: "Places", icon: MapPin },
  { label: "Music", icon: Music },
]

const WALLPAPER = {
  backgroundImage:
    "radial-gradient(circle at 20% 90%, color-mix(in oklab, var(--mise) 50%, transparent), transparent 60%), radial-gradient(circle at 85% 20%, color-mix(in oklab, var(--foreground) 16%, transparent), transparent 55%)",
}

function AppDock({ apps = APPS, ...props }: Omit<DockProps, "label" | "children"> & { apps?: readonly App[] }) {
  const [active, setActive] = useState("Home")
  return (
    <Dock label="Apps" {...props}>
      {apps.map(({ label, icon: Icon, opens }) => (
        <DockItem key={label} label={label} active={active === label} opens={opens} onClick={() => setActive(label)}>
          <Icon />
        </DockItem>
      ))}
    </Dock>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="glass, over a picture">
        <div className="grid min-w-0 justify-items-center rounded-lg border bg-muted px-2 pt-16 pb-3" style={WALLPAPER}>
          <AppDock variant="glass" />
        </div>
      </Cell>
      <Cell label="plain">
        <div className="grid min-w-0 justify-items-center">
          <AppDock variant="plain" />
        </div>
      </Cell>
      <Cell label="vertical, beside the work">
        <div className="flex min-w-0 items-start gap-3">
          <AppDock variant="vertical" apps={APPS.slice(0, 4)} />
          <div className="grid min-w-0 flex-1 gap-1 pt-2">
            <p className="text-[15px] font-medium text-foreground">This week</p>
            <p className="text-[13px] text-muted-foreground">Three reviews and one handover are waiting for you.</p>
          </div>
        </div>
      </Cell>
      <Cell label="labeled, nothing to guess">
        <div className="grid min-w-0 justify-items-center">
          <AppDock variant="labeled" />
        </div>
      </Cell>
      <Cell label="magnify effect: point at it, or Tab into it">
        <div className="grid min-w-0 justify-items-center rounded-lg border bg-muted px-2 pt-8 pb-3" style={WALLPAPER}>
          <AppDock variant="glass" effect="magnify" />
        </div>
      </Cell>
      <Cell label="magnify effect, side rail">
        <div className="flex min-w-0 items-start gap-1 py-6">
          <AppDock variant="vertical" effect="magnify" apps={APPS.slice(0, 4)} />
          <p className="min-w-0 flex-1 pt-2 text-[13px] text-muted-foreground">The rail swells toward this text, into room it keeps for that.</p>
        </div>
      </Cell>
      <Cell label="bounce effect: press Inbox">
        <div className="grid min-w-0 justify-items-center pt-4">
          <AppDock variant="plain" effect="bounce" />
        </div>
      </Cell>
      <Cell label="too many for the box: the row scrolls inside itself">
        <div className="grid min-w-0 justify-items-center">
          <AppDock variant="glass" effect="magnify" apps={MANY_APPS} />
        </div>
      </Cell>
    </div>
  )
}
