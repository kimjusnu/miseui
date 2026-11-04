import type * as React from "react"
import { useState } from "react"
import type { EffectMeta } from "@/src/content/types"
import { ExternalLink, Monitor, Smartphone } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { PalettePicker } from "./palette-picker"

const MOBILE_WIDTH_PX = 375

type Viewport = "desktop" | "mobile"

const VIEWPORTS: ReadonlyArray<{ id: Viewport; label: string; Icon: typeof Monitor }> = [
  { id: "desktop", label: "Desktop width", Icon: Monitor },
  { id: "mobile", label: "Phone width", Icon: Smartphone },
]

function DesignSwitcher({
  designs,
  active,
  onChange,
}: {
  designs: readonly EffectMeta[]
  active: string
  onChange: (name: string) => void
}) {
  return (
    <div role="group" aria-label="Design" className="flex flex-wrap items-center gap-1">
      {designs.map((design) => (
        <button
          key={design.name}
          type="button"
          aria-pressed={active === design.name}
          title={design.use}
          onClick={() => onChange(design.name)}
          className={cn(
            "h-8 rounded-lg px-3 text-[13px] font-medium text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10",
            active === design.name && "bg-accent text-foreground",
          )}
        >
          {design.name}
        </button>
      ))}
    </div>
  )
}

/** Blocks respond to their container, so resizing this frame shows the real phone layout without an iframe. */
export function BlockPreview({
  name,
  designs,
  children,
}: {
  name: string
  designs?: readonly EffectMeta[]
  children: (variant: string | undefined) => React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const defaultVariant = designs?.[0]?.name
  const [chosen, setChosen] = useState<string | undefined>(undefined)
  const variant = chosen ?? defaultVariant
  const fullScreenHref = chosen && chosen !== defaultVariant ? `/preview/${name}?variant=${chosen}` : `/preview/${name}`

  return (
    <section aria-label="Preview" className="flex flex-col gap-3">
      {designs && designs.length > 1 && variant ? (
        <DesignSwitcher designs={designs} active={variant} onChange={setChosen} />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <PalettePicker />
        <div role="group" aria-label="Preview width" className="flex items-center gap-1">
          {VIEWPORTS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={viewport === id}
              aria-label={label}
              title={label}
              onClick={() => setViewport(id)}
              className={cn(
                "grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
                viewport === id && "bg-accent text-foreground",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
          <a
            href={fullScreenHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Open full screen in a new tab"
            title="Open full screen"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <div className="flex justify-center rounded-2xl bg-muted p-2 sm:p-3">
        <motion.div
          className="w-full overflow-hidden rounded-xl border bg-background text-foreground shadow-sm"
          initial={false}
          animate={{ maxWidth: viewport === "mobile" ? MOBILE_WIDTH_PX : 2000 }}
          transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
        >
          {children(variant)}
        </motion.div>
      </div>
    </section>
  )
}
