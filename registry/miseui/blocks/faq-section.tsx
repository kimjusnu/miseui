import { cn } from "@/registry/miseui/lib/utils"
import type { FaqItem } from "./faq-section-filter"
import { DEFAULT_CONTACT, DEFAULT_COPY, DEFAULT_ITEMS, FaqContactLine, FaqHeading, FaqList, ROOT_CLASS, type FaqContact, type FaqSectionCopyProps } from "./faq-section-parts"
import { FaqSectionSearch } from "./faq-section-search"

type FaqSectionVariant = "accordion" | "split" | "search"

interface FaqSectionProps extends FaqSectionCopyProps {
  /** `accordion` a short list on one plate, `split` a longer list beside a heading that stays in view, `search` a filter box for a list too long to scan. Anything else is `accordion`. */
  variant?: FaqSectionVariant
}

function FaqSectionAccordion({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  items = DEFAULT_ITEMS,
  contact = DEFAULT_CONTACT,
  className,
  ...props
}: FaqSectionCopyProps) {
  return (
    <section data-slot="faq-section" data-variant="accordion" className={cn(ROOT_CLASS, "bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 @2xl:py-16">
        <FaqHeading headline={headline} quiet={headlineQuiet} className="@2xl:text-center" />
        <FaqList items={items} variant="card" defaultOpen={items[0]?.id} className="rounded-2xl bg-background dark:bg-card" triggerClassName="min-h-12 @xl:px-6" panelClassName="@xl:px-6" />
        <FaqContactLine contact={contact} className="@2xl:text-center" />
      </div>
    </section>
  )
}

function FaqSectionSplit({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  items = DEFAULT_ITEMS,
  contact = DEFAULT_CONTACT,
  className,
  ...props
}: FaqSectionCopyProps) {
  return (
    <section data-slot="faq-section" data-variant="split" className={cn(ROOT_CLASS, "bg-background", className)} {...props}>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-start gap-8 px-4 py-12 @2xl:px-8 @2xl:py-16 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @4xl:gap-16">
        {/* Stays in view while a long list scrolls past, so the way to support is never far. */}
        <div data-slot="faq-section-aside" className="flex flex-col gap-6 @4xl:sticky @4xl:top-8">
          <FaqHeading headline={headline} quiet={headlineQuiet} className="text-3xl @2xl:text-3xl" />
          <FaqContactLine contact={contact} />
        </div>
        <FaqList items={items} variant="plain" defaultOpen={items[0]?.id} className="min-w-0 border-t" triggerClassName="min-h-12 py-4" />
      </div>
    </section>
  )
}

function FaqSection({ variant, ...props }: FaqSectionProps) {
  switch (variant) {
    case "split":
      return <FaqSectionSplit {...props} />
    case "search":
      return <FaqSectionSearch {...props} />
    default:
      return <FaqSectionAccordion {...props} />
  }
}

export { FaqSection, type FaqContact, type FaqItem, type FaqSectionProps, type FaqSectionVariant }
