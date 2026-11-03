import type * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { LINK_BASE_CLASS, NavLink, type NavViewProps } from "@/registry/miseui/ui/floating-nav-views"
import { cn } from "@/registry/miseui/lib/utils"

/** Half the 44 px capsule. Stays the same when open, so the corners do not change shape as the panel grows. */
const RADIUS_PX = 22

interface IslandPanelProps extends Pick<NavViewProps, "items" | "current"> {
  id: string
  panelRef: React.RefObject<HTMLDivElement | null>
  animated: boolean
  onChoose: (value: string) => void
}

function IslandPanel({ id, panelRef, animated, items, current, onChoose }: IslandPanelProps) {
  return (
    <motion.div ref={panelRef} id={id} layout={animated ? "position" : false} data-slot="floating-nav-panel" initial={animated ? { opacity: 0 } : false} animate={{ opacity: 1 }} className="p-2 pt-0">
      <ul className="grid gap-1">
        {items.map((item) => {
          const active = current === item.value
          return (
            <li key={item.value}>
              <NavLink
                item={item}
                active={active}
                onSelect={onChoose}
                className={cn(
                  "flex h-10 w-full items-center gap-2 rounded-[14px] px-2 text-start text-[13px] focus-visible:ring-primary-foreground/70",
                  active ? "bg-primary-foreground/15 font-medium" : "opacity-80 hover:bg-primary-foreground/10 hover:opacity-100",
                )}
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

function useIslandOpen(rootRef: React.RefObject<HTMLElement | null>, panelRef: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus()
    const onPress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPress)
    return () => document.removeEventListener("pointerdown", onPress)
  }, [open, panelRef, rootRef])
  return [open, setOpen] as const
}

interface IslandTriggerProps {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  animated: boolean
  open: boolean
  panelId: string
  label: string
  text: string
  brand: React.ReactNode
  onPress: () => void
}

function IslandTrigger({ triggerRef, animated, open, panelId, label, text, brand, onPress }: IslandTriggerProps) {
  return (
    <motion.button
      ref={triggerRef}
      type="button"
      layout={animated ? "position" : false}
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      aria-label={label}
      onClick={onPress}
      style={{ borderRadius: RADIUS_PX }}
      className={cn(LINK_BASE_CLASS, "flex h-11 w-full items-center gap-2 px-4 text-[13px] font-medium focus-visible:ring-primary-foreground/70")}
    >
      {brand ? <span className="flex shrink-0 items-center">{brand}</span> : null}
      <span className="min-w-0 flex-1 text-start">{text}</span>
      <ChevronDown aria-hidden="true" className={cn("size-4! opacity-70 transition-[rotate] duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none", open && "rotate-180")} />
    </motion.button>
  )
}

const CAPSULE_CLASS = "pointer-events-auto h-fit self-start overflow-hidden bg-primary text-primary-foreground shadow-lg shadow-black/10 dark:shadow-black/40"

export function IslandView({ label, items, current, onSelect, brand }: NavViewProps) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useIslandOpen(rootRef, panelRef)
  const animated = !(useReducedMotion() ?? false)
  const currentLabel = items.find((item) => item.value === current)?.label ?? label
  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }
  return (
    // Keeps the capsule's height in the flow. The panel opens over the page, so nothing around it moves.
    <div data-slot="floating-nav-island-slot" className="flex h-11 w-full min-w-0 justify-center">
      <motion.div
        ref={rootRef}
        layout={animated}
        data-slot="floating-nav-island"
        data-state={open ? "open" : "closed"}
        style={{ borderRadius: RADIUS_PX }}
        className={cn(CAPSULE_CLASS, open ? "w-72 max-w-[calc(100%-8px)]" : "w-fit max-w-full")}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !open) return
          event.stopPropagation()
          close()
        }}
        onBlur={(event) => {
          if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
        }}
      >
        <IslandTrigger triggerRef={triggerRef} animated={animated} open={open} panelId={panelId} label={`${label} menu, ${currentLabel}`} text={currentLabel} brand={brand} onPress={() => setOpen(!open)} />
        {open ? (
          <IslandPanel
            id={panelId}
            panelRef={panelRef}
            animated={animated}
            items={items}
            current={current}
            onChoose={(value) => {
              onSelect(value)
              close()
            }}
          />
        ) : null}
      </motion.div>
    </div>
  )
}
