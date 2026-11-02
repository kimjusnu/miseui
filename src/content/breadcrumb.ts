import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "breadcrumb",
  title: "Breadcrumb",
  category: "navigation",
  description: "A trail from the root to the current page, with a nav landmark, a current marker and a middle that collapses into a menu.",
  why: {
    principle: "Information scent",
    explanation:
      "People arriving from search or a shared link land deep in a site with no sense of where they are. A trail answers that in one line and makes every level above one click away, which is why it stays useful even when the sidebar is closed.",
    avoid:
      "Do not use one on a flat site with two levels; a back link or the main nav already covers it. It shows where a page lives, not the path someone took, so do not fill it with browsing history.",
  },
  designs: [
    {
      name: "chevron",
      principle: "Law of continuity",
      use: "The default for an app or docs page: arrows read as direction, and the plain text stays out of the way of the title.",
    },
    {
      name: "slash",
      principle: "Mental model",
      use: "For developer tools, where a monospace path matches how people already picture a repository or a file.",
    },
    {
      name: "pill",
      principle: "Law of common region",
      use: "On catalogues and filter trails, where each level is a bigger target and there is room to spend on it.",
    },
    {
      name: "back",
      principle: "Hick's law",
      use: "On a phone or a detail view: going up one level is the only choice most people want, so it is the only one shown.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Direct feedback",
      use: "In a header with a few crumbs: one highlight glides along the trail, so it reads as a single control.",
    },
  ],
  usage: `import { Breadcrumb } from "@/components/ui/breadcrumb"

const items = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Atlas", href: "/projects/atlas" },
  { label: "Settings" },
]

<Breadcrumb items={items} />
<Breadcrumb items={items} variant="slash" effect="spring" maxItems={3} />

// With a router
<Breadcrumb items={items} renderLink={(entry, props) => <Link to={entry.href ?? "/"} {...props} />} />`,
  exports: ["Breadcrumb", "collapseItems"],
}
