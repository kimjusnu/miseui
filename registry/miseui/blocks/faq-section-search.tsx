import { useRef, useState } from "react"
import { SearchX } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Empty } from "@/registry/miseui/ui/empty"
import { SearchField } from "@/registry/miseui/ui/search-field"
import { faqCountLabel, filterFaq } from "./faq-section-filter"
import { DEFAULT_CONTACT, DEFAULT_COPY, DEFAULT_ITEMS, FaqContactLine, FaqHeading, FaqList, ROOT_CLASS, type FaqContact, type FaqSectionCopyProps } from "./faq-section-parts"

function NoMatches({ query, contact, onClear }: { query: string; contact: FaqContact | null; onClear: () => void }) {
  return (
    <Empty
      variant="dashed"
      icon={<SearchX />}
      title={`No answer for “${query.trim()}”`}
      description="Try a shorter word, or ask us directly."
      className="[overflow-wrap:anywhere]"
      actions={
        <>
          <Button variant="outline" onClick={onClear} className="pointer-coarse:h-10">
            Clear search
          </Button>
          {contact ? (
            <Button asChild variant="ghost" className="pointer-coarse:h-10">
              <a href={contact.href}>{contact.label}</a>
            </Button>
          ) : null}
        </>
      }
    />
  )
}

function FaqSectionSearch({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  items = DEFAULT_ITEMS,
  contact = DEFAULT_CONTACT,
  className,
  ...props
}: FaqSectionCopyProps) {
  const [query, setQuery] = useState("")
  const fieldRef = useRef<HTMLInputElement>(null)
  const matches = filterFaq(items, query)
  const clear = () => {
    setQuery("")
    // The pressed button goes away with the empty state, and focus would fall back to the top of the page with it.
    fieldRef.current?.focus()
  }
  return (
    <section data-slot="faq-section" data-variant="search" className={cn(ROOT_CLASS, "bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 @2xl:py-16">
        <FaqHeading headline={headline} quiet={headlineQuiet} />
        {items.length > 0 ? (
          <div className="flex flex-col gap-4">
            <SearchField ref={fieldRef} variant="large" placeholder="Search questions" value={query} onValueChange={setQuery} />
            {/* Stays mounted through every result count, so a screen reader hears each change. */}
            <p role="status" className="text-[13px] leading-5 text-muted-foreground tabular-nums">
              {faqCountLabel(matches.length, items.length)}
            </p>
            {matches.length > 0 ? (
              <>
                <FaqList
                  items={matches}
                  variant="separated"
                  className="min-w-0"
                  itemClassName="rounded-2xl bg-background dark:bg-card"
                  triggerClassName="min-h-12 rounded-2xl"
                />
                <FaqContactLine contact={contact} className="mt-2" />
              </>
            ) : (
              <NoMatches query={query} contact={contact} onClear={clear} />
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export { FaqSectionSearch }
