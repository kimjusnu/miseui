import type * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { CodeBlock } from "@/registry/miseui/ui/code-block"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/miseui/ui/collapsible"
import { TableOfContents } from "@/registry/miseui/ui/table-of-contents"
import type { DocsCode, DocsPage, DocsPages, DocsSection } from "./docs-layout-state"

const PROSE_CLASS = "flex flex-col gap-3 text-[15px] leading-relaxed text-pretty text-foreground/85"

function DocsBrand({ name, href }: { name: React.ReactNode; href: string }) {
  return (
    <a href={href} className="inline-flex min-h-10 items-center rounded-md text-[15px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      {name}
    </a>
  )
}

function DocsTopBar({ start, children }: { start?: React.ReactNode; children: React.ReactNode }) {
  return (
    <header data-slot="docs-layout-bar" className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      {start}
      {children}
    </header>
  )
}

/** Two tones in one sentence. The heading is focusable so a new page can announce itself. */
function PageHeading({ page, titleRef }: { page: DocsPage; titleRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <h1 ref={titleRef} tabIndex={-1} className="text-display text-3xl leading-[1.12]! text-balance outline-none @3xl:text-4xl">
      {page.lead ? (
        <>
          {page.title}. <span className="text-muted-foreground">{page.lead}</span>
        </>
      ) : (
        page.title
      )}
    </h1>
  )
}

function SectionCode({ code }: { code: DocsCode }) {
  return <CodeBlock variant="window" title={code.title} label={code.title ?? "Code"} code={code.code} language={code.language} />
}

function SectionText({ section, scrollMargin = "scroll-mt-4" }: { section: DocsSection; scrollMargin?: string }) {
  return (
    <>
      <h2 id={section.id} className={cn("text-title text-xl text-balance outline-none", scrollMargin)}>
        {section.title}
      </h2>
      <div className={PROSE_CLASS}>{section.body}</div>
    </>
  )
}

/** Folds into one row above the article when the side column has no room. Stays open after a jump: closing it would move the text being scrolled to. */
function PageTocFold({ page, scrollRef, className }: { page: DocsPage; scrollRef?: React.RefObject<HTMLElement | null>; className?: string }) {
  return (
    <Collapsible variant="card" className={cn("min-w-0 rounded-2xl", className)}>
      <CollapsibleTrigger className="rounded-2xl pointer-coarse:min-h-10">On this page</CollapsibleTrigger>
      <CollapsibleContent>
        <TableOfContents variant="plain" items={page.sections} scrollRef={scrollRef} />
      </CollapsibleContent>
    </Collapsible>
  )
}

function PagerLink({ page, direction, onSelect }: { page: DocsPage; direction: "previous" | "next"; onSelect: (id: string) => void }) {
  const next = direction === "next"
  const className = cn(
    "flex min-h-14 min-w-0 flex-col justify-center gap-0.5 rounded-2xl border px-4 py-2 text-start outline-none",
    "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
    next && "col-start-2 items-end text-end",
  )
  const body = (
    <>
      <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">
        {next ? null : <ArrowLeft aria-hidden="true" className="size-3" />}
        {next ? "Next" : "Previous"}
        {next ? <ArrowRight aria-hidden="true" className="size-3" /> : null}
      </span>
      <span className="max-w-full text-sm font-medium wrap-break-word">{page.title}</span>
    </>
  )
  if (page.href) {
    return (
      <a href={page.href} className={className} onClick={() => onSelect(page.id)}>
        {body}
      </a>
    )
  }
  return (
    <button type="button" className={className} onClick={() => onSelect(page.id)}>
      {body}
    </button>
  )
}

function DocsPager({ docs }: { docs: DocsPages }) {
  if (!docs.previous && !docs.next) return null
  return (
    <nav aria-label="Pages" className="grid grid-cols-2 gap-3 border-t pt-8">
      {docs.previous ? <PagerLink page={docs.previous} direction="previous" onSelect={docs.select} /> : null}
      {docs.next ? <PagerLink page={docs.next} direction="next" onSelect={docs.select} /> : null}
    </nav>
  )
}

/** A docs block with no pages yet still says so, instead of a blank frame. */
function DocsEmpty() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
      <p className="text-[15px] text-muted-foreground">There are no pages here yet.</p>
    </div>
  )
}

export { DocsBrand, DocsEmpty, DocsPager, DocsTopBar, PageHeading, PageTocFold, SectionCode, SectionText }
