import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "empty",
  title: "Empty",
  category: "feedback",
  description: "What a list or a search shows when it has nothing: an icon, a plain reason and the next step, centred, in a dashed slot, on a card or in one row.",
  why: {
    principle: "Help users recover",
    explanation:
      "An empty area looks like a fault until something says otherwise. Saying why it is empty and offering the one step out of it turns a dead end into the next move. The title states the fact, the description gives the reason, and the action is the way forward.",
    avoid:
      "Do not use it while data is still loading; that is a skeleton. Do not write jokes or apologies in it, and do not offer an action the person cannot take. For the first screen of a new product, use the Empty State block.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "In the main area of a page, such as search results, where there is already plenty of space around it.",
    },
    {
      name: "dashed",
      principle: "Signifiers",
      use: "Where something can be added, such as a project with no files: the dashed edge marks a slot that is waiting.",
    },
    {
      name: "card",
      principle: "Law of common region",
      use: "In a dashboard grid, where the empty widget should keep the same shape as the filled widgets beside it.",
    },
    {
      name: "compact",
      principle: "Economy of attention",
      use: "In a sidebar, a table section or a dropdown, where one row says enough and a large block would push real content down.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Continuity",
      use: "When results disappear as someone types or filters: the message comes into focus, so it reads as an answer and not as a page that broke.",
    },
  ],
  usage: `import { Empty } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

<Empty
  variant="dashed"
  icon={<FolderPlus />}
  title="No files in this project"
  description="Drop a file here or start from a template."
  actions={<Button size="sm">Upload file</Button>}
/>

<Empty variant="compact" effect="materialize" announce title="No matches" />`,
  exports: ["Empty"],
}
