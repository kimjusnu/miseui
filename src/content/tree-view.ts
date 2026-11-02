import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tree-view",
  title: "Tree View",
  category: "display",
  description: "A nested list that opens level by level, with the full keyboard pattern people know from file explorers.",
  why: {
    principle: "Progressive disclosure",
    explanation:
      "A deep hierarchy is unreadable all at once. Showing one level and letting people open the branch they care about keeps their place visible, and indentation says what belongs to what without any extra words.",
    avoid:
      "Do not use it for shallow data: one level is a list and two are usually groups. Do not use it as primary site navigation on a phone, where deep rows run out of width.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "The default for a side panel, where indentation alone carries the structure.",
    },
    {
      name: "lines",
      principle: "Law of continuity",
      use: "For deep hierarchies such as a code folder, where a rule running down each level shows what sits inside what.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "When hundreds of rows have to fit, such as a data catalogue, and icons would only add weight.",
    },
    {
      name: "card",
      principle: "Law of common region",
      use: "When the top level is a few separate things, such as projects, each with its own contents.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Interruptibility",
      use: "When people open and close branches quickly: the height continues from where it is, so a second press reverses instead of jumping.",
    },
  ],
  usage: `import { TreeView } from "@/components/ui/tree-view"

const nodes = [
  { id: "src", label: "src", children: [{ id: "app", label: "App.tsx" }] },
  { id: "remote", label: "Remote files", lazy: true },
]

<TreeView aria-label="Files" nodes={nodes} variant="lines" effect="spring" selectionMode="single" defaultExpanded={["src"]} />

// Lazy: load when a branch opens, then pass its children in nodes.
<TreeView aria-label="Files" nodes={nodes} onExpandedChange={(_, change) => change.expanded && load(change.id)} />`,
  exports: ["TreeView"],
}
