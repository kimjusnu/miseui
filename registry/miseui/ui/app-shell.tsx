import type * as React from "react"
import { useId, useLayoutEffect, useRef, useState } from "react"
import { CenteredLayout, SidebarLayout, SplitLayout, TopbarLayout, WIDE_CONTAINER_PX } from "@/registry/miseui/ui/app-shell-layouts"
import { SidebarProvider, type SidebarEffect, type SidebarVariant } from "@/registry/miseui/ui/sidebar"
import { cn } from "@/registry/miseui/lib/utils"

type AppShellVariant = "sidebar" | "topbar" | "split" | "centered"

interface AppShellProps extends Omit<React.ComponentProps<"div">, "title" | "ref"> {
  /** `sidebar` a column beside the page, `topbar` navigation across the top, `split` a list and its detail, `centered` one reading column. */
  variant?: AppShellVariant
  /** Fills its parent instead of the viewport, for a shell inside a panel or a frame. */
  fill?: boolean
  /** Top bar, left. Wraps rather than truncates: a page that cannot name itself is lost. */
  title?: React.ReactNode
  /** Top bar, right. On phones, keep only what fits beside the title. */
  actions?: React.ReactNode
  skipLabel?: string
  /** `sidebar`: a Sidebar. Set its look with `sidebarVariant`. */
  sidebar?: React.ReactNode
  sidebarVariant?: SidebarVariant
  sidebarEffect?: SidebarEffect
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** Mod+B toggles the sidebar. */
  shortcut?: boolean
  /** `topbar`: the links. They move to their own scrolling row on a phone. */
  nav?: React.ReactNode
  navLabel?: string
  /** `split`: the left pane. */
  list?: React.ReactNode
  listLabel?: string
  detailLabel?: string
  /** `split`: on a phone one pane shows at a time, and this says which. */
  detailOpen?: boolean
  /** `split`: draws the phone's way back to the list. */
  onBack?: () => void
  backLabel?: string
}

/** Measured so the sidebar's drawer can follow the shell's own width, which a media query cannot see. */
function useNarrow(ref: React.RefObject<HTMLElement | null>) {
  const [narrow, setNarrow] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < WIDE_CONTAINER_PX))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return narrow
}

function SkipLink({ target, targetId, label }: { target: React.RefObject<HTMLElement | null>; targetId: string; label: string }) {
  return (
    <a
      data-slot="app-shell-skip"
      href={`#${targetId}`}
      // A hash link would fight a hash router, and Safari does not move focus for it anyway.
      onClick={(event) => {
        event.preventDefault()
        target.current?.focus()
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-[3px] focus:ring-ring/50 focus:outline-none"
    >
      {label}
    </a>
  )
}

function AppShell({
  variant = "sidebar",
  fill = false,
  title,
  actions,
  skipLabel = "Skip to content",
  sidebar,
  sidebarVariant = "plain",
  sidebarEffect,
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  shortcut,
  nav,
  navLabel = "Primary",
  list,
  listLabel = "List",
  detailLabel = "Detail",
  detailOpen = false,
  onBack,
  backLabel = "Back",
  className,
  children,
  ...props
}: AppShellProps) {
  const root = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const mainId = useId()
  const narrow = useNarrow(root)
  const main = { id: mainId, ref: mainRef, tabIndex: -1 as const, "data-slot": "app-shell-main" as const }
  const shared = { main, fill, title, actions, children }
  const sizeClass = fill ? "h-full overflow-hidden" : "min-h-dvh min-[36rem]:h-dvh"
  return (
    <div ref={root} data-slot="app-shell" data-variant={variant} className={cn("@container relative w-full min-w-0 bg-background text-foreground", sidebarVariant === "inset" && variant === "sidebar" && "bg-muted", sizeClass, className)} {...props}>
      <SkipLink target={mainRef} targetId={mainId} label={skipLabel} />
      {variant === "sidebar" ? (
        <SidebarProvider variant={sidebarVariant} effect={sidebarEffect} collapsed={collapsed} defaultCollapsed={defaultCollapsed} onCollapsedChange={onCollapsedChange} shortcut={shortcut} mobile={narrow}>
          <SidebarLayout {...shared} sidebar={sidebar} inset={sidebarVariant === "inset"} />
        </SidebarProvider>
      ) : null}
      {variant === "topbar" ? <TopbarLayout {...shared} nav={nav} navLabel={navLabel} /> : null}
      {variant === "split" ? <SplitLayout {...shared} list={list} listLabel={listLabel} detailLabel={detailLabel} detailOpen={detailOpen} onBack={onBack} backLabel={backLabel} narrow={narrow} /> : null}
      {variant === "centered" ? <CenteredLayout {...shared} /> : null}
    </div>
  )
}

export { AppShell, type AppShellProps, type AppShellVariant }
