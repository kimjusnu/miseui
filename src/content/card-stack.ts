import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "card-stack",
  title: "Card Stack",
  category: "interactions",
  description: "A pile of things with no order: a scattered heap to drag through, a fan that spreads, a swipe to decide on each or notification rows that open into a list.",
  why: {
    principle: "Hick's law",
    explanation:
      "Seeing one thing at a time spares people from comparing everything at once, and a visible pile promises there is more without listing it. The stack holds the height of its tallest card, so nothing around it jumps as the top changes, and cards behind the top stay out of tab order and out of the accessibility tree until they come forward.",
    avoid:
      "Do not use it when the order carries an argument: that is Card Deck, which counts its way through. When people need to compare or find a specific item, show a list or a grid, because anything below the top card is hidden from a search of the eye.",
  },
  designs: [
    {
      name: "pile",
      principle: "Affordance",
      use: "A casual collection such as saved places or recent photos: the scatter looks like something to rummage through, by drag or by pressing Next.",
    },
    {
      name: "fan",
      principle: "Progressive disclosure",
      use: "A few small items in little space, such as plans or team members: closed it takes one card's width, and it spreads on hover, focus or a tap.",
    },
    {
      name: "swipe",
      principle: "Fitts's law",
      use: "A decision per card, such as triage or review: the whole card is the target, it tints toward the choice in fixed colours and words, and real buttons do the same.",
    },
    {
      name: "cascade",
      principle: "Law of common region",
      use: "A set of notifications: rows peek from behind so the count is felt, and opening floats them over the page without moving what is below.",
    },
  ],
  effects: [
    {
      name: "autoplay",
      principle: "Attention capture",
      use: "A quiet showcase with nothing to read closely: the top goes to the back on a timer, stops on hover and focus, and never runs on swipe, where each turn is a decision.",
    },
  ],
  usage: `import { CardStack } from "@/components/ui/card-stack"

const items = [
  { id: "lake", label: "Alpine lake", content: <p>Alpine lake</p> },
  { id: "cabin", label: "Cedar cabin", content: <p>Cedar cabin</p> },
]

<CardStack label="Saved places" items={items} className="max-w-xs" />

<CardStack label="Inbox" variant="cascade" items={items} />

<CardStack
  label="Review drafts"
  variant="swipe"
  items={items}
  labels={{ left: "Reject", right: "Approve" }}
  onDecide={(id, choice) => save(id, choice === "right")}
/>`,
  exports: ["CardStack"],
}
