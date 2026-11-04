import { cn } from "@/registry/miseui/lib/utils"
import { TableOfContents } from "@/registry/miseui/ui/table-of-contents"
import { DocsBrand, DocsEmpty, DocsPager, DocsTopBar, PageHeading, SectionCode, SectionText } from "./docs-layout-parts"
import { usePageArrival } from "./docs-layout-state"
import type { DocsCommonProps } from "./docs-layout-sidebar"

/** The sticky bar's 56 px plus a little air, so a heading does not land under it after a jump. */
const BAR_OFFSET_PX = 72

/** One column and no chrome, for a short guide read once from top to bottom. The page itself scrolls, so a phone's browser bar can collapse. */
function DocsCentered({ docs, brandName, brandHref, className, ...props }: DocsCommonProps) {
  const titleRef = usePageArrival(docs.page?.id, undefined)
  const page = docs.page
  return (
    <section data-slot="docs-layout" data-variant="centered" className={cn("@container relative flex min-h-[640px] w-full flex-col bg-background", className)} {...props}>
      <div className="sticky top-0 z-10">
        <DocsTopBar>
          <DocsBrand name={brandName} href={brandHref} />
        </DocsTopBar>
      </div>
      {page ? (
        <main className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-12 px-4 py-12 @3xl:py-16">
          <div className="flex min-w-0 flex-col gap-8">
            <PageHeading page={page} titleRef={titleRef} />
            <div className="rounded-2xl bg-muted p-4">
              <TableOfContents variant="dots" title="In this guide" label="In this guide" items={page.sections} scrollOffset={BAR_OFFSET_PX} />
            </div>
          </div>
          {page.sections.map((section) => (
            <section key={section.id} className="flex min-w-0 flex-col gap-3">
              <SectionText section={section} scrollMargin="scroll-mt-20" />
              {section.code ? <SectionCode code={section.code} /> : null}
            </section>
          ))}
          <DocsPager docs={docs} />
        </main>
      ) : (
        <DocsEmpty />
      )}
    </section>
  )
}

export { DocsCentered }
