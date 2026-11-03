import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "timeline",
  title: "Timeline",
  category: "display",
  description: "Events in order with time, title, detail and a status that keeps its meaning under any accent, down a rail, on two sides, as one-liners or across a row.",
  why: {
    principle: "Law of continuity",
    explanation:
      "A line through the markers makes separate events read as one story, and the eye follows it without being told the order. Status colours stay fixed whatever the accent is, so a failure still looks like a failure, and most markers stay soft so the one that matters can be seen from a distance.",
    avoid:
      "Do not use it for a process with steps still to do; that is Steps, which shows what comes next. Do not use it for a long log people search or filter, which belongs in a table. Do not colour every event: if everything is loud, nothing is.",
  },
  designs: [
    {
      name: "vertical",
      principle: "Law of proximity",
      use: "The default for order history and audit trails, where each event has time, a title and a line of detail.",
    },
    {
      name: "alternate",
      principle: "Rhythm and balance",
      use: "For a story told on a wide page, such as a company history. Below 512 px of container it folds to one side by itself.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "For an activity feed in a side panel, one line per event with the time lined up on the right.",
    },
    {
      name: "horizontal",
      principle: "Spatial mapping",
      use: "For a few milestones across the top of a page, where left to right already reads as time. It scrolls inside itself when narrow.",
    },
  ],
  effects: [
    {
      name: "draw",
      principle: "Goal gradient",
      use: "On a page people scroll through once, such as a story or a launch history: each stretch of the line grows as it comes into view.",
    },
  ],
  usage: `import { Timeline } from "@/components/ui/timeline"

<Timeline
  aria-label="Order history"
  effect="draw"
  events={[
    { time: "2 Nov, 14:02", dateTime: "2026-11-02T14:02", title: "Order placed", status: "success" },
    { time: "3 Nov, 09:12", title: "Delivery failed", body: "Nobody home", status: "error" },
    { time: "Today", title: "Second attempt", status: "current" },
  ]}
/>`,
  exports: ["Timeline"],
}
