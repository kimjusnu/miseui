import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "status",
  title: "Status",
  category: "feedback",
  description: "A state word with a mark that means something: online, away, busy, offline, error or your own, each with its own shape as well as its own hue.",
  why: {
    principle: "Redundant coding",
    explanation:
      "One in twelve men cannot reliably tell red from green, so a coloured dot alone leaves them guessing. Each state here has its own shape and its own word, which also makes the meaning survive a greyscale screenshot or a printed page.",
    avoid:
      "Do not use it for counts or categories; a tag or an indicator fits those. Do not invent a new meaning for a familiar colour, because people read green as fine whatever the word beside it says.",
  },
  designs: [
    {
      name: "dot",
      principle: "Signal to noise",
      use: "Beside a name in a dense list, where the word would repeat on every row. The word stays available to assistive tech.",
    },
    {
      name: "badge",
      principle: "Pre-attentive processing",
      use: "In a table column or a card header, when the state should be found at a glance while scanning.",
    },
    {
      name: "pill",
      principle: "Law of common region",
      use: "On a busy surface such as a header or an image, where a bordered capsule keeps the state together and readable.",
    },
    {
      name: "plain",
      principle: "Figure and ground",
      use: "Inside a sentence or a detail row, with the extra context beside it, where any surface would be too loud.",
    },
  ],
  effects: [
    {
      name: "pulse",
      principle: "Motion marks change",
      use: "Only for a state that is happening right now, such as a live connection or a recording. It stops under reduced motion, and off states never pulse.",
    },
  ],
  usage: `import { Status } from "@/components/ui/status"

<Status state="online" variant="badge" effect="pulse" />
<Status state="away" detail="back at 3 pm" />
<Status state="busy" variant="dot" />
<Status state="custom" tone="warning" variant="pill">Degraded</Status>`,
  exports: ["Status"],
}
