import type * as React from "react"
import { useState } from "react"
import { Monitor, Smartphone } from "lucide-react"
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

/** Blocks respond to their container, so resizing this frame shows the real phone layout without an iframe. */
export function BlockPreview({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  const [viewport, setViewport] = useState<Viewport>("desktop")

  return (
    <section aria-label="Preview" className="flex flex-col gap-3">
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
        </div>
      </div>
      <div className="flex justify-center rounded-2xl bg-muted p-2 sm:p-3">
        <motion.div
          className="w-full overflow-hidden rounded-xl border bg-background text-foreground shadow-sm"
          initial={false}
          animate={{ maxWidth: viewport === "mobile" ? MOBILE_WIDTH_PX : 2000 }}
          transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}
