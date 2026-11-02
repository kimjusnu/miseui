# Breadcrumb

A trail from the root to the current page, with a nav landmark, a current marker and a middle that collapses into a menu.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/breadcrumb.json
```

## Why it looks like this

**Information scent.** People arriving from search or a shared link land deep in a site with no sense of where they are. A trail answers that in one line and makes every level above one click away, which is why it stays useful even when the sidebar is closed.

**Don't.** Do not use one on a flat site with two levels; a back link or the main nav already covers it. It shows where a page lives, not the path someone took, so do not fill it with browsing history.

## Designs

Pass one as the `variant` prop.

- `chevron` (Law of continuity): The default for an app or docs page: arrows read as direction, and the plain text stays out of the way of the title.
- `slash` (Mental model): For developer tools, where a monospace path matches how people already picture a repository or a file.
- `pill` (Law of common region): On catalogues and filter trails, where each level is a bigger target and there is room to spend on it.
- `back` (Hick's law): On a phone or a detail view: going up one level is the only choice most people want, so it is the only one shown.

## Effects

Pass one as the `effect` prop.

- `spring` (Direct feedback): In a header with a few crumbs: one highlight glides along the trail, so it reads as a single control.

## Usage

```tsx
import { Breadcrumb } from "@/components/ui/breadcrumb"

const items = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Atlas", href: "/projects/atlas" },
  { label: "Settings" },
]

<Breadcrumb items={items} />
<Breadcrumb items={items} variant="slash" effect="spring" maxItems={3} />

// With a router
<Breadcrumb items={items} renderLink={(entry, props) => <Link to={entry.href ?? "/"} {...props} />} />
```

Exports: `Breadcrumb`, `collapseItems`
