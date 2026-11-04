import type * as React from "react"
import { useEffect, useRef } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Sidebar, SidebarContent, SidebarGroup, SidebarItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/registry/miseui/ui/sidebar"
import { TableOfContents } from "@/registry/miseui/ui/table-of-contents"
import { DocsBrand, DocsEmpty, DocsPager, DocsTopBar, PageHeading, PageTocFold, SectionCode, SectionText } from "./docs-layout-parts"
import { useNarrowerThan, usePageArrival, type DocsGroup, type DocsPages } from "./docs-layout-state"

/** Matches @3xl, where the column appears. */
const DRAWER_BELOW_PX = 768

interface DocsCommonProps extends React.ComponentProps<"section"> {
  docs: DocsPages
  brandName: React.ReactNode
  brandHref: string
}

function DocsNav({ docs, groups }: { docs: DocsPages; groups: readonly DocsGroup[] }) {
  return (
    <Sidebar label="Documentation" width={248}>
      <SidebarContent label="Documentation" className="p-3">
        {groups.map((group) => (
          <SidebarGroup key={group.label} label={group.label}>
            {group.pages.map((page) => (
              <SidebarItem key={page.id} href={page.href} active={page.id === docs.page?.id} onClick={() => docs.select(page.id)}>
                {page.title}
              </SidebarItem>
            ))}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

/**
 * The sidebar's drawer has no Radix trigger, so Radix has nothing to hand focus back to after Escape.
 * Skipped when focus already moved on: choosing a page sends it to the new title.
 */
function useDrawerFocusReturn(triggerRef: React.RefObject<HTMLButtonElement | null>) {
  const { drawerOpen } = useSidebar()
  const wasOpenRef = useRef(drawerOpen)
  useEffect(() => {
    const closed = wasOpenRef.current && !drawerOpen
    wasOpenRef.current = drawerOpen
    if (!closed) return
    const id = window.setTimeout(() => {
      const active = document.activeElement
      const stranded = !active || active === document.body || active.closest("[data-slot='drawer']") !== null
      if (stranded) triggerRef.current?.focus()
    })
    return () => window.clearTimeout(id)
  }, [drawerOpen, triggerRef])
}

function NavTrigger() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  useDrawerFocusReturn(triggerRef)
  return <SidebarTrigger ref={triggerRef} aria-label="Pages" className="-ms-2 @3xl:hidden" />
}

function SidebarArticle({ docs }: { docs: DocsPages }) {
  const scrollRef = useRef<HTMLElement>(null)
  const titleRef = usePageArrival(docs.page?.id, scrollRef)
  const page = docs.page
  if (!page) return <DocsEmpty />
  return (
    // relative: anything sr-only inside stays clipped by this scroller instead of widening the page.
    <main ref={scrollRef} className="relative min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] items-start gap-8 px-4 py-8 @3xl:px-8 @5xl:grid-cols-[minmax(0,1fr)_200px] @5xl:gap-12">
        <article className="flex min-w-0 flex-col gap-8">
          <PageHeading page={page} titleRef={titleRef} />
          <PageTocFold page={page} scrollRef={scrollRef} className="@5xl:hidden" />
          {page.sections.map((section) => (
            <section key={section.id} className="flex min-w-0 flex-col gap-3">
              <SectionText section={section} />
              {section.code ? <SectionCode code={section.code} /> : null}
            </section>
          ))}
          <DocsPager docs={docs} />
        </article>
        <aside className="sticky top-8 hidden min-w-0 @5xl:block">
          <TableOfContents variant="line" effect="spring" title="On this page" items={page.sections} scrollRef={scrollRef} />
        </aside>
      </div>
    </main>
  )
}

/** Three columns, for a product with enough pages that people move around: where you are, what you are reading, and what is on this page. */
function DocsSidebar({ docs, groups, brandName, brandHref, className, ...props }: DocsCommonProps & { groups: readonly DocsGroup[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const narrow = useNarrowerThan(rootRef, DRAWER_BELOW_PX)
  return (
    <section ref={rootRef} data-slot="docs-layout" data-variant="sidebar" className={cn("@container flex h-[720px] max-h-dvh w-full flex-col bg-background", className)} {...props}>
      {/* The shortcut stays off: Mod+B belongs to the page, and a docs page has no reason to take it. */}
      <SidebarProvider mobile={narrow} shortcut={false}>
        <DocsTopBar start={<NavTrigger />}>
          <DocsBrand name={brandName} href={brandHref} />
        </DocsTopBar>
        <div className="flex min-h-0 flex-1">
          <DocsNav docs={docs} groups={groups} />
          <SidebarArticle docs={docs} />
        </div>
      </SidebarProvider>
    </section>
  )
}

export { DocsSidebar, type DocsCommonProps }
