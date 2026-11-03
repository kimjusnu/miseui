import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "filter-chips",
  title: "Filter Chips",
  category: "forms",
  description: "Filters a list you already have: chips with result counts, an all chip, a clear button and dead ends disabled.",
  why: {
    principle: "Information scent",
    explanation:
      "A count on each chip tells people what they will get before they press it, so they stop trying filters that lead nowhere. A chip with no results is disabled instead of showing an empty page, and the new total is announced for those who cannot see the list change.",
    avoid:
      "Past about ten options the row becomes the thing to read; use a combobox. For a plain on or off choice with no list behind it, use a toggle group.",
  },
  designs: [
    {
      name: "pills",
      principle: "Law of similarity",
      use: "Above a grid of posts or products, with a handful of short values that wrap onto a second line.",
    },
    {
      name: "underline",
      principle: "Economy of attention",
      use: "One quiet line above a list on a phone, where the row should stay one line high and scroll sideways.",
    },
    {
      name: "list",
      principle: "Alignment",
      use: "A sidebar of facets in a shop or a directory, where counts in one column are quick to compare.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Object constancy",
      use: "Single selection in a short row: one marker slides over, so the eye follows the change instead of finding it again.",
    },
  ],
  usage: `import { FilterChips, useFilterChips } from "@/components/ui/filter-chips"

const { chips, visible } = useFilterChips({ items: posts, getValues: (post) => post.tags, multiple: true })

<FilterChips label="Topic" options={[{ value: "design", label: "Design" }]} {...chips} />
{visible.map((post) => <PostRow key={post.id} {...post} />)}`,
  exports: ["FilterChips", "useFilterChips", "filterItems", "countOptions", "toggleValue"],
}
