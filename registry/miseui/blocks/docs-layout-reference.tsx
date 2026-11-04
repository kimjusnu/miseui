import { useRef } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { TableOfContents } from "@/registry/miseui/ui/table-of-contents"
import { DocsBrand, DocsEmpty, DocsPager, DocsTopBar, PageHeading, PageTocFold, SectionCode, SectionText } from "./docs-layout-parts"
import type { DocsCommonProps } from "./docs-layout-sidebar"
import { usePageArrival, type DocsPages } from "./docs-layout-state"

function ReferenceBody({ docs }: { docs: DocsPages }) {
  const scrollRef = useRef<HTMLElement>(null)
  const titleRef = usePageArrival(docs.page?.id, scrollRef)
  const page = docs.page
  if (!page) return <DocsEmpty />
  return (
    <div className="flex min-h-0 flex-1">
      <div className="hidden w-56 shrink-0 overflow-y-auto border-e p-4 @4xl:block">
        <TableOfContents variant="line" effect="spring" label="On this page" title={page.title} items={page.sections} scrollRef={scrollRef} />
      </div>
      {/* relative: anything sr-only inside stays clipped by this scroller instead of widening the page. */}
      <main ref={scrollRef} className="relative min-w-0 flex-1 overflow-y-auto">
        <div className="flex min-w-0 flex-col gap-8 px-4 py-8 @3xl:px-8">
          <PageHeading page={page} titleRef={titleRef} />
          <PageTocFold page={page} scrollRef={scrollRef} className="@4xl:hidden" />
          {page.sections.map((section) => (
            <section key={section.id} data-testid="reference-row" className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 border-t pt-8 @5xl:grid-cols-2 @5xl:gap-8">
              <div className="flex min-w-0 flex-col gap-3">
                <SectionText section={section} />
              </div>
              {/* Stays beside its text while a long explanation scrolls, which is the whole reason for two columns. */}
              {section.code ? (
                <div className="min-w-0 @5xl:sticky @5xl:top-4">
                  <SectionCode code={section.code} />
                </div>
              ) : null}
            </section>
          ))}
          <DocsPager docs={docs} />
        </div>
      </main>
    </div>
  )
}

/** Text beside its code, for people who came to copy something and want the explanation in the same glance. */
function DocsReference({ docs, brandName, brandHref, className, ...props }: DocsCommonProps) {
  return (
    <section data-slot="docs-layout" data-variant="reference" className={cn("@container flex h-[720px] max-h-dvh w-full flex-col bg-background", className)} {...props}>
      <DocsTopBar>
        <DocsBrand name={brandName} href={brandHref} />
      </DocsTopBar>
      <ReferenceBody docs={docs} />
    </section>
  )
}

export { DocsReference }
