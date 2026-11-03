# Filter Chips

Filters a list you already have: chips with result counts, an all chip, a clear button and dead ends disabled.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/filter-chips.json
```

## Why it looks like this

**Information scent.** A count on each chip tells people what they will get before they press it, so they stop trying filters that lead nowhere. A chip with no results is disabled instead of showing an empty page, and the new total is announced for those who cannot see the list change.

**Don't.** Past about ten options the row becomes the thing to read; use a combobox. For a plain on or off choice with no list behind it, use a toggle group.

## Designs

Pass one as the `variant` prop.

- `pills` (Law of similarity): Above a grid of posts or products, with a handful of short values that wrap onto a second line.
- `underline` (Economy of attention): One quiet line above a list on a phone, where the row should stay one line high and scroll sideways.
- `list` (Alignment): A sidebar of facets in a shop or a directory, where counts in one column are quick to compare.

## Effects

Pass one as the `effect` prop.

- `spring` (Object constancy): Single selection in a short row: one marker slides over, so the eye follows the change instead of finding it again.

## Usage

```tsx
import { FilterChips, useFilterChips } from "@/components/ui/filter-chips"

const { chips, visible } = useFilterChips({ items: posts, getValues: (post) => post.tags, multiple: true })

<FilterChips label="Topic" options={[{ value: "design", label: "Design" }]} {...chips} />
{visible.map((post) => <PostRow key={post.id} {...post} />)}
```

Exports: `FilterChips`, `useFilterChips`, `filterItems`, `countOptions`, `toggleValue`
