import { Layers } from "lucide-react"
import { GlassCore, type GlassCoreEffect, type GlassCoreVariant } from "@/registry/miseui/ui/glass-core"

const SHOWN: ReadonlyArray<{ title: string; variant: GlassCoreVariant; effect?: GlassCoreEffect; mark?: boolean }> = [
  { title: "knot", variant: "knot" },
  { title: "orb, with a mark in the middle", variant: "orb", mark: true },
  { title: "panes", variant: "panes" },
  { title: "follow effect, move the pointer", variant: "knot", effect: "follow" },
  { title: "drift effect", variant: "panes", effect: "drift" },
]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {SHOWN.map(({ title, variant, effect, mark }) => (
        <div key={title} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          <div className="grid min-w-0 place-items-center">
            <GlassCore variant={variant} effect={effect}>
              {mark ? <Layers aria-hidden="true" className="size-8 text-foreground" /> : null}
            </GlassCore>
          </div>
        </div>
      ))}
    </div>
  )
}
