import { useState } from "react"
import { Calendar, Camera, Cloud, FileText, Layers, Mail, Map as MapIcon, Music, Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { OrbitingCircles, type OrbitItem, type OrbitingCirclesProps } from "@/registry/miseui/ui/orbiting-circles"

const APPS: readonly OrbitItem[] = [
  { id: "mail", label: "Mail", icon: <Mail /> },
  { id: "files", label: "Files", icon: <FileText /> },
  { id: "calendar", label: "Calendar", icon: <Calendar /> },
  { id: "photos", label: "Photos", icon: <Camera /> },
  { id: "maps", label: "Maps", icon: <MapIcon /> },
  { id: "music", label: "Music", icon: <Music /> },
  { id: "cloud", label: "Cloud storage", icon: <Cloud /> },
]
const LINKS = APPS.slice(0, 5).map((app) => ({ ...app, href: `#${app.id}` }))

function Hub() {
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-mise text-mise-foreground shadow-sm ring-1 ring-foreground/10">
      <Layers aria-hidden="true" className="size-5" />
    </div>
  )
}

function ArchCopy() {
  return (
    <div className="grid w-36 gap-1 text-center">
      <p className="text-[15px] font-medium text-foreground">All in one place</p>
      <p className="text-[13px] text-muted-foreground">Seven apps, one inbox.</p>
    </div>
  )
}

const CELLS: readonly { title: string; props: OrbitingCirclesProps }[] = [
  { title: "ring", props: { variant: "ring", items: APPS.slice(0, 5), center: <Hub />, label: "Five apps connected to the hub" } },
  { title: "rings", props: { variant: "rings", items: APPS, center: <Hub />, label: "Seven apps in three tiers around the hub" } },
  { title: "tilted", props: { variant: "tilted", items: APPS.slice(0, 5), center: <Hub />, label: "Five apps circling the hub" } },
  { title: "arc", props: { variant: "arc", items: APPS, center: <ArchCopy />, label: "Seven apps passing over a sentence" } },
  { title: "ring, hover effect: point at, focus or tap an item", props: { variant: "ring", effect: "hover", items: LINKS, center: <Hub />, label: "Open a connected app" } },
  { title: "arc, hover effect", props: { variant: "arc", effect: "hover", items: LINKS, center: <ArchCopy />, label: "Open a connected app" } },
]

export function Demo() {
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        {CELLS.map(({ title, props }) => (
          <div key={title} className="grid min-w-0 content-start gap-2">
            <p className="text-xs text-muted-foreground">{title}</p>
            <OrbitingCircles {...props} paused={paused} />
          </div>
        ))}
      </div>
    </div>
  )
}
