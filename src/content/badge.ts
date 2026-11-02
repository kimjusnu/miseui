import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "badge",
  title: "Badge",
  category: "core",
  description:
    "Small status chip in five variants; the warm mise variant is reserved for the one item that must stand out.",
  why: {
    principle: "Von Restorff effect",
    explanation:
      "In a row of similar items, the one that differs is the one people notice and remember. Badge ships four quiet variants and one warm mise variant, so you can mark the single item that deserves attention without raising the volume of everything around it.",
    avoid:
      "Do not put the mise variant on more than one badge per view, and do not use a badge as a button. If it needs a click, wrap a link with asChild or use Button.",
  },
  usage: `import { Badge } from "@/components/ui/badge"

<Badge>Draft</Badge>
<Badge variant="mise">New</Badge>
<Badge asChild variant="outline">
  <a href="/changelog">v0.2</a>
</Badge>`,
  exports: ["Badge", "badgeVariants"],
}
