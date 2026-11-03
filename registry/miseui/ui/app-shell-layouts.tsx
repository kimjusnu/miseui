import type * as React from "react"
import { useEffect, useRef } from "react"
import { ChevronLeft } from "lucide-react"
import { SidebarTrigger } from "@/registry/miseui/ui/sidebar"
import { cn } from "@/registry/miseui/lib/utils"

/** Wide means the container, not the viewport, so a shell inside a panel behaves like one on a small screen. */
const WIDE_CONTAINER_PX = 576
const TOP_BAR_CLASS = "sticky top-0 z-10 flex min-h-14 shrink-0 items-center gap-2 border-b bg-background px-4"
const COLUMN_CLASS = "flex h-full min-h-[inherit] min-w-0 flex-1 flex-col"
const MAIN_CLASS = "min-w-0 flex-1 outline-none @xl:overflow-y-auto"
/** Narrow, the page itself scrolls so a phone's browser bar can collapse. In a fixed frame there is no page, so the column does. */
const scrollClass = (fill: boolean) => (fill ? "overflow-y-auto @xl:overflow-hidden" : "@xl:overflow-hidden")

interface MainProps {
  id: string
  ref: React.RefObject<HTMLElement | null>
  tabIndex: -1
  "data-slot": "app-shell-main"
}

interface TopBarSlots {
  title?: React.ReactNode
  actions?: React.ReactNode
}

function ShellTitle({ children }: { children?: React.ReactNode }) {
  if (children === undefined) return null
  return <div className="min-w-0 py-2 text-sm font-medium">{children}</div>
}

function ShellActions({ children }: { children?: React.ReactNode }) {
  if (children === undefined) return <span className="ms-auto" />
  return <div className="ms-auto flex shrink-0 items-center gap-2">{children}</div>
}

interface LayoutProps extends TopBarSlots {
  main: MainProps
  fill: boolean
  children?: React.ReactNode
}

interface SidebarLayoutProps extends LayoutProps {
  sidebar?: React.ReactNode
  inset: boolean
}

function SidebarLayout({ main, fill, title, actions, sidebar, inset, children }: SidebarLayoutProps) {
  return (
    <div className="flex h-full min-h-[inherit]">
      {sidebar}
      <div className={cn(COLUMN_CLASS, scrollClass(fill), inset && "bg-background @xl:my-2 @xl:me-2 @xl:h-[calc(100%-1rem)] @xl:rounded-xl @xl:border")}>
        <header data-slot="app-shell-top-bar" className={cn(TOP_BAR_CLASS, inset && "@xl:rounded-t-xl")}>
          <SidebarTrigger />
          <ShellTitle>{title}</ShellTitle>
          <ShellActions>{actions}</ShellActions>
        </header>
        <main {...main} className={cn(MAIN_CLASS, "p-4")}>
          {children}
        </main>
      </div>
    </div>
  )
}

interface TopbarLayoutProps extends LayoutProps {
  nav?: React.ReactNode
  navLabel: string
}

/** One nav in the DOM: wrapping it to its own row on a phone beats rendering it twice and hiding one. */
function TopbarLayout({ main, fill, title, actions, nav, navLabel, children }: TopbarLayoutProps) {
  return (
    <div className={cn(COLUMN_CLASS, scrollClass(fill))}>
      <header data-slot="app-shell-top-bar" className={cn(TOP_BAR_CLASS, "flex-wrap")}>
        <ShellTitle>{title}</ShellTitle>
        {nav ? (
          <nav aria-label={navLabel} className="order-last flex w-full min-w-0 items-center gap-1 overflow-x-auto pb-2 whitespace-nowrap @xl:order-none @xl:w-auto @xl:flex-1 @xl:pb-0 @xl:ps-4">
            {nav}
          </nav>
        ) : null}
        <ShellActions>{actions}</ShellActions>
      </header>
      <main {...main} className={cn(MAIN_CLASS, "p-4")}>
        {children}
      </main>
    </div>
  )
}

interface SplitLayoutProps extends LayoutProps {
  list?: React.ReactNode
  listLabel: string
  detailLabel: string
  detailOpen: boolean
  onBack?: () => void
  backLabel: string
  narrow: boolean
}

/** One pane replaces the other on a phone, and focus left on the hidden one would be lost to the top of the page. */
function usePaneFocus(detailOpen: boolean, narrow: boolean) {
  const listPane = useRef<HTMLElement>(null)
  const detailPane = useRef<HTMLElement>(null)
  const wasOpen = useRef(detailOpen)
  useEffect(() => {
    if (wasOpen.current === detailOpen) return
    wasOpen.current = detailOpen
    if (narrow) (detailOpen ? detailPane : listPane).current?.focus()
  }, [detailOpen, narrow])
  return { listPane, detailPane }
}

function SplitLayout({ main, fill, title, actions, list, listLabel, detailLabel, detailOpen, onBack, backLabel, narrow, children }: SplitLayoutProps) {
  const { listPane, detailPane } = usePaneFocus(detailOpen, narrow)
  return (
    <div className={cn(COLUMN_CLASS, scrollClass(fill))}>
      {title !== undefined || actions !== undefined ? (
        <header data-slot="app-shell-top-bar" className={TOP_BAR_CLASS}>
          <ShellTitle>{title}</ShellTitle>
          <ShellActions>{actions}</ShellActions>
        </header>
      ) : null}
      <main {...main} className="flex min-h-0 min-w-0 flex-1 flex-col outline-none @xl:flex-row">
        <section
          ref={listPane}
          tabIndex={-1}
          aria-label={listLabel}
          data-slot="app-shell-list"
          className={cn("min-w-0 shrink-0 outline-none @xl:block @xl:w-72 @xl:overflow-y-auto @xl:border-e", detailOpen && "hidden")}
        >
          {list}
        </section>
        <section
          ref={detailPane}
          tabIndex={-1}
          aria-label={detailLabel}
          data-slot="app-shell-detail"
          className={cn("min-w-0 flex-1 outline-none @xl:block @xl:overflow-y-auto", !detailOpen && "hidden")}
        >
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="m-2 inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 @xl:hidden"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              {backLabel}
            </button>
          ) : null}
          <div className="p-4">{children}</div>
        </section>
      </main>
    </div>
  )
}

function CenteredLayout({ main, fill, title, actions, children }: LayoutProps) {
  return (
    <div className={cn(COLUMN_CLASS, scrollClass(fill))}>
      <header data-slot="app-shell-top-bar" className="sticky top-0 z-10 shrink-0 border-b bg-background px-4">
        <div className="mx-auto flex min-h-14 w-full max-w-2xl items-center gap-2">
          <ShellTitle>{title}</ShellTitle>
          <ShellActions>{actions}</ShellActions>
        </div>
      </header>
      {/* The scrollbar stays at the window's edge while the text keeps a readable measure. */}
      <main {...main} className={MAIN_CLASS}>
        <div className="mx-auto w-full max-w-2xl px-4 py-8">{children}</div>
      </main>
    </div>
  )
}

export { CenteredLayout, SidebarLayout, SplitLayout, TopbarLayout, WIDE_CONTAINER_PX, type MainProps }
