import { FilterChips, useFilterChips, type FilterChipsEffect, type FilterChipsVariant } from "@/registry/miseui/ui/filter-chips"

const ARTICLES = [
  { title: "Writing empty states people read", tags: ["design", "writing"] },
  { title: "Why the query planner ignored our index", tags: ["engineering"] },
  { title: "Pricing page, five versions later", tags: ["design", "growth"] },
  { title: "Error messages that say what to do next", tags: ["writing", "engineering"] },
  { title: "Onboarding without a tour", tags: ["design", "growth"] },
] as const

const OPTIONS = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "growth", label: "Growth" },
  { value: "writing", label: "Writing" },
  { value: "legal", label: "Legal" },
] as const

const getTags = (article: (typeof ARTICLES)[number]) => article.tags

interface LibraryProps {
  label: string
  variant?: FilterChipsVariant
  effect?: FilterChipsEffect
  multiple?: boolean
  match?: "any" | "all"
}

function Library({ label, variant, effect, multiple, match }: LibraryProps) {
  const { chips, visible } = useFilterChips({ items: ARTICLES, getValues: getTags, multiple, match })
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <FilterChips label={`Topic, ${label}`} options={OPTIONS} variant={variant} effect={effect} {...chips} />
      <ul className="grid">
        {visible.map((article) => (
          <li key={article.title} className="border-b py-2 text-[13px] leading-5 last:border-b-0">
            {article.title}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Library label="pills" />
      <Library label="underline" variant="underline" />
      <Library label="list, several at once, narrowing" variant="list" multiple match="all" />
      <Library label="spring effect" effect="spring" />
    </div>
  )
}
