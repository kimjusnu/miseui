import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tabs",
  title: "Tabs",
  category: "navigation",
  description:
    "Segmented control that swaps one panel for another in place, so related views share a single spot on the screen.",
  why: {
    principle: "Chunking",
    explanation:
      "People hold a handful of groups in working memory, not forty items. Tabs cut a dense screen into named chunks the user can scan in one line, and the active pill settles in 150 ms so the switch registers as a view change rather than a page load.",
    avoid:
      "Do not use tabs when the user needs to compare two panels at once, or for steps that must be completed in order. Never put a required field behind an inactive tab; hidden panels are easy to forget.",
  },
  effects: [
    {
      name: "spring",
      principle: "Object constancy",
      use: "Use it for page-level tabs, where one quiet underline travelling between labels shows that the view moved rather than was replaced.",
    },
    {
      name: "pill",
      principle: "Figure-ground",
      use: "Use it for a small segmented control that is the main choice in its area, where a filled accent makes the current option readable from across the screen.",
    },
  ],
  usage: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview panel</TabsContent>
  <TabsContent value="activity">Activity panel</TabsContent>
</Tabs>

// Add effect="spring" or effect="pill" to <Tabs> and the active marker slides between triggers on a spring.`,
  exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
}
